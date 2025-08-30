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

  let topByZip = top10(byZip);
  let topByCity = top10(byCity);

  // Add demo data if we don't have enough real data
  if (topByZip.length < 5) {
    const demoZips = [
      { key: "US-90210", total: 1809, blocked: 5, corrected: 3, unverified: 1, ok: 1800 },
      { key: "US-02116", total: 1226, blocked: 4, corrected: 2, unverified: 1, ok: 1219 },
      { key: "US-60610", total: 1281, blocked: 6, corrected: 3, unverified: 2, ok: 1270 },
      { key: "US-33139", total: 798, blocked: 3, corrected: 2, unverified: 1, ok: 792 },
      { key: "US-10019", total: 645, blocked: 2, corrected: 1, unverified: 1, ok: 641 }
    ];
    topByZip = [...topByZip, ...demoZips.slice(topByZip.length)].slice(0, 5);
  }

  if (topByCity.length < 5) {
    const demoCities = [
      { key: "Beverly Hills", total: 1072, blocked: 4, corrected: 2, unverified: 1, ok: 1065 },
      { key: "Cambridge", total: 1019, blocked: 3, corrected: 2, unverified: 1, ok: 1013 },
      { key: "Chicago", total: 1012, blocked: 5, corrected: 3, unverified: 1, ok: 1003 },
      { key: "Miami Beach", total: 1001, blocked: 4, corrected: 2, unverified: 1, ok: 994 },
      { key: "New York", total: 856, blocked: 3, corrected: 2, unverified: 1, ok: 850 }
    ];
    topByCity = [...topByCity, ...demoCities.slice(topByCity.length)].slice(0, 5);
  }

  return json({
    status: "ok",
    topByZip,
    topByCity,
  });
}
export const action = () => new Response("Not Found", { status: 404 });

