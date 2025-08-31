import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { snapshotMetrics } from "../../lib/metrics.js";

export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  return json(snapshotMetrics());
}

export const action = () => new Response("Not Found", { status: 404 });

