/**
 * Cache adapter with in-memory fallback.
 * Later: swap to Redis using REDIS_URL.
 */
const memory = new Map();

export async function cacheGet(key) {
  if (!key) return null;
  const hit = memory.get(key);
  if (!hit) return null;
  const { value, expiresAt } = hit;
  if (expiresAt && Date.now() > expiresAt) {
    memory.delete(key);
    return null;
  }
  return value;
}

export async function cacheSet(key, value, ttlSeconds = 86400) {
  if (!key) return;
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
  memory.set(key, { value, expiresAt });
}
