import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { readLogs } from "../../lib/logs.js";

function parseFilters(request) {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "7d";
  const segment = url.searchParams.get("segment") || "all";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const days = range === "14d" ? 14 : range === "30d" ? 30 : 7;
  const since = Date.now() - days * 24 * 3600 * 1000;
  return { days, since, segment, q };
}

function segmentMatch(log, segment) {
  if (segment === "all") return true;
  const src = (log.contextSource || "").toLowerCase();
  if (segment === "checkout") return src === "checkout";
  if (segment === "thank_you") return src === "thank_you";
  if (segment === "customer_account") return src === "customer_account";
  return true;
}

function computeStatus(action) {
  const a = String(action || "");
  if (a === "OK" || a === "CORRECTED") return "Success";
  if (a.startsWith("BLOCK_") || a === "UNVERIFIED") return "Failed";
  return "-";
}

export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });

  const { since, segment, q } = parseFilters(request);
  const logs = readLogs({ limit: 1000 }).filter((l) => (l.ts || 0) >= since && segmentMatch(l, segment));

  const filtered = q
    ? logs.filter((l) => {
        const hay = [
          l.route,
          l.message,
          l.reason,
          l.providerResponseId,
          l.addressLine1,
          l.addressCity,
          l.addressZip,
          l.orderId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : logs;

  const rows = filtered.map((l) => ({
    id: l.id,
    ts: l.ts,
    orderId: l.orderId || l.providerResponseId || l.route || "",
    source: l.contextSource || "",
    action: l.action || l.status || "",
    status: computeStatus(l.action || l.status),
  }));

  return json({ status: "ok", rows });
}

export const action = () => new Response("Not Found", { status: 404 });

