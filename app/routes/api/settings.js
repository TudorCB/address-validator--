import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { getSettings } from "../../lib/settings.js";

export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  return json({ status: "ok", settings: getSettings() });
}

export const action = () => new Response("Not Found", { status: 404 });

