import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "vibedwork-dev-secret";
const PASSWORD_ITERATIONS = 120000;

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return hashPassword(password, salt) === stored;
}

export function signSession(payload: { userId: string; role: string }) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySession(token: string | undefined | null) {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  if (expected !== signature) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as {
      userId: string;
      role: string;
    };
  } catch {
    return null;
  }
}
