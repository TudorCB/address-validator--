import { withRetry } from "../http-retry.js";

function poBoxDetect(address1 = "") {
  return /^P(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b/i.test(String(address1).trim());
}

export async function shippoDpv(
  address,
  { timeoutMs = Number(process.env.DPV_TIMEOUT_MS || 3000), token = process.env.SHIPPO_API_TOKEN } = {}
) {
  if (!token) throw new Error("SHIPPO_API_TOKEN_MISSING");

  const payload = {
    name: "",
    company: "",
    street1: address.address1 || "",
    street2: address.address2 || "",
    city: address.city || "",
    state: address.province || address.provinceCode || "",
    zip: address.zip || "",
    country: address.country || "US",
    validate: true,
  };

  const fetchOnce = async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.goshippo.com/addresses/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `ShippoToken ${token}`,
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (!res.ok) {
        const err = new Error(`SHIPPO_${res.status}`);
        err.body = json;
        throw err;
      }
      return json;
    } finally {
      clearTimeout(t);
    }
  };

  const out = await withRetry(fetchOnce, { retries: 2, baseDelayMs: 250 });

  const isValid = !!out?.validation_results?.is_valid;
  const messages = out?.validation_results?.messages || [];

  const missingSecondary = messages.some((m) => /secondary|apartment|unit|required/i.test(m?.text || ""));
  const poBox = poBoxDetect(address.address1);

  const normalized = {
    address1: out?.street1 || address.address1 || "",
    address2: out?.street2 || "",
    city: out?.city || address.city || "",
    province: out?.state || address.province || address.provinceCode || "",
    zip: out?.zip || address.zip || "",
    country: out?.country || address.country || "US",
  };

  return {
    flags: {
      deliverable: isValid && !poBox,
      missingSecondary,
      ambiguous: false,
      poBox,
    },
    normalized,
    provider: "shippo",
    providerResponseId: out?.object_id || null,
    raw: { messages },
  };
}

