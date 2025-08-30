/**
 * Google API wrapper (stub).
 * Later: implement Address Validation API + Static Maps signing.
 */
export async function validateWithGoogle(address) {
  // TODO: call real API; for now pretend it's normalized
  return {
    result: {
      address: {
        addressLines: [address?.address1 || "", address?.address2 || ""].filter(Boolean),
        regionCode: address?.country || "US",
        locality: address?.city || "",
        administrativeArea: address?.province || "",
        postalCode: address?.zip || ""
      },
      verdict: { addressComplete: true, validationGranularity: "PREMISE" },
      geocode: null,
      uspsData: null
    },
    responseId: "stub-google-validation"
  };
}

export function extractLatLng(result) {
  const g = result?.geocode;
  if (!g) return null;
  const lat = Number(g?.lat ?? g?.latitude);
  const lng = Number(g?.lng ?? g?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function buildStaticMapUrl(lat, lng) {
  // TODO: sign with Google secret; return null for now
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return null;
}

