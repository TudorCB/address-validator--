import crypto from "node:crypto";

/**
 * Verify Shopify session tokens (JWT HS256) issued to UI extensions/App Bridge.
 * - Validates signature using SHOPIFY_API_SECRET
 * - Validates exp/nbf clock, and aud (SHOPIFY_API_KEY) when present
 * - In dev (NODE_ENV!=="production"), optionally accepts the stub token "dev.stub.jwt"
 */
export async function verifySession(request) {
  try {
    const auth = request.headers.get("authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) return false;
    const token = auth.slice(7).trim();
    if (!token) return false;

    // Dev convenience: accept stub token unless explicitly disabled
    const devMode = (process.env.NODE_ENV || "development") !== "production";
    const allowDevStub = String(process.env.SESSION_TOKEN_ALLOW_DEV_STUB || "true").toLowerCase() !== "false";
    if (devMode && allowDevStub && token === "dev.stub.jwt") return true;

    const [headerB64, payloadB64, sigB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !sigB64) return false;

    const header = jsonFromB64Url(headerB64);
    const payload = jsonFromB64Url(payloadB64);
    if (!header || !payload) return false;

    if (header.alg !== "HS256") return false;
    const apiSecret = process.env.SHOPIFY_API_SECRET || "";
    const apiKey = process.env.SHOPIFY_API_KEY || "";
    if (!apiSecret) return false;

    // Verify signature
    const hmac = crypto.createHmac("sha256", apiSecret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const expected = toBase64Url(hmac.digest());
    if (!timingSafeEqualB64(sigB64, expected)) return false;

    // Validate time-based claims
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && now >= payload.exp) return false;
    if (typeof payload.nbf === "number" && now < payload.nbf) return false;

    // Validate audience when available
    if (payload.aud && apiKey && payload.aud !== apiKey) return false;

    // Optional: validate dest/iss shape if present
    if (payload.dest && typeof payload.dest === "string") {
      try {
        const u = new URL(payload.dest);
        if (!/myshopify\.com$/.test(u.hostname)) {
          // Allow custom domains if configured
          const custom = process.env.SHOP_CUSTOM_DOMAIN;
          if (!custom || u.hostname !== custom) return false;
        }
      } catch {
        return false;
      }
    }

    return true;
  } catch (e) {
    console.warn("[session-verify] error:", e);
    return false;
  }
}

function jsonFromB64Url(b64url) {
  try {
    const json = Buffer.from(b64url.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function toBase64Url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function timingSafeEqualB64(a, b) {
  try {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}
