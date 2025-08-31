import { json } from "@remix-run/node";
import { verifySession, extractShopFromAuthHeader } from "../../lib/session-verify.js";
import { listPickups, createPickup } from "../../lib/pickups.js";

export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  const shop = extractShopFromAuthHeader(request) || "__global__";
  const rows = await listPickups(shop);
  return json({ status: "ok", pickups: rows });
}

export async function action({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405 });
  try {
    const shop = extractShopFromAuthHeader(request) || "__global__";
    const body = await request.json();
    const created = await createPickup(shop, {
      name: body?.name,
      lat: body?.lat,
      lng: body?.lng,
    });
    return json({ status: "ok", pickup: created });
  } catch (e) {
    const reason = String(e && e.message ? e.message : e);
    const status = reason === "invalid_lat_lng" || reason === "name_required" ? 400 : 500;
    return json({ error: reason }, { status });
  }
}

