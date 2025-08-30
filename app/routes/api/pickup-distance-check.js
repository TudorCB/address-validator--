import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { haversineKm } from "../../lib/haversine.js";
import { rateLimit } from "../../lib/rate-limit.js";
import { getSettings } from "../../lib/settings.js";

function rateKey(request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
  return `ratelimit:pickup:${ip}`;
}

export async function action({ request }) {
  const { allowed, resetAt } = rateLimit({ key: rateKey(request), max: 300, windowMs: 60_000 });
  if (!allowed) return json({ error: "rate_limited", resetAt }, { status: 429 });

  try {
    const authorized = await verifySession(request);
    if (!authorized) return json({ error: "unauthorized" }, { status: 401 });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405 });

    const body = await request.json();
    const { customerLocation, pickupLocations = [], radiusKm } = body || {};
    if (!customerLocation || !Array.isArray(pickupLocations) || pickupLocations.length === 0) {
      return json({ error: "bad_request" }, { status: 400 });
    }

    // Compute nearest pickup
    let nearest = null;
    let best = Infinity;
    for (const p of pickupLocations) {
      const d = haversineKm(customerLocation, p);
      if (Number.isFinite(d) && d < best) {
        best = d;
        nearest = { ...p };
      }
    }

    const settings = getSettings();
    const effectiveRadius = Number.isFinite(radiusKm) ? radiusKm : (settings.pickupRadiusKm ?? 25);
    const inRange = Number.isFinite(best) ? best <= effectiveRadius : false;

    return json({
      status: "ok",
      inRange,
      nearest: nearest ? { ...nearest, distanceKm: best } : null,
      distanceKm: Number.isFinite(best) ? best : null,
      radiusKm: effectiveRadius,
      message: nearest ? `Nearest pickup is ~${best.toFixed(2)} km` : "No pickup locations provided."
    });
  } catch (err) {
    console.error("pickup-distance-check error", err);
    return json({ error: "server_error" }, { status: 500 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });
