/**
 * DPV adapter facade. In production, call USPS/UPS APIs here.
 * For now, implement a stub that infers missing secondary from common patterns,
 * and allows easy provider swap later.
 */
export async function dpvValidate(address, { carriers = ["USPS"], timeoutMs = 2500 } = {}) {
  // TODO: Replace with real DPV calls. Simulate outputs for now.
  const a1 = (address?.address1 || "").toUpperCase();

  const poBox = /^P(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b/.test(a1);
  const likelyMultiUnit = /\b(APT|UNIT|SUITE|STE|#)\b/.test(a1) || /BLDG|FL|FLOOR/.test(a1);
  const isMissingSecondary = !poBox && !/\b(APT|UNIT|SUITE|STE|#)\b/.test(address?.address2 || "") && /(?:\b#\s*$)|(?:\bAPT\s*$)/.test(a1) === false;

  // Simulate deliverability & flags.
  return {
    deliverable: !poBox,
    missingSecondary: likelyMultiUnit && isMissingSecondary,
    poBox,
    ambiguous: false,
    provider: carriers[0],
    providerResponseId: `stub-${Date.now()}`,
    meta: {}
  };
}

export function mapDpvToAction(flags, settings) {
  if (flags.poBox && settings.blockPoBoxes) return { action: "BLOCK_PO_BOX", message: "PO Boxes are not accepted for shipping." };
  if (flags.missingSecondary) return { action: "BLOCK_MISSING_UNIT", message: "Apartment or unit is required for this address." };
  if (flags.deliverable === false) return { action: "BLOCK_UNDELIVERABLE", message: "Carrier reports this address as undeliverable." };
  return { action: "OK", message: "Address appears deliverable." };
}

