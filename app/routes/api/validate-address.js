import { json } from "@remix-run/node";
import { verifySession } from "../../lib/session-verify.js";
import { rateLimitKey } from "../../lib/rate-limit-redis.js";
import { validateAddressPipeline } from "../../lib/validateAddressPipeline.js";
import { getSettings } from "../../lib/settings.js";
import { writeLog } from "../../lib/logs.js";
function rateKey(request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
  return `ratelimit:validate:${ip}`;
}

export async function action({ request }) {
  const ipRate = await rateLimitKey({ key: rateKey(request), max: 300, windowSec: 60 });
  if (!ipRate.allowed) return json({ error: "rate_limited", resetAt: ipRate.resetAt }, { status: 429 });
  let contextSource = null;
  let meta = {};
  try {
    const authorized = await verifySession(request, { expectedAud: process.env.SHOPIFY_API_KEY });
    if (!authorized) return json({ error: "unauthorized" }, { status: 401 });

    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, { status: 405 });
    }

    const payload = await request.json();
    contextSource = payload?.context?.source || null;
    const shopDomain = payload?.context?.shopDomain || "unknown";
    // Per-shop rate limit to prevent quota exhaustion
    const perShopMax = Number(process.env.RATE_LIMIT_PER_SHOP_MIN || 600);
    const shopRate = await rateLimitKey({ key: `shop:${shopDomain}`, max: Number.isFinite(perShopMax) ? perShopMax : 600, windowSec: 60 });
    if (!shopRate.allowed) return json({ error: "rate_limited", scope: "shop", resetAt: shopRate.resetAt }, { status: 429 });
    const addr = payload?.address || {};
    meta = {
      addressZip: addr.zip || null,
      addressCity: addr.city || null,
      addressProvince: addr.province || addr.provinceCode || null,
      addressCountry: addr.country || null,
    };
    const hasContext = !!payload?.context?.source && !!payload?.context?.shopDomain;
    const hasAddress = !!payload?.address?.address1 && !!payload?.address?.city && !!payload?.address?.country;
    if (!hasContext) {
      return json({ error: "bad_request" }, { status: 400 });
    }
    // For thank_you and customer_account, allow missing address and return a summary stub
    if (!hasAddress && (contextSource === "thank_you" || contextSource === "customer_account")) {
      const settings = await getSettings(payload?.context?.shopDomain || "__global__");
      return json({
        status: "ok",
        action: "UNVERIFIED",
        message: "No address provided at this surface. Showing summary only.",
        correctedAddress: null,
        dpvFlags: {},
        rooftop: null,
        mapImageUrl: null,
        confidence: 0,
        settings,
      });
    }
    if (!hasAddress) {
      return json({ error: "bad_request" }, { status: 400 });
    }

    const result = await validateAddressPipeline(payload);

    writeLog({
      route: "validate-address",
      status: "ok",
      action: result?.action,
      shopDomain,
      contextSource,
      ...meta,
      dpvFlags: result?.dpvFlags || {},
      provider: result?.provider || null,
      providerResponseId: result?.providerResponseId || null,
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
