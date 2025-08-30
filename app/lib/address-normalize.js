/**
 * Normalizes an address object into a canonical string and cleaned fields.
 * This reduces cache key variance and helps provider lookups.
 */
const SEP = " | ";

export function normalizeAddress(addr = {}) {
  const cleaned = {
    address1: (addr.address1 || "").trim(),
    address2: (addr.address2 || "").trim(),
    city: (addr.city || "").trim(),
    province: (addr.province || "").trim(),
    zip: (addr.zip || "").trim().toUpperCase(),
    country: (addr.country || "US").trim().toUpperCase(),
  };
  const key = [
    cleaned.address1,
    cleaned.address2,
    cleaned.city,
    cleaned.province,
    cleaned.zip,
    cleaned.country,
  ].filter(Boolean).join(SEP);
  return { cleaned, key };
}

