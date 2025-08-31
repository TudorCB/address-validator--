import { validateWithGoogle, extractLatLng, buildStaticMapUrl, normalizedFromGoogle } from "./google.js";
import { normalizeAddress } from "./address-normalize.js";
import { getSettings } from "./settings.js";
import { dpvValidate, mapDpvToAction } from "./dpv.js";
import { findNearestPickup } from "./pickups.js";

/**
 * Minimal pipeline with DPV integration:
 * - Normalize address
 * - Run DPV (stub) to detect PO Box / missing unit
 * - If DPV blocks, return early (respect softMode)
 * - Otherwise, run Google for correction + rooftop
 * - Merge DPV flags into final result
 */
export async function validateAddressPipeline(payload) {
  const shop = payload?.context?.shopDomain || "__global__";
  const settings = await getSettings(shop);
  const address = payload?.address || null;
  const { cleaned } = normalizeAddress(address);

  // DPV check (stubbed): evaluate PO Box and missing secondary flags
  let dpv;
  try {
    dpv = await dpvValidate(cleaned, payload?.options);
  } catch (e) {
    // Provider down or circuit open; default to non-blocking flags
    dpv = {
      deliverable: true,
      missingSecondary: false,
      poBox: false,
      ambiguous: false,
      providerResponseId: null,
    };
  }
  const dpvDecision = mapDpvToAction(dpv, settings);
  if (String(dpvDecision.action).startsWith("BLOCK_")) {
    // Special handling: when undeliverable, suggest nearest pickup if within range
    if (dpvDecision.action === "BLOCK_UNDELIVERABLE") {
      try {
        const g = await validateWithGoogle(cleaned);
        const rooftop = extractLatLng(g?.result);
        const mapImageUrl = rooftop ? buildStaticMapUrl(rooftop.lat, rooftop.lng) : null;
        const { nearest, distanceKm, inRange } = rooftop
          ? await findNearestPickup(shop, { lat: rooftop.lat, lng: rooftop.lng }, { maxKm: settings.pickupRadiusKm })
          : { nearest: null, distanceKm: null, inRange: false };
        if (inRange && nearest) {
          return {
            status: "ok",
            action: "SUGGEST_PICKUP",
            message: `Nearest pickup is ~${distanceKm.toFixed(2)} km: ${nearest.name}`,
            correctedAddress: cleaned,
            dpvFlags: {
              deliverable: !!dpv.deliverable,
              missingSecondary: !!dpv.missingSecondary,
              poBox: !!dpv.poBox,
              ambiguous: !!dpv.ambiguous,
            },
            rooftop: rooftop || null,
            mapImageUrl,
            confidence: 0.7,
            cacheKey: null,
            settings,
            providerResponseId: dpv.providerResponseId || null,
            pickup: { nearest, distanceKm, radiusKm: settings.pickupRadiusKm },
          };
        }
      } catch {
        // ignore and fall through to default DPV result
      }
    }

    const dpvResult = {
      status: "ok",
      action: dpvDecision.action,
      message: dpvDecision.message,
      correctedAddress: cleaned,
      dpvFlags: {
        deliverable: !!dpv.deliverable,
        missingSecondary: !!dpv.missingSecondary,
        poBox: !!dpv.poBox,
        ambiguous: !!dpv.ambiguous,
      },
      rooftop: null,
      mapImageUrl: null,
      confidence: 0.9,
      cacheKey: null,
      settings,
      providerResponseId: dpv.providerResponseId || null,
    };
    // Soft mode transforms hard blocks into warnings
    if (settings.softMode) {
      dpvResult.action = "UNVERIFIED";
      dpvResult.message = "Soft mode enabled - validation warnings only.";
    }
    return dpvResult;
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

  let result;
  try {
    const g = await validateWithGoogle(cleaned);
    const verdict = g?.result?.verdict || {};
    const fromGoogle = normalizedFromGoogle(g?.result);
    const rooftop = extractLatLng(g?.result);
    const mapImageUrl = rooftop ? buildStaticMapUrl(rooftop.lat, rooftop.lng) : null;
    const differ = addressesDiffer(cleaned, fromGoogle);
    const deliverable = verdict?.addressComplete === true;
    const missingUnit = isMissingUnitHint(g?.result, cleaned);

    if (missingUnit) {
      // Enforce or warn depending on mode
      result = {
        status: "ok",
        action: settings.softMode ? "UNVERIFIED" : "BLOCK_MISSING_UNIT",
        message: settings.softMode
          ? "Apartment/Unit appears required. Proceeding in soft mode; please confirm."
          : "Apartment/Unit appears required for delivery.",
        correctedAddress: fromGoogle,
        dpvFlags: {
          deliverable: !!dpv.deliverable,
          missingSecondary: !!dpv.missingSecondary,
          poBox: !!dpv.poBox,
          ambiguous: !!dpv.ambiguous,
        },
        rooftop: rooftop || null,
        mapImageUrl,
        confidence: 0.8,
        cacheKey: null,
        settings,
        providerResponseId: dpv.providerResponseId || null,
      };
    } else {
      result = {
        status: "ok",
        action: differ ? "CORRECTED" : (deliverable ? "OK" : "UNVERIFIED"),
        message: differ
          ? "Address corrected to postal standard by Google."
          : deliverable
          ? "Address validated by Google."
          : "Address not fully verified. Please confirm details.",
        correctedAddress: fromGoogle,
        dpvFlags: {
          deliverable: !!dpv.deliverable,
          missingSecondary: !!dpv.missingSecondary,
          poBox: !!dpv.poBox,
          ambiguous: !!dpv.ambiguous,
        },
        rooftop: rooftop || null,
        mapImageUrl,
        confidence: deliverable ? 0.95 : 0.7,
        cacheKey: null,
        settings,
        providerResponseId: dpv.providerResponseId || null,
      };
    }
  } catch (e) {
    // Provider unavailable or error: degrade quickly to UNVERIFIED using local heuristics
    const circuitOpen = e && (e.code === "CIRCUIT_OPEN" || String(e?.message || "").includes("CIRCUIT_OPEN"));
    result = {
      status: "ok",
      action: circuitOpen ? "UNVERIFIED" : (changed ? "CORRECTED" : "OK"),
      message: circuitOpen
        ? "Provider unavailable; using local heuristics."
        : (changed ? "Applied standard address formatting." : "Stubbed pipeline: address validated."),
      correctedAddress: corrected,
      dpvFlags: {
        deliverable: !!dpv.deliverable,
        missingSecondary: !!dpv.missingSecondary,
        poBox: !!dpv.poBox,
        ambiguous: !!dpv.ambiguous,
      },
      rooftop: null,
      mapImageUrl: null,
      confidence: circuitOpen ? 0.5 : 0.9,
      cacheKey: null,
      settings,
      providerResponseId: dpv.providerResponseId || null,
    };
  }

  // Soft mode post-process: if ever BLOCK_* is returned, downgrade here
  if (settings.softMode && String(result.action).startsWith("BLOCK_")) {
    result.action = "UNVERIFIED";
    result.message = "Soft mode enabled - validation warnings only.";
  }
  return result;
}

function addressesDiffer(a, b) {
  return (
    (a?.address1 || "") !== (b?.address1 || "") ||
    (a?.address2 || "") !== (b?.address2 || "") ||
    (a?.city || "") !== (b?.city || "") ||
    (a?.province || "") !== (b?.province || "") ||
    (a?.zip || "") !== (b?.zip || "") ||
    (a?.country || "") !== (b?.country || "")
  );
}

function isMissingUnitHint(googleResult, inputAddr) {
  try {
    const usps = googleResult?.uspsData || {};
    const foot = String(usps.dpvFootnote || "").toUpperCase();
    // Heuristics: some DPV footnotes indicating missing/secondary info uncertainty
    if (/\b(A1|N1|AA|BB|CC|M1)\b/.test(foot)) return true;
    const verdict = googleResult?.verdict || {};
    if (verdict.addressComplete === false && !inputAddr?.address2) return true;
    return false;
  } catch {
    return false;
  }
}
