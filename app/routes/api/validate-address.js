import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { rateLimit } from "../../lib/rate-limit.js";
import { writeLog } from "../../lib/logs.js";

export async function action({ request }) {
  try {
    const authorized = await verifySession(request);
    if (!authorized) {
      writeLog({ route: "validate-address", status: "unauthorized", reason: "unauthorized" });
      return json({ error: "unauthorized" }, { status: 401 });
    }

    if (request.method !== "POST") {
      writeLog({ route: "validate-address", status: "method_not_allowed" });
      return json({ error: "method_not_allowed" }, { status: 405 });
    }

    // Per-IP rate limit (simple: IP + path)
    const xfwd = request.headers.get("x-forwarded-for") || "";
    const realIp = request.headers.get("x-real-ip") || request.headers.get("remote-addr") || "unknown";
    const ip = (xfwd.split(",")[0] || realIp || "unknown").trim();
    const pathname = new URL(request.url).pathname;
    const rlKey = `${ip}:${pathname}`;
    const { allowed } = rateLimit({ key: rlKey });
    if (!allowed) {
      writeLog({ route: "validate-address", status: "rate_limited" });
      return json({ error: "rate_limited" }, { status: 429 });
    }
    const _cacheKeyBase = rlKey; // reserved for future caching
    void _cacheKeyBase;

    const payload = await request.json();
    const address = payload?.address || null;

    // stub response: echo back; pretend it's valid
    const response = {
      status: "ok",
      action: "OK",
      message: "Stubbed: address looks valid.",
      correctedAddress: address || null,
      dpvFlags: { deliverable: true },
      rooftop: null,
      mapImageUrl: null,
      confidence: 0.9,
      cacheKey: null
    };

    writeLog({
      route: "validate-address",
      status: response.status,
      action: response.action,
      message: response.message,
      address: typeof address === "string" ? address : address ? JSON.stringify(address) : undefined,
    });
    return json(response);
  } catch (err) {
    console.error("validate-address error", err);
    writeLog({ route: "validate-address", status: "server_error", reason: err?.message || String(err) });
    return json({ error: "server_error" }, { status: 500 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });
