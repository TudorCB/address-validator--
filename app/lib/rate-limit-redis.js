import { getRedis } from "./redis.js";

// Sliding-window bucket per key using Redis INCR/EXPIRE with window-sized buckets
export async function rateLimitKey({ key, max = 300, windowSec = 60 }) {
  const r = getRedis();
  const resetAtMs = Date.now() + windowSec * 1000;
  if (!r) return { allowed: true, resetAt: resetAtMs };
  const now = Math.floor(Date.now() / 1000);
  const bucket = `rl:${key}:${Math.floor(now / windowSec)}`;
  const c = await r.incr(bucket);
  if (c === 1) await r.expire(bucket, windowSec);
  return { allowed: c <= max, resetAt: (Math.floor(now / windowSec) + 1) * 1000 * windowSec };
}

