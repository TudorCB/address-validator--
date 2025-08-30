import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { readLogs } from "../../lib/logs.js";

function parseFilters(request) {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "7d"; // "7d" | "14d" | "30d"
  const segment = url.searchParams.get("segment") || "all"; // "all" | "checkout" | "thank_you" | "customer_account"
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

export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });

  const { days, since, segment } = parseFilters(request);
  const logs = readLogs({ limit: 5000 }).filter((l) => (l.ts || 0) >= since && segmentMatch(l, segment));
  const total = logs.length;

  const okCount = logs.filter((l) => l.action === "OK").length;
  const corrected = logs.filter((l) => l.action === "CORRECTED").length;
  const blocked = logs.filter((l) => String(l.action || "").startsWith("BLOCK_")).length;
  const blockedPoBox = logs.filter((l) => l.action === "BLOCK_PO_BOX").length;
  const blockedMissingUnit = logs.filter((l) => l.action === "BLOCK_MISSING_UNIT").length;
  const suggestPickup = logs.filter((l) => l.action === "SUGGEST_PICKUP").length;
  const unver = logs.filter((l) => l.action === "UNVERIFIED").length;

  const avgFailedDeliveryCost = 12;
  const prevented = corrected + blocked;
  const estimatedSavings = prevented * avgFailedDeliveryCost;

  // Build daily trend within range
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dayKeys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const byDay = Object.fromEntries(dayKeys.map((k) => [k, { total: 0, blocked: 0, corrected: 0, ok: 0 }]));
  logs.forEach((l) => {
    const d = new Date(l.ts || Date.now());
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
    if (!byDay[key]) return;
    byDay[key].total++;
    if (l.action === "OK") byDay[key].ok++;
    if (l.action === "CORRECTED") byDay[key].corrected++;
    if (String(l.action || "").startsWith("BLOCK_")) byDay[key].blocked++;
  });

  return json({
    status: "ok",
    filters: { rangeDays: days, segment },
    kpis: {
      totalValidations: total,
      deliverableOk: okCount,
      corrected,
      blocked,
      causes: {
        blockedPoBox,
        blockedMissingUnit,
      },
      suggestPickup,
      unver,
      estimatedSavings,
    },
    trends: dayKeys.map((day) => ({ day, ...byDay[day] })),
  });
}

export const action = () => new Response("Not Found", { status: 404 });
