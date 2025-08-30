/**
 * Verifies Shopify extension session token (stub with basic checks).
 * Later: use Shopify's JWT verification helpers to validate signature/claims.
 */
export async function verifySession(request) {
  try {
    const auth = request.headers.get("authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) return false;
    const token = auth.slice(7).trim();
    if (!token) return false;

    // Very light sanity check: looks like a JWT?
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // TODO: verify signature & claims (dest, exp) with Shopify helpers/server secret.
    // For MVP: allow the request (dev mode) but keep a guard to disable easily.
    const DEV_ALLOW_ALL = true;
    if (DEV_ALLOW_ALL) return true;

    return false;
  } catch (e) {
    console.warn("[session-verify] error:", e);
    return false;
  }
}
