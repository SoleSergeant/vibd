import crypto from "crypto";

const PASSWORD_ITERATIONS = 120000;
export const SESSION_COOKIE = "vibedwork_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

let warnedShortSecret = false;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret === "change-this-secret") {
    // A missing or placeholder secret would let anyone forge a session cookie.
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set to a long random string in production.");
    }
    return "vibedwork-dev-secret-not-for-production";
  }
  if (secret.length < 32 && !warnedShortSecret) {
    warnedShortSecret = true;
    console.warn("SESSION_SECRET is shorter than 32 characters; generate a longer random value.");
  }
  return secret;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return safeEqual(hashPassword(password, salt), stored);
}

type SessionPayload = { userId: string; role: string; exp: number };

function sign(data: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

export function signSession(payload: { userId: string; role: string }) {
  const body: SessionPayload = { ...payload, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifySession(token: string | undefined | null) {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature || !safeEqual(sign(data), signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  };
}
