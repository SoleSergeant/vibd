import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window in-memory limiter. Per server instance only, so it slows abuse rather than
 * guaranteeing a global cap; swap for Redis/Upstash if you need that.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** 20 AI calls per user per minute. */
export function aiRateLimited(userId: string) {
  return rateLimit(`ai:${userId}`, 20, 60_000)
    ? null
    : NextResponse.json({ error: "Too many AI requests. Please wait a minute and try again." }, { status: 429 });
}
