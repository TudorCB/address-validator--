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

  // Lightweight normalization/correction step (demo)
  function titleCase(s = "") {
    return String(s)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/(^|\s)([a-z])/g, (_, a, b) => a + b.toUpperCase());
  }

  function normalizeSuffix(word = "") {
    const w = String(word).replace(/\.$/, "").toLowerCase();
    const map = { st: "St", rd: "Rd", ave: "Ave", dr: "Dr", ln: "Ln", blvd: "Blvd", hwy: "Hwy", ct: "Ct", cir: "Cir", ter: "Ter", pkwy: "Pkwy" };
    return map[w] || null;
  }

  function correctAddress(clean) {
    const out = { ...clean };
    let a1 = String(out.address1 || "").replace(/\s+/g, " ").trim();
    if (a1) {
      const parts = a1.split(" ");
      if (parts.length > 0) {
        const last = parts[parts.length - 1];
        const norm = normalizeSuffix(last);
        if (norm) parts[parts.length - 1] = norm;
      }
      a1 = parts
        .map((p) => {
          const lower = p.toLowerCase();
          if (["apt", "unit", "ste", "suite", "#"].includes(lower)) return lower === "#" ? "#" : titleCase(lower);
          if (/^\d+[a-zA-Z]?$/.test(p)) return p.toUpperCase();
          const suf = normalizeSuffix(p);
          if (suf) return suf;
          return titleCase(p);
        })
        .join(" ");
    }
    const a2 = String(out.address2 || "").replace(/\s+/g, " ").trim();
    const city = titleCase(out.city || "");
    const province = (out.province || "").trim();
    const zip = String(out.zip || "").trim().toUpperCase();
    const country = String(out.country || "US").trim().toUpperCase();

    const corrected = { address1: a1, address2: a2, city, province, zip, country };
    const changed = corrected.address1 !== clean.address1 || corrected.address2 !== clean.address2 || corrected.city !== clean.city || corrected.province !== clean.province || corrected.zip !== clean.zip || corrected.country !== clean.country;
    return { corrected, changed };
  }

  const { corrected, changed } = correctAddress(cleaned);

  // Provider (stub)
  const g = await validateWithGoogle(corrected);
  const rooftop = extractLatLng(g?.result);
  const mapImageUrl = rooftop ? buildStaticMapUrl(rooftop.lat, rooftop.lng) : null;

  // Default "OK" stub outcome
  let result = {
    status: "ok",
    action: "OK",
    message: "Stubbed pipeline: address validated.",
    correctedAddress: corrected,
    dpvFlags: { deliverable: true },
    rooftop: rooftop || null,
    mapImageUrl,
    confidence: 0.9,
    cacheKey: null,
    settings,
  };

  // Upgrade to CORRECTED if our heuristic changed the address
  if (changed) {
    result.action = "CORRECTED";
    result.message = "Applied standard address formatting.";
  }

  // Soft mode post-process: if ever BLOCK_* is returned, downgrade here
  if (settings.softMode && String(result.action).startsWith("BLOCK_")) {
    result.action = "UNVERIFIED";
    result.message = "Soft mode enabled — validation warnings only.";
  }

  return result;
}
