/**
 * Cache adapter with Redis when available, in-memory fallback otherwise.
 */
import { getRedis } from "./redis.js";

const memory = new Map();

export async function cacheGet(key) {
  if (!key) return null;
  const r = getRedis();
  if (r) {
    try {
      const raw = await r.get(key);
      if (raw == null) return null;
      try {
        return JSON.parse(raw);
      } catch {
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
  return value;
}

export async function cacheSet(key, value, ttlSeconds = 86400) {
  if (!key) return;
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
