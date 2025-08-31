import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { haversineKm } from "../../lib/haversine.js";
import { rateLimitKey } from "../../lib/rate-limit-redis.js";
import { getSettings } from "../../lib/settings.js";
import { writeLog } from "../../lib/logs.js";

function rateKey(request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
  return `ratelimit:pickup:${ip}`;
}

export async function action({ request }) {
  const ipRate = await rateLimitKey({ key: rateKey(request), max: 300, windowSec: 60 });
  if (!ipRate.allowed) return json({ error: "rate_limited", resetAt: ipRate.resetAt }, { status: 429 });

  try {
    const authorized = await verifySession(request, { expectedAud: process.env.SHOPIFY_API_KEY });
    if (!authorized) return json({ error: "unauthorized" }, { status: 401 });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405 });

    const body = await request.json();
    const shopDomain = body?.context?.shopDomain || "unknown";
    const perShopMax = Number(process.env.RATE_LIMIT_PER_SHOP_MIN || 600);
    const shopRate = await rateLimitKey({ key: `shop:${shopDomain}`, max: Number.isFinite(perShopMax) ? perShopMax : 600, windowSec: 60 });
    if (!shopRate.allowed) return json({ error: "rate_limited", scope: "shop", resetAt: shopRate.resetAt }, { status: 429 });
    const { customerLocation, pickupLocations = [], radiusKm } = body || {};
    const contextSource = body?.context?.source || "checkout";
    if (!customerLocation || !Array.isArray(pickupLocations) || pickupLocations.length === 0) {
      writeLog({ route: "pickup-distance-check", status: "error", contextSource, reason: "bad_request" });
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

    const response = {
      status: "ok",
      inRange,
      nearest: nearest ? { ...nearest, distanceKm: best } : null,
      distanceKm: Number.isFinite(best) ? best : null,
      radiusKm: effectiveRadius,
      message: nearest ? `Nearest pickup is ~${best.toFixed(2)} km` : "No pickup locations provided."
    };

    writeLog({
      route: "pickup-distance-check",
      status: "ok",
      action: inRange ? "SUGGEST_PICKUP" : "NO_PICKUP_IN_RANGE",
      contextSource,
      message: response.message,
    });

    return json(response);
  } catch (err) {
    console.error("pickup-distance-check error", err);
    writeLog({ route: "pickup-distance-check", status: "error", contextSource: "checkout", reason: String(err && err.message ? err.message : err) });
    return json({ error: "server_error" }, { status: 500 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });
