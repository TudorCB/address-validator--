import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { readLogs } from "../../lib/logs.js";
import { getSettings } from "../../lib/settings.js";

/**
 * Very small “insights engine” stub:
 *  - finds patterns and returns ACTIONABLE recommendations with CTAs
 * Each insight: { id, title, severity, body, cta: { label, href, method? }, evidence?: {...} }
 */
export async function loader({ request }) {
  const ok = await verifySession(request);
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });

  const logs = readLogs({ limit: 1000 });
  const settings = getSettings();
  const insights = [];

  const blockedMissingUnit = logs.filter((l) => l.action === "BLOCK_MISSING_UNIT").length;
  if (blockedMissingUnit >= 5) {
    insights.push({
      id: "missing-unit-helper",
      severity: "high",
      title: "Many addresses missing Apartment/Unit",
      body:
        "Buyers frequently omit Apt/Unit. Add a helper hint and hard-require the field when DPV suggests it.",
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
      body:
        "We found no PO Box blocks, but your policy is currently permissive. Consider enabling PO Box blocking to reduce returns.",
      cta: { label: "Review PO Box setting", href: "/settings" },
    });
  }

  const corrected = logs.filter((l) => l.action === "CORRECTED").length;
  if (corrected >= 10 && !settings.autoApplyCorrections) {
    insights.push({
      id: "auto-apply-corrections",
      severity: "medium",
      title: "Auto-apply common corrections",
      body: "You’ve had many corrections. Auto-apply can reduce friction and failures.",
      cta: { label: "Enable auto-apply", href: "/settings" },
      evidence: { correctedLast1000: corrected },
    });
  }

  const suggestPickup = logs.filter((l) => l.action === "SUGGEST_PICKUP").length;
  if (suggestPickup > 0) {
    insights.push({
      id: "pickup-availability",
      severity: "low",
      title: "Promote local pickup for undeliverable addresses",
      body:
        "Some buyers landed on addresses we can’t ship to. Offer nearby pickup to save the sale.",
      cta: { label: "Tune pickup radius", href: "/settings" },
      evidence: { suggestPickupCount: suggestPickup },
    });
  }

  return json({ status: "ok", insights });
}
export const action = () => new Response("Not Found", { status: 404 });

