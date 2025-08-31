import { uspsDpv } from "./dpv.providers/usps.js";
import { easypostDpv } from "./dpv.providers/easypost.js";
import { shippoDpv } from "./dpv.providers/shippo.js";
import { recordProvider } from "./metrics.js";

/**
 * Unified DPV interface.
 * Returns: { flags: { deliverable, missingSecondary, ambiguous, poBox }, normalized, provider, providerResponseId, raw }
 */
export async function dpvValidate(address, opts = {}) {
  const timeoutMs = Number(process.env.DPV_TIMEOUT_MS || 3000);
  const provider = String(process.env.DPV_PROVIDER || "stub").toLowerCase();

  const start = Date.now();
  try {
    let result;
    if (provider === "usps") result = await uspsDpv(address, { timeoutMs, ...opts });
    else if (provider === "easypost") result = await easypostDpv(address, { timeoutMs, ...opts });
    else if (provider === "shippo") result = await shippoDpv(address, { timeoutMs, ...opts });
    else result = stubDpv(address);
    recordProvider(true, Date.now() - start);
    return result;
  } catch (e) {
    recordProvider(false, Date.now() - start);
    // degrade to stubbed heuristics on failure
    return stubDpv(address);
  }
}

function stubDpv(address = {}) {
  const a1 = String(address?.address1 || "");
  const poBox = /^P(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b/i.test(a1);
  const looksMulti = /\b(APT|UNIT|SUITE|STE|BLDG|FL|FLOOR|#)\b/i.test(a1);
  const hasSecondary = /\S/.test(String(address?.address2 || ""));
  const missingSecondary = looksMulti && !hasSecondary;

  return {
    flags: { deliverable: !poBox, missingSecondary, ambiguous: false, poBox },
    normalized: { ...address },
    provider: "stub",
    providerResponseId: `stub-${Date.now()}`,
    raw: {},
  };
}

export function mapDpvToAction(flags, settings) {
  if (flags.poBox && settings.blockPoBoxes) {
    return { action: "BLOCK_PO_BOX", message: "PO Boxes are not accepted for shipping." };
  }
  if (flags.missingSecondary) {
    return { action: "BLOCK_MISSING_UNIT", message: "Apartment or unit is required for this address." };
  }
  if (flags.deliverable === false) {
    return { action: "BLOCK_UNDELIVERABLE", message: "Carrier reports this address as undeliverable." };
  }
  return { action: "OK", message: "Address appears deliverable." };
}
