import { validateWithGoogle, extractLatLng, buildStaticMapUrl } from "./google.js";

/**
 * Minimal pipeline stub:
 * - Pretend Google validation succeeds
 * - Suggest OK action
 */
export async function validateAddressPipeline(payload) {
  const address = payload?.address || null;
  const g = await validateWithGoogle(address);

  const rooftop = extractLatLng(g?.result);
  const mapImageUrl = rooftop ? buildStaticMapUrl(rooftop.lat, rooftop.lng) : null;

  return {
    status: "ok",
    action: "OK",
    message: "Stubbed pipeline: address validated.",
    correctedAddress: address || null,
    dpvFlags: { deliverable: true },
    rooftop: rooftop || null,
    mapImageUrl,
    confidence: 0.9,
    cacheKey: null
  };
}

