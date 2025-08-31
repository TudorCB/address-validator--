export async function withRetry(fn, { retries = 2, baseDelayMs = 200 } = {}) {
  let attempt = 0, lastErr;
  while (attempt <= retries) {
    try { return await fn(); } catch (e) { lastErr = e; }
    await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    attempt++;
  }
  throw lastErr;
}

let circuit = { open: false, openedAt: 0 };
export function withCircuitBreaker(fn, { failThreshold = 5, cooldownMs = 30_000 } = {}) {
  let fails = 0;
  return async (...args) => {
    if (circuit.open && (Date.now() - circuit.openedAt) < cooldownMs) {
      const err = new Error("CIRCUIT_OPEN");
      err.code = "CIRCUIT_OPEN";
      throw err;
    }
    try {
      const res = await fn(...args);
      fails = 0; circuit.open = false;
      return res;
    } catch (e) {
      fails++;
      if (fails >= failThreshold) { circuit.open = true; circuit.openedAt = Date.now(); }
      throw e;
    }
  };
}

