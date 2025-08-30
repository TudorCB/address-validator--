# Address Validator++  Environment & OAuth Scopes

## Environment Variables (server-only)
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_API_VERSION` (e.g., 2025-07)
- `APP_URL` (your public app URL)
- `GOOGLE_MAPS_API_KEY` (server-side only; never in extension bundles)
- `REDIS_URL` (optional; production caching)
- `SESSION_SECRET` (long, random)
- `RATE_LIMIT_PER_MIN` (default: 300)
- `CACHE_TTL_SECONDS` (default: 86400)

Optional (future integrations):
- `UPS_API_KEY`
- `DPV_API_KEY`
- `GOOGLE_MAPS_URL_SIGNING_SECRET` (Static Maps URL signing)

## Shopify Admin OAuth Scopes (server app)
- `read_checkouts` (or equivalent for current API)
- `read_customers`, `write_customers` (customer address hygiene)
- `read_orders` (optional; reconciliation)
> Scope names evolve; confirm in the target Admin API version.

## Security Notes
- Never embed Google/UPS/DPV keys in extensions.
- Use short-lived session tokens (getSessionToken) from extensions, verified server-side.

