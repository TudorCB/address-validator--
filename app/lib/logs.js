/**
 * Very simple in-memory logs. In production, write to DB or Redis stream.
 */
const store = [];
let seq = 1;

export function writeLog(entry) {
  const row = {
    id: String(seq++),
    ts: Date.now(),
    ...entry
  };
  store.push(row);
  // Trim to last 1000 entries
  if (store.length > 1000) store.splice(0, store.length - 1000);
  return row;
}

export function readLogs({ limit = 100, filter = null } = {}) {
  let out = [...store].reverse();
  if (filter) out = out.filter(filter);
  return out.slice(0, limit);
}

