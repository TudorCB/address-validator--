import crypto from "node:crypto";

/**
 * Google Address Validation API.
 * If GOOGLE_MAPS_API_KEY is missing, returns a local stub for dev.
 */
export async function validateWithGoogle(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const lines = [address?.address1 || "", address?.address2 || ""].filter(Boolean);
  const regionCode = address?.country || "US";
  const locality = address?.city || "";
  const administrativeArea = address?.province || "";
  const postalCode = address?.zip || "";

  if (!apiKey) {
    return {
      result: {
        address: {
          addressLines: lines,
          regionCode,
          locality,
          administrativeArea,
          postalCode,
        },
        verdict: { addressComplete: true, validationGranularity: "PREMISE" },
        geocode: null,
        uspsData: null,
      },
      responseId: "stub-google-validation",
    };
  }

  const body = {
    address: {
      regionCode,
      locality,
      administrativeArea,
      postalCode,
      addressLines: lines,
    },
    // Let Google apply USPS normalization where available in the US
    enableUspsCass: regionCode === "US",
  };

  const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`google_validate_address_failed:${res.status}`);
  }
  const json = await res.json();
  return { result: json?.result || null, responseId: json?.responseId || null };
}

export function extractLatLng(result) {
  const g = result?.geocode;
  if (!g) return null;
  const lat = Number(
    g?.location?.latLng?.latitude ?? g?.lat ?? g?.latitude
  );
  const lng = Number(
    g?.location?.latLng?.longitude ?? g?.lng ?? g?.longitude
  );
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/**
 * Convert Google postal address to our shape {address1,address2,city,province,zip,country}
 */
export function normalizedFromGoogle(result) {
  const a = result?.address || {};
  const lines = Array.isArray(a.addressLines) ? a.addressLines : [];
  const address1 = lines[0] || "";
  const address2 = lines.length > 1 ? lines.slice(1).join(" ") : "";
  return {
    address1,
    address2,
    city: a.locality || "",
    province: a.administrativeArea || "",
    zip: a.postalCode || "",
    country: a.regionCode || "US",
  };
}

/**
 * Builds a signed Static Maps URL without exposing an API key.
 * Requires both GOOGLE_MAPS_URL_CLIENT_ID and GOOGLE_MAPS_URL_SIGNING_SECRET.
 * Returns null if signing is not configured.
 */
export function buildStaticMapUrl(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const client = process.env.GOOGLE_MAPS_URL_CLIENT_ID || "";
  const secret = process.env.GOOGLE_MAPS_URL_SIGNING_SECRET || "";
  if (!client || !secret) return null;

  const basePath = "/maps/api/staticmap";
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: "16",
    size: "600x300",
    maptype: "roadmap",
    markers: `color:blue|label:A|${lat},${lng}`,
    client,
  });
  const path = `${basePath}?${params.toString()}`;
  const signature = signPath(path, secret);
  return `https://maps.googleapis.com${path}&signature=${signature}`;
}

function signPath(path, secret) {
  // Secret provided base64 URL-safe; decode to raw bytes
  const decoded = Buffer.from(secret.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const hmac = crypto.createHmac("sha1", decoded);
  hmac.update(path);
  return hmac
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
