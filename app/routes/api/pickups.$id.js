import { json } from "@remix-run/node";
import { verifySession, extractShopFromAuthHeader } from "../../lib/session-verify.js";
import { updatePickup, deletePickup } from "../../lib/pickups.js";

export const loader = () => new Response("Not Found", { status: 404 });

export async function action({ request, params }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  const id = params?.id || null;
  if (!id) return json({ error: "bad_request" }, { status: 400 });
  try {
    const shop = extractShopFromAuthHeader(request) || "__global__";
    if (request.method === "PATCH") {
      const patch = await request.json();
      const updated = await updatePickup(shop, id, patch || {});
      return json({ status: "ok", pickup: updated });
    }
    if (request.method === "DELETE") {
      await deletePickup(shop, id);
      return json({ status: "ok" });
    }
    return json({ error: "method_not_allowed" }, { status: 405 });
  } catch (e) {
    const reason = String(e && e.message ? e.message : e);
    const status = reason === "invalid_lat_lng" || reason === "name_required" || reason === "not_found" ? 400 : 500;
    return json({ error: reason }, { status });
  }
}

