import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { readLogs } from "../../lib/logs.js";

function classify(action) {
  const a = String(action || "");
  if (a.startsWith("BLOCK_")) return "blocked";
  if (a === "CORRECTED") return "corrected";
  if (a === "OK") return "ok";
  if (a === "UNVERIFIED") return "unver";
  if (a === "SUGGEST_PICKUP") return "ok"; // treat as non-blocking
  return "other";
}

function applyToggles(originalAction, toggles = {}) {
  const act = String(originalAction || "");
  let out = act;
  // If turning off PO Box block, downgrade BLOCK_PO_BOX
  if (toggles.blockPoBoxes === false && act === "BLOCK_PO_BOX") {
    out = toggles.softMode ? "UNVERIFIED" : "OK";
  }
  // Soft mode: downgrade any hard block to UNVERIFIED
  if (toggles.softMode === true && act.startsWith("BLOCK_")) {
    out = "UNVERIFIED";
  }
  return out;
}

export async function action({ request }) {
  const ok = await verifySession(request, { expectedAud: process.env.SHOPIFY_API_KEY });
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405 });
  try {
    const body = await request.json();
    const toggles = body?.toggles || {};
    const limit = Number(body?.limit) || 2000;

    const logs = await readLogs({ limit });
    const baseline = { ok: 0, corrected: 0, blocked: 0, unver: 0, total: logs.length };
    const simulated = { ok: 0, corrected: 0, blocked: 0, unver: 0, total: logs.length };

    for (const l of logs) {
      const c = classify(l.action);
      if (c in baseline) baseline[c]++;
      const after = classify(applyToggles(l.action, toggles));
      if (after in simulated) simulated[after]++;
    }

    const delta = {
      ok: simulated.ok - baseline.ok,
      corrected: simulated.corrected - baseline.corrected,
      blocked: simulated.blocked - baseline.blocked,
      unver: simulated.unver - baseline.unver,
    };

    return json({ status: "ok", baseline, simulated, delta });
  } catch (e) {
    console.error("analytics.simulate error", e);
    return json({ error: "bad_request" }, { status: 400 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });
