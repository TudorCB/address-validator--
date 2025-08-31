const buckets = new Map();
export function rateLimitShop({ shopDomain, max = 600, windowMs = 60_000 }) {
  const now = Date.now();
  const key = `shop:${shopDomain}`;
  const p = buckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > p.resetAt) { p.count = 0; p.resetAt = now + windowMs; }
  p.count += 1;
  buckets.set(key, p);
  return { allowed: p.count <= max, resetAt: p.resetAt };
}

