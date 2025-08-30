import { validateWithGoogle, extractLatLng, buildStaticMapUrl } from "./google.js";
import { normalizeAddress } from "./address-normalize.js";
import { cacheGet, cacheSet } from "./cache.js";

/**
 * Minimal pipeline stub:
 * - Pretend Google validation succeeds
 * - Suggest OK action
 */
export async function validateAddressPipeline(payload) {
  const address = payload?.address || null;
  const { cleaned, key } = normalizeAddress(address);

  // Optional cache lookup
  try {
    const cached = await cacheGet(key);
    if (cached) {
      try {
        const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
        if (parsed && typeof parsed === "object") return parsed;
      } catch (_) {
        // ignore parse errors and continue
      }
    }
  } catch (_) {
    // cache is best-effort; ignore errors
  }

  const g = await validateWithGoogle(cleaned);

  const rooftop = extractLatLng(g?.result);
  const mapImageUrl = rooftop ? buildStaticMapUrl(rooftop.lat, rooftop.lng) : null;

  const response = {
    status: "ok",
    action: "OK",
    message: "Stubbed pipeline: address validated.",
    correctedAddress: cleaned || null,
    dpvFlags: { deliverable: true },
    rooftop: rooftop || null,
    mapImageUrl,
    confidence: 0.9,
    cacheKey: key
  };

  // Best-effort cache set
  try {
    const ttl = Number(process.env.CACHE_TTL_SECONDS ?? 86400) || 86400;
    await cacheSet(key, response, ttl);
  } catch (_) {
    // ignore cache errors
  }

  return response;
}
