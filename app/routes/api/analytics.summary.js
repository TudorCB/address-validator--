import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { readLogs } from "../../lib/logs.js";

export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });

  // Derive simple KPIs from recent logs (stub logic)
  const logs = readLogs({ limit: 1000 });
  const total = logs.length;

  const okCount = logs.filter((l) => l.action === "OK").length;
  const corrected = logs.filter((l) => l.action === "CORRECTED").length;
  const blocked = logs.filter((l) => String(l.action || "").startsWith("BLOCK_")).length;
  const suggestPickup = logs.filter((l) => l.action === "SUGGEST_PICKUP").length;
  const unver = logs.filter((l) => l.action === "UNVERIFIED").length;

  // crude “savings” estimates
  const avgFailedDeliveryCost = 12; // USD (tunable)
  const prevented = corrected + blocked; // rough
  const estimatedSavings = prevented * avgFailedDeliveryCost;

  // 7-day trend buckets (stub by day)
  const byDay = {};
  logs.forEach((l) => {
    const d = new Date(l.ts || Date.now());
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      .toISOString()
      .slice(0, 10);
    byDay[key] = byDay[key] || { total: 0, blocked: 0, corrected: 0, ok: 0 };
    byDay[key].total++;
    if ((l.action || "") === "CORRECTED") byDay[key].corrected++;
    if (String(l.action || "").startsWith("BLOCK_")) byDay[key].blocked++;
    if ((l.action || "") === "OK") byDay[key].ok++;
  });

  return json({
    status: "ok",
    kpis: {
      totalValidations: total,
      deliverableOk: okCount,
      corrected,
      blocked,
      suggestPickup,
      unver,
      estimatedSavings,
    },
    trends: Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v })),
  });
}
export const action = () => new Response("Not Found", { status: 404 });

