/**
 * DPV facade. Replace 'stubDpv' with USPS/UPS implementations.
 * Return shape is provider-agnostic.
 */
export async function dpvValidate(address, { provider = "stub", timeoutMs = 2500 } = {}) {
  if (provider === "stub") return stubDpv(address);
  // In production: branch here to USPS/UPS modules, with timeouts & retries
  return stubDpv(address);
}

function stubDpv(address = {}) {
  const a1 = String(address.address1 || "").toUpperCase();
  const addr2 = String(address.address2 || "");

  const poBox = /^P(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b/.test(a1);
  // naive multi-unit heuristics for stub only
  const looksMulti = /\b(APT|UNIT|SUITE|STE|BLDG|FL|FLOOR|#)\b/.test(a1);
  const hasSecondary = /\S/.test(addr2);
  const missingSecondary = looksMulti && !hasSecondary;

  return {
    deliverable: !poBox,                 // stub: PO Box => not deliverable for ground
    missingSecondary,                    // Apt/Unit required
    poBox,
    ambiguous: false,
    vacant: false,
    cmra: false,
    provider: "stub",
    providerResponseId: `stub-${Date.now()}`,
    meta: {}
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
