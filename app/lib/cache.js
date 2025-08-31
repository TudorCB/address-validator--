/**
 * Cache adapter with Redis when available, in-memory fallback otherwise.
 */
import { getRedis } from "./redis.js";

const metrics = { get: 0, hit: 0, miss: 0, set: 0 };

const memory = new Map();

export async function cacheGet(key) {
  if (!key) return null;
  metrics.get++;
  const r = getRedis();
  if (r) {
    try {
      const raw = await r.get(key);
      if (raw == null) return null;
      try {
        const parsed = JSON.parse(raw);
        metrics.hit++;
        return parsed;
      } catch {
        metrics.hit++;
        return raw;
      }
    } catch (e) {
      console.error("[cache] redis get error", e?.message || e);
      // fall through to memory as a soft fallback
    }
  }

  const hit = memory.get(key);
  if (!hit) return null;
  const { value, expiresAt } = hit;
  if (expiresAt && Date.now() > expiresAt) {
    memory.delete(key);
    return null;
  }
  metrics.hit++;
  return value;
}

export async function cacheSet(key, value, ttlSeconds = 86400) {
  if (!key) return;
  metrics.set++;
  const r = getRedis();
  if (r) {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await r.set(key, serialized, "EX", Math.floor(ttlSeconds));
      } else {
        await r.set(key, serialized);
      }
      return;
    } catch (e) {
      console.error("[cache] redis set error", e?.message || e);
      // fall through to memory as a soft fallback
    }
  }

  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
  memory.set(key, { value, expiresAt });
}

export function snapshotCacheMetrics() {
  const miss = Math.max(0, metrics.get - metrics.hit);
  const hitRate = metrics.get > 0 ? Math.round((metrics.hit / metrics.get) * 100) : 0;
  return { ...metrics, miss, hitRate };
}
