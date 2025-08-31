import { verifySession } from "../lib/session-verify.js";
import { readLogs } from "../lib/logs.js";

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
function esc(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function loader({ request }) {
  const ok = await verifySession(request, { expectedAud: process.env.SHOPIFY_API_KEY });
  if (!ok) {
    return new Response("unauthorized", { status: 401 });
  }

  const { since, segment } = parseFilters(request);
  const logs = (await readLogs({ limit: 10000 })).filter((l) => (l.ts || 0) >= since && segmentMatch(l, segment));

  // Only include non-PII columns: city/zip/province/country and action (plus timestamp)
  const rows = [["ts", "action", "city", "zip", "province", "country"].map(esc).join(",")];

  logs.forEach((l) => {
    rows.push(
      [
        new Date(l.ts || Date.now()).toISOString(),
        l.action || "",
        l.addressCity || "",
        l.addressZip || "",
        l.addressProvince || "",
        l.addressCountry || "",
      ].map(esc).join(","),
    );
  });

  const body = rows.join("\n");
  const filename = `address-validator-logs-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

export const action = () => new Response("Not Found", { status: 404 });
