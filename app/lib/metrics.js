const m = { provider: { ok: 0, fail: 0, latencyMs: [] } };

export function recordProvider(ok, latency) {
  try {
    if (ok) m.provider.ok++; else m.provider.fail++;
    if (Number.isFinite(latency)) m.provider.latencyMs.push(Number(latency));
  } catch {}
}

export function snapshotMetrics() {
  const lat = m.provider.latencyMs;
  const p50 = lat.length ? [...lat].sort((a,b)=>a-b)[Math.floor(lat.length*0.5)] : null;
  return { provider: { ok: m.provider.ok, fail: m.provider.fail, p50 } };
}

