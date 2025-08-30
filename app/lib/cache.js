/**
 * Cache adapter (Redis stub).
 */
export async function cacheGet(_key) {
  // TODO: connect to Redis; return null stub
  return null;
}
export async function cacheSet(_key, _value, _ttlSeconds = 86400) {
  // TODO: connect to Redis; log only
  console.log("[cache:set]", _key, "(ttl:", _ttlSeconds, "s)");
}

