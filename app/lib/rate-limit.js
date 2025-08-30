/**
 * Simple per-key token bucket in memory (dev-friendly).
 * In production, replace with a shared store (Redis).
 */
const buckets = new Map();

export function rateLimit({ key, max = 300, windowMs = 60_000 }) {
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > b.resetAt) {
    b.count = 0;
    b.resetAt = now + windowMs;
  }
  b.count += 1;
  buckets.set(key, b);
  const remaining = Math.max(0, max - b.count);
  const allowed = b.count <= max;
  return { allowed, remaining, resetAt: b.resetAt };
}

