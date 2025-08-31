/**
 * EasyPost Address Verification API
 * - POST https://api.easypost.com/v2/addresses (with verify[]=delivery)
 * - Response: address.verifications.delivery.success + errors
 */
import { withRetry } from "../http-retry.js";

function poBoxDetect(address1 = "") {
  return /^P(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b/i.test(String(address1).trim());
}

export async function easypostDpv(
  address,
  { timeoutMs = Number(process.env.DPV_TIMEOUT_MS || 3000), apiKey = process.env.EASYPOST_API_KEY } = {}
) {
  if (!apiKey) throw new Error("EASYPOST_API_KEY_MISSING");

  const payload = {
    address: {
      street1: address.address1 || "",
      street2: address.address2 || "",
      city: address.city || "",
      state: address.province || address.provinceCode || "",
      zip: address.zip || "",
      country: address.country || "US",
      verify: ["delivery"],
    },
  };

  const basic = Buffer.from(`${apiKey}:`).toString("base64");

  const fetchOnce = async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.easypost.com/v2/addresses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Basic " + basic,
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (!res.ok) {
        const err = new Error(`EASYPOST_${res.status}`);
        err.body = json;
        throw err;
      }
      return json;
    } finally {
      clearTimeout(t);
    }
  };

  const out = await withRetry(fetchOnce, { retries: 2, baseDelayMs: 250 });

  const addr = out || {};
  const ver = addr.verifications?.delivery || {};
  const success = !!ver.success;
  const errors = ver.errors || [];
  const poBox = poBoxDetect(address.address1);

  // Infer missing secondary if error messages indicate requirement
  const missingSecondary = errors.some((e) => /secondary|apartment|unit|required/i.test(e?.message || ""));

  const normalized = {
    address1: addr.street1 || address.address1 || "",
    address2: addr.street2 || "",
    city: addr.city || address.city || "",
    province: addr.state || address.province || address.provinceCode || "",
    zip: addr.zip || address.zip || "",
    country: addr.country || address.country || "US",
  };

  return {
    flags: {
      deliverable: success && !poBox,
      missingSecondary,
      ambiguous: false,
      poBox,
    },
    normalized,
    provider: "easypost",
    providerResponseId: addr.id || null,
    raw: { errors },
  };
}

