import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { snapshotCacheMetrics } from "../../lib/cache.js";

export async function loader({ request }) {
  const ok = await verifySession(request, { expectedAud: process.env.SHOPIFY_API_KEY });
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  return json({ status: "ok", cache: snapshotCacheMetrics() });
}

export const action = () => new Response("Not Found", { status: 404 });

