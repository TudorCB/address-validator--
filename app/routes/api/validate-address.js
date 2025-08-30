import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";

export async function action({ request }) {
  try {
    const authorized = await verifySession(request);
    if (!authorized) return json({ error: "unauthorized" }, { status: 401 });

    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, { status: 405 });
    }

    const payload = await request.json();
    const address = payload?.address || null;

    // stub response: echo back; pretend it's valid
    return json({
      status: "ok",
      action: "OK",
      message: "Stubbed: address looks valid.",
      correctedAddress: address || null,
      dpvFlags: { deliverable: true },
      rooftop: null,
      mapImageUrl: null,
      confidence: 0.9,
      cacheKey: null
    });
  } catch (err) {
    console.error("validate-address error", err);
    return json({ error: "server_error" }, { status: 500 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });

