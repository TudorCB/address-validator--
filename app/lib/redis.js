import Redis from "ioredis";

let client;

export function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  client = new Redis(url, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
  client.on("error", (e) => console.error("[redis] error", e?.message));
  return client;
}

