/**
 * USPS Web Tools Address Validation (v4) DPV
 * NOTE: USPS returns XML; we call Verify endpoint and parse.
 * This implementation focuses on delivery-point confirmation and footnotes that hint secondary unit required.
 */
import { withRetry } from "../http-retry.js";

function poBoxDetect(address1 = "") {
  return /^P(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b/i.test(String(address1).trim());
}

// naive xml getter from a string
function x(node, tag) {
  const m = String(node || "").match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

export async function uspsDpv(
  address,
  { timeoutMs = Number(process.env.DPV_TIMEOUT_MS || 3000), userId = process.env.USPS_WEBTOOLS_USERID } = {}
) {
  if (!userId) throw new Error("USPS_USERID_MISSING");

  const params = new URLSearchParams();
  // USPS Verify API expects XML in query param
  const xml = `
    <AddressValidateRequest USERID="${userId}">
      <Address ID="0">
        <Address1>${(address.address2 || "").slice(0, 38)}</Address1>
        <Address2>${(address.address1 || "").slice(0, 38)}</Address2>
        <City>${address.city || ""}</City>
        <State>${address.province || address.provinceCode || ""}</State>
        <Zip5>${(address.zip || "").slice(0, 5)}</Zip5>
        <Zip4></Zip4>
      </Address>
    </AddressValidateRequest>`.replace(/\n\s+/g, " ").trim();

  params.set("API", "Verify");
  params.set("XML", xml);

  const url = `https://secure.shippingapis.com/ShippingAPI.dll?${params.toString()}`;

  const fetchOnce = async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      const txt = await res.text();
      if (!res.ok) {
        const err = new Error(`USPS_${res.status}`);
        err.body = txt;
        throw err;
      }
      return txt;
    } finally {
      clearTimeout(t);
    }
  };

  const xmlResp = await withRetry(fetchOnce, { retries: 2, baseDelayMs: 250 });

  const errorDesc = x(xmlResp, "Description");
  if (errorDesc && /error/i.test(String(xmlResp))) {
    const e = new Error("USPS_ERROR");
    e.info = errorDesc;
    throw e;
  }

  // USPS tags
  const dpvConfirm = x(xmlResp, "DPVConfirmation"); // Y | N | S | D
  const dpvFoot = x(xmlResp, "DPVFootnotes") || "";
  const address2 = x(xmlResp, "Address2") || "";
  const city = x(xmlResp, "City") || "";
  const state = x(xmlResp, "State") || "";
  const zip5 = x(xmlResp, "Zip5") || "";
  const zip4 = x(xmlResp, "Zip4") || "";

  const poBox = poBoxDetect(address.address1);

  const deliverable = dpvConfirm === "Y";
  const ambiguous = dpvConfirm === "S";
  const missingSecondary = dpvConfirm === "D" || /\b(A1|M1|M3)\b/.test(dpvFoot);

  const normalized = {
    address1: address2 || address.address1 || "",
    address2: "",
    city,
    province: state,
    zip: zip4 ? `${zip5}-${zip4}` : zip5,
    country: address.country || "US",
  };

  return {
    flags: { deliverable, missingSecondary, ambiguous, poBox },
    normalized,
    provider: "usps",
    providerResponseId: `${zip5}${zip4 ? "-" + zip4 : ""}`,
    raw: { dpvConfirm, dpvFoot },
  };
}

