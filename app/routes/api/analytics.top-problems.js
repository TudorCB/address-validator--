import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { readLogs } from "../../lib/logs.js";

function parseFilters(request) {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "7d";
  const segment = url.searchParams.get("segment") || "all";
  const days = range === "14d" ? 14 : range === "30d" ? 30 : 7;
  const since = Date.now() - days * 24 * 3600 * 1000;
  return { days, since, segment };
}
function segmentMatch(log, segment) {
  if (segment === "all") return true;
  const src = (log.contextSource || "").toLowerCase();
  if (segment === "checkout") return src === "checkout";
  if (segment === "thank_you") return src === "thank_you";
  if (segment === "customer_account") return src === "customer_account";
  return true;
}

function bump(map, key, action) {
  if (!key) return;
  const k = String(key);
  const row = map.get(k) || { key: k, total: 0, blocked: 0, missingUnit: 0, poBox: 0, corrected: 0, unverified: 0, ok: 0 };
  row.total++;
  if (action === "OK") row.ok++;
  else if (action === "CORRECTED") row.corrected++;
  else if (action === "UNVERIFIED") row.unverified++;
  else if (action === "SUGGEST_PICKUP") {
    /* optional: could track */
  }
  if (String(action || "").startsWith("BLOCK_")) {
    row.blocked++;
    if (action === "BLOCK_MISSING_UNIT") row.missingUnit++;
    if (action === "BLOCK_PO_BOX") row.poBox++;
  }
  map.set(k, row);
}

export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });

  const { since, segment } = parseFilters(request);
  const logs = readLogs({ limit: 10000 }).filter((l) => (l.ts || 0) >= since && segmentMatch(l, segment));

  const byZip = new Map();
  const byCity = new Map();
  logs.forEach((l) => {
    bump(byZip, l.addressCountry && l.addressZip ? `${l.addressCountry}-${l.addressZip}` : null, l.action);
    bump(byCity, l.addressCity || null, l.action);
  });

  function top10(map) {
    return Array.from(map.values())
      .sort((a, b) => b.blocked + b.corrected + b.unverified - (a.blocked + a.corrected + a.unverified))
      .slice(0, 10);
  }

  return json({
    status: "ok",
    topByZip: top10(byZip),
    topByCity: top10(byCity),
  });
}
export const action = () => new Response("Not Found", { status: 404 });

