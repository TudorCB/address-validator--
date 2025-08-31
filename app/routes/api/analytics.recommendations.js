import { json } from "@remix-run/node";
import { verifySession, extractShopFromAuthHeader } from "../../lib/session-verify.js";
import { readLogs } from "../../lib/logs.js";
import { getSettings } from "../../lib/settings.js";

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

/**
 * Very small “insights engine” stub:
 *  - finds patterns and returns ACTIONABLE recommendations with CTAs
 * Each insight: { id, title, severity, body, cta: { label, href, method? }, evidence?: {...} }
 */
export async function loader({ request }) {
  const ok = await verifySession(request, { expectedAud: process.env.SHOPIFY_API_KEY });
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });

  const { since, segment } = parseFilters(request);
  const shop = extractShopFromAuthHeader(request) || "__global__";
  const settings = await getSettings(shop);
  const logs = (await readLogs({ limit: 5000 })).filter((l) => (l.ts || 0) >= since && segmentMatch(l, segment));
  const insights = [];

  const blockedMissingUnit = logs.filter((l) => l.action === "BLOCK_MISSING_UNIT").length;
  if (blockedMissingUnit >= 5) {
    insights.push({
      id: "missing-unit-helper",
      severity: "high",
      title: "Many addresses missing Apartment/Unit",
      body: "Buyers frequently omit Apt/Unit. Require the field when DPV suggests it and add inline helper text.",
      cta: { label: "Enable hard requirement", href: "/settings" },
      evidence: { occurrences: blockedMissingUnit },
    });
  }

  const poBoxBlocks = logs.filter((l) => l.action === "BLOCK_PO_BOX").length;
  if (!settings.blockPoBoxes && poBoxBlocks === 0) {
    insights.push({
      id: "po-box-policy",
      severity: "medium",
      title: "Decide your PO Box policy",
      body: "No PO Box blocks detected, but policy allows them. Consider blocking to reduce returns.",
      cta: { label: "Review PO Box setting", href: "/settings" },
    });
  }

  const corrected = logs.filter((l) => l.action === "CORRECTED").length;
  if (corrected >= 10 && !settings.autoApplyCorrections) {
    insights.push({
      id: "auto-apply-corrections",
      severity: "medium",
      title: "Auto-apply common corrections",
      body: "Many corrections occurred. Auto-apply can reduce friction and failed deliveries.",
      cta: { label: "Enable auto-apply", href: "/settings" },
      evidence: { correctedLastN: corrected },
    });
  }

  const suggestPickup = logs.filter((l) => l.action === "SUGGEST_PICKUP").length;
  if (suggestPickup > 0) {
    insights.push({
      id: "pickup-availability",
      severity: "low",
      title: "Promote local pickup for undeliverable addresses",
      body: "Some addresses weren’t deliverable. Offer nearby pickup to save the sale.",
      cta: { label: "Tune pickup radius", href: "/settings" },
      evidence: { suggestPickupCount: suggestPickup },
    });
  }

  return json({ status: "ok", insights });
}
export const action = () => new Response("Not Found", { status: 404 });
