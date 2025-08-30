import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { haversineKm } from "../../lib/haversine.js";

export async function action({ request }) {
  try {
    const authorized = await verifySession(request);
    if (!authorized) return json({ error: "unauthorized" }, { status: 401 });

    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, { status: 405 });
    }

    const { customerLocation, pickupLocations = [] } = await request.json();

    if (!customerLocation || !Array.isArray(pickupLocations) || pickupLocations.length === 0) {
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

    return json({
      status: "ok",
      inRange: nearest ? true : false, // stub: inRange if any exists
      nearest: nearest || null,
      message: nearest ? `Nearest pickup is ~${best.toFixed(2)} km away.` : "No pickup locations.",
    });
  } catch (err) {
    console.error("pickup-distance-check error", err);
    return json({ error: "server_error" }, { status: 500 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });

