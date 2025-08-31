import { json } from "@remix-run/node";
import { verifySession, extractShopFromAuthHeader } from "../../lib/session-verify.js";
import { updateSettings, getSettings } from "../../lib/settings.js";

export async function action({ request }) {
  const ok = await verifySession(request, { expectedAud: process.env.SHOPIFY_API_KEY });
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  if (request.method !== "PATCH") return json({ error: "method_not_allowed" }, { status: 405 });

  try {
    const patch = await request.json();
    const allowed = {};
    if ("pickupRadiusKm" in patch && Number.isFinite(patch.pickupRadiusKm) && patch.pickupRadiusKm >= 0) {
      allowed.pickupRadiusKm = Number(patch.pickupRadiusKm);
    }
    if ("blockPoBoxes" in patch) allowed.blockPoBoxes = !!patch.blockPoBoxes;
    if ("autoApplyCorrections" in patch) allowed.autoApplyCorrections = !!patch.autoApplyCorrections;
    if ("softMode" in patch) allowed.softMode = !!patch.softMode;
    if ("failedDeliveryCostUsd" in patch && Number.isFinite(patch.failedDeliveryCostUsd) && patch.failedDeliveryCostUsd >= 0) {
      allowed.failedDeliveryCostUsd = Number(patch.failedDeliveryCostUsd);
    }

    const shop = extractShopFromAuthHeader(request) || "__global__";
    const updated = await updateSettings(allowed, shop);
    return json({ status: "ok", settings: updated });
  } catch (e) {
    console.error("settings.update error", e);
    return json({ error: "bad_request" }, { status: 400 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });
