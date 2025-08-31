import { json } from "@remix-run/node";
import { verifySession, extractShopFromAuthHeader } from "../../lib/session-verify.js";
import { getSettings } from "../../lib/settings.js";

export async function loader({ request }) {
  const ok = await verifySession(request, { expectedAud: process.env.SHOPIFY_API_KEY });
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  const shop = extractShopFromAuthHeader(request) || "__global__";
  const settings = await getSettings(shop);
  return json({ status: "ok", settings });
}

export const action = () => new Response("Not Found", { status: 404 });
