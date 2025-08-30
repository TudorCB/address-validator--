import { validateWithGoogle, extractLatLng, buildStaticMapUrl } from "./google.js";
import { normalizeAddress } from "./address-normalize.js";
import { getSettings } from "./settings.js";

function isPoBox(addressLine = "") {
  return /^P(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b/i.test(String(addressLine).trim());
}

/**
 * Minimal pipeline stub:
 * - Normalize address
 * - Optionally block PO Boxes
 * - Pretend Google validation succeeds
 * - Apply softMode downgrade if enabled
 */
export async function validateAddressPipeline(payload) {
  const settings = getSettings();
  const address = payload?.address || null;
  const { cleaned } = normalizeAddress(address);

  // PO Box rule (server-side)
  if (settings.blockPoBoxes && isPoBox(cleaned.address1)) {
    const base = {
      status: "ok",
      action: "BLOCK_PO_BOX",
      message: "PO Boxes are not accepted for shipping.",
      correctedAddress: cleaned,
      dpvFlags: { deliverable: false, poBox: true },
      rooftop: null,
      mapImageUrl: null,
      confidence: 0.9,
      cacheKey: null,
      settings,
    };
    // Soft mode transforms hard blocks into warnings
    if (settings.softMode) {
      base.action = "UNVERIFIED";
      base.message = "PO Box detected. Proceeding in soft mode; please confirm your address.";
    }
    return base;
  }

  // Provider (stub)
  const g = await validateWithGoogle(cleaned);
  const rooftop = extractLatLng(g?.result);
  const mapImageUrl = rooftop ? buildStaticMapUrl(rooftop.lat, rooftop.lng) : null;

  // Default "OK" stub outcome
  let result = {
    status: "ok",
    action: "OK",
    message: "Stubbed pipeline: address validated.",
    correctedAddress: cleaned,
    dpvFlags: { deliverable: true },
    rooftop: rooftop || null,
    mapImageUrl,
    confidence: 0.9,
    cacheKey: null,
    settings,
  };

  // Soft mode post-process: if ever BLOCK_* is returned, downgrade here
  if (settings.softMode && String(result.action).startsWith("BLOCK_")) {
    result.action = "UNVERIFIED";
    result.message = "Soft mode enabled — validation warnings only.";
  }

  return result;
}
