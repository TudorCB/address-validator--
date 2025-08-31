import crypto from "node:crypto";

// In-memory counters for failure reasons
const failureCounters = Object.create(null);
function bump(reason) {
  const k = String(reason || "unknown");
  failureCounters[k] = (failureCounters[k] || 0) + 1;
}
function logFail(reason, extra = {}) {
  bump(reason);
  try {
    const evt = {
      at: "session-verify",
      event: "verify_failed",
      reason,
      ...extra,
    };
    // Structured one-line JSON for easy ingestion
    console.warn(JSON.stringify(evt));
  } catch {
    // noop
  }
}

/**
 * Verify Shopify session tokens (JWT HS256) issued to UI extensions/App Bridge.
 * Strict mode is enabled when NODE_ENV=="production" OR SESSION_TOKEN_ALLOW_DEV_STUB==="false".
 * - Requires Authorization: Bearer <jwt>
 * - Validates HS256 signature using SHOPIFY_API_SECRET
 * - Validates exp/nbf clock claims
 * - Validates aud equals SHOPIFY_API_KEY when present
 * - Validates dest host shape; and if expectedShopDomain is provided, requires exact host match
 * - In non-strict mode, allows the stub token "dev.stub.jwt" for local testing
 */
export async function verifySession(request, { expectedShopDomain } = {}) {
  try {
    const strict = (process.env.NODE_ENV || "development") === "production" || String(process.env.SESSION_TOKEN_ALLOW_DEV_STUB || "true").toLowerCase() === "false";

    const auth = request.headers.get("authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) {
      logFail("missing_authorization", { path: new URL(request.url).pathname, method: request.method });
      return false;
    }
    const token = auth.slice(7).trim();
    if (!token) {
      logFail("empty_token", { path: new URL(request.url).pathname });
      return false;
    }

    // Dev convenience: accept stub token only when not strict
    if (!strict && token === "dev.stub.jwt") return true;

    const parts = token.split(".");
    if (parts.length !== 3) {
      logFail("malformed_jwt", { path: new URL(request.url).pathname });
      return false;
    }
    const [headerB64, payloadB64, sigB64] = parts;

    const header = jsonFromB64Url(headerB64);
    const payload = jsonFromB64Url(payloadB64);
    if (!header || !payload) {
      logFail("invalid_b64_segment", { path: new URL(request.url).pathname });
      return false;
    }

    if (header.alg !== "HS256") {
      logFail("unsupported_alg", { alg: header.alg });
      return false;
    }
    const apiSecret = process.env.SHOPIFY_API_SECRET || "";
    const apiKey = process.env.SHOPIFY_API_KEY || "";
    if (!apiSecret) {
      logFail("missing_api_secret");
      return false;
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", apiSecret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const expected = toBase64Url(hmac.digest());
    if (!timingSafeEqualB64(sigB64, expected)) {
      logFail("bad_signature");
      return false;
    }

    // Validate time-based claims
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && now >= payload.exp) {
      logFail("token_expired", { now, exp: payload.exp });
      return false;
    }
    if (typeof payload.nbf === "number" && now < payload.nbf) {
      logFail("token_not_yet_valid", { now, nbf: payload.nbf });
      return false;
    }

    // Validate audience when available
    if (payload.aud && apiKey && payload.aud !== apiKey) {
      logFail("aud_mismatch", { aud: payload.aud });
      return false;
    }

    // Validate dest host shape and optional match
    if (payload.dest && typeof payload.dest === "string") {
      try {
        const u = new URL(payload.dest);
        const host = u.hostname.toLowerCase();
        const myshopify = /myshopify\.com$/i.test(host);
        const custom = (process.env.SHOP_CUSTOM_DOMAIN || "").toLowerCase();
        if (!myshopify && (!custom || host !== custom)) {
          logFail("invalid_dest_host", { host });
          return false;
        }
        if (expectedShopDomain) {
          const expectedHost = String(expectedShopDomain).toLowerCase();
          if (host !== expectedHost) {
            logFail("dest_shop_mismatch", { host, expected: expectedHost });
            return false;
          }
        }
      } catch {
        logFail("invalid_dest_url", { dest: payload.dest });
        return false;
      }
    }

    return true;
  } catch (e) {
    logFail("exception", { message: String(e && e.message ? e.message : e) });
    return false;
  }
}

export function extractShopFromAuthHeader(request) {
  try {
    const auth = request.headers.get("authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) return null;
    const token = auth.slice(7).trim();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);
    const dest = String(payload.dest || "");
    const m = dest.match(/^https?:\/\/([^/]+)/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function getSessionVerifyFailureCounters() {
  return { ...failureCounters };
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
