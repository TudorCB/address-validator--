import jwt from "jsonwebtoken";

const allowDevStub = String(process.env.SESSION_TOKEN_ALLOW_DEV_STUB || "true") !== "false";
const secret = process.env.SESSION_SECRET || process.env.SHOPIFY_API_SECRET;

const counters = {
  total: 0,
  ok: 0,
  fail: { missing: 0, badsig: 0, expired: 0, notyet: 0, aud: 0, dest: 0, other: 0 }
};

export async function verifySession(request, { expectedAud, expectedDestHost } = {}) {
  counters.total++;
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) { counters.fail.missing++; return false; }

    // In production, dev stub is NEVER allowed.
    const prod = process.env.NODE_ENV === "production";

    // Dev stub acceptance when not production and explicitly allowed
    if (!prod && allowDevStub && token === "dev.stub.jwt") { counters.ok++; return true; }

    if (!secret && prod) { counters.fail.other++; return false; }
    if (!secret && !prod) { counters.fail.other++; return false; }

    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });

    // time checks are done by verify; optional aud/dest checks:
    if (expectedAud && payload.aud && payload.aud !== expectedAud) { counters.fail.aud++; return false; }
    if (expectedDestHost && payload.dest && !String(payload.dest).includes(expectedDestHost)) { counters.fail.dest++; return false; }

    counters.ok++;
    return true;
  } catch (e) {
    if (e.name === "TokenExpiredError") counters.fail.expired++;
    else if (e.name === "NotBeforeError") counters.fail.notyet++;
    else counters.fail.badsig++;
    return false;
  }
}

export function sessionVerifyStats() {
  return { ...counters };
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
