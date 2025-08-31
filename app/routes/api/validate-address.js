import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { rateLimit } from "../../lib/rate-limit.js";
import { validateAddressPipeline } from "../../lib/validateAddressPipeline.js";
import { writeLog } from "../../lib/logs.js";
function rateKey(request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
  return `ratelimit:validate:${ip}`;
}

export async function action({ request }) {
  const { allowed, remaining, resetAt } = rateLimit({ key: rateKey(request), max: 300, windowMs: 60_000 });
  if (!allowed) return json({ error: "rate_limited", resetAt }, { status: 429 });
  let contextSource = null;
  let meta = {};
  try {
    const authorized = await verifySession(request);
    if (!authorized) return json({ error: "unauthorized" }, { status: 401 });

    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, { status: 405 });
    }

    const payload = await request.json();
    contextSource = payload?.context?.source || null;
    const addr = payload?.address || {};
    meta = {
      addressZip: addr.zip || null,
      addressCity: addr.city || null,
      addressProvince: addr.province || addr.provinceCode || null,
      addressCountry: addr.country || null,
    };
    const hasContext = !!payload?.context?.source && !!payload?.context?.shopDomain;
    const hasAddress = !!payload?.address?.address1 && !!payload?.address?.city && !!payload?.address?.country;
    if (!hasContext || !hasAddress) {
      return json({ error: "bad_request" }, { status: 400 });
    }

    const result = await validateAddressPipeline(payload);

    writeLog({
      route: "validate-address",
      status: "ok",
      action: result?.action,
      shopDomain: payload?.context?.shopDomain,
      contextSource,
      ...meta,
      message: result?.message,
    });

    return json(result, { status: 200 });
  } catch (err) {
    console.error("validate-address error", err);
    writeLog({
      route: "validate-address",
      status: "error",
      contextSource: contextSource || null,
      ...meta,
      reason: String(err && err.message ? err.message : err),
    });
    return json({ status: "error", error: "server_error" }, { status: 500 });
  }
}

export const loader = () => new Response("Not Found", { status: 404 });
