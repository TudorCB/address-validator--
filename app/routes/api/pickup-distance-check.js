import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { haversineKm } from "../../lib/haversine.js";
import { rateLimit } from "../../lib/rate-limit.js";
import { writeLog } from "../../lib/logs.js";

export async function action({ request }) {
  try {
    const authorized = await verifySession(request);
    if (!authorized) {
      writeLog({ route: "pickup-distance-check", status: "unauthorized", reason: "unauthorized" });
      return json({ error: "unauthorized" }, { status: 401 });
    }

    if (request.method !== "POST") {
      writeLog({ route: "pickup-distance-check", status: "method_not_allowed" });
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
      writeLog({ route: "pickup-distance-check", status: "rate_limited" });
      return json({ error: "rate_limited" }, { status: 429 });
    }
    const _cacheKeyBase = rlKey; // reserved for future caching
    void _cacheKeyBase;

    const { customerLocation, pickupLocations = [] } = await request.json();

    if (!customerLocation || !Array.isArray(pickupLocations) || pickupLocations.length === 0) {
      writeLog({ route: "pickup-distance-check", status: "bad_request", reason: "missing inputs" });
      return json({ error: "bad_request" }, { status: 400 });
    }

    // find nearest pickup
    let nearest = null;
    let best = Infinity;
    for (const p of pickupLocations) {
      const d = haversineKm(customerLocation, p);
      if (Number.isFinite(d) && d < best) {
        best = d;
        nearest = { ...p, distanceKm: d };
      }
    }

    const response = {
      status: "ok",
      inRange: nearest ? true : false, // stub: inRange if any exists
      nearest: nearest || null,
      message: nearest ? `Nearest pickup is ~${best.toFixed(2)} km away.` : "No pickup locations.",
    };
    writeLog({
      route: "pickup-distance-check",
      status: response.status,
      action: response.inRange ? "IN_RANGE" : "OUT_OF_RANGE",
      message: response.message,
    });
    return json(response);
  } catch (err) {
    console.error("pickup-distance-check error", err);
    writeLog({ route: "pickup-distance-check", status: "server_error", reason: err?.message || String(err) });
    return json({ error: "server_error" }, { status: 500 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });
