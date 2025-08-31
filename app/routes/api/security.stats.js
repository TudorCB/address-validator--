import { json } from "@remix-run/node";
import { verifySession, sessionVerifyStats } from "../../lib/session-verify.js";

export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  const stats = sessionVerifyStats();
  return json({ status: "ok", stats });
}

export const action = () => new Response("Not Found", { status: 404 });

