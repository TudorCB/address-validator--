# Environment Variables & OAuth Scopes

This app uses Shopify’s Remix library for embedded apps, Prisma for persistence, optional Redis for rate limiting/caching, and several external validation providers. Configure via a `.env` file (copy from `.env.example` if present) or environment variables in your hosting environment.

## Core Shopify App

- `SHOPIFY_API_KEY`: App API key
- `SHOPIFY_API_SECRET`: App API secret (used to verify session tokens)
- `SHOPIFY_APP_URL`: Public app URL (used by OAuth callbacks)
- `SCOPES`: Comma-separated list of Admin scopes
- `SHOP_CUSTOM_DOMAIN` (optional): Custom shop domain for embedded auth

## Session Tokens

- `SESSION_SECRET` (optional): Override secret for JWT verification; defaults to `SHOPIFY_API_SECRET`
- `SESSION_TOKEN_ALLOW_DEV_STUB` (default: true in dev): When not production, if `true`, accepts the stub token `dev.stub.jwt` for local testing

## Data & Persistence

- `DATABASE_URL`: Prisma connection string (defaults to SQLite `file:dev.sqlite` via `prisma/schema.prisma`)
- `REDIS_URL` (optional): Redis connection string for rate limits and cache (`redis://[:password@]host:port`)

## Providers & Validation

- `DPV_PROVIDER`: One of `usps`, `easypost`, `shippo` (falls back to a local heuristic stub on error)
- `DPV_TIMEOUT_MS` (optional): Timeout per provider call (default 3000)
- `USPS_WEBTOOLS_USERID` (required if `DPV_PROVIDER=usps`)
- `EASYPOST_API_KEY` (required if `DPV_PROVIDER=easypost`)
- `SHIPPO_API_TOKEN` (required if `DPV_PROVIDER=shippo`)
- `GOOGLE_MAPS_API_KEY` (optional): Enables Google Address Validation; omitted in dev by default
- `GOOGLE_MAPS_URL_CLIENT_ID` / `GOOGLE_MAPS_URL_SIGNING_SECRET` (optional): Enable signed Static Maps URLs without exposing an API key

## Rate Limiting

- Per-IP: enforced via Redis when `REDIS_URL` is set; in-memory fallback otherwise
- Per-shop minute quota: `RATE_LIMIT_PER_SHOP_MIN` (default 600)

## Caching

- Address validation cache TTL: `CACHE_TTL_SECONDS` (default 86400)

## Development & Build

- `NODE_ENV`: `development` or `production`
- `PORT` or `SHOPIFY_APP_PORT`: Remix server port (default 3000)
- `HOST` (dev): Helps the Shopify CLI set `SHOPIFY_APP_URL`

## Shopify Admin OAuth Scopes

Define scopes in `shopify.app.toml` or via `SCOPES`.

Recommended for this app:

- `read_checkouts`
- `read_customers`, `write_customers`
- `read_orders`

Always confirm scope names against your target Admin API version.
