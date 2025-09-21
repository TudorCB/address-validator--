# Address Validator++ (Shopify + Remix)

Address Validator++ is a Shopify app that validates and normalizes shipping addresses across multiple storefront surfaces (Checkout, Thank-you, and Customer Account) and gives merchants analytics, controls, and pickup suggestions to reduce failed deliveries. It is built with Remix, Polaris, Prisma, and Shopify’s app libraries. UI extensions obtain a session token and call server APIs; the server enforces policy, rate limits, and logs outcomes for analysis.

- Admin UI: Polaris dashboard, analytics, settings, and pickup management
- Extensions: Checkout UI, Thank-you, and Customer Account surfaces
- Server: Validation pipeline (DPV via USPS/EasyPost/Shippo + optional Google), rate limiting, JWT verification, logging, and analytics APIs

## Project Docs

- Acceptance checklist: `docs/acceptance.md`
- Roadmap: `docs/roadmap-v1_1.md`
- Troubleshooting: `docs/troubleshooting.md`
- Environment & scopes: `docs/env-and-scopes.md`
- API usage: `docs/api-usage.md`

## What It Does

- Validates addresses during checkout and other surfaces using a pipeline that:
  - Normalizes the input (street suffix casing, ZIP capitalization, etc.).
  - Runs a DPV-style check (USPS/EasyPost/Shippo or stub) to detect PO Boxes and missing apartment/unit.
  - Optionally calls Google Address Validation for rooftop-level signals and suggested formatting (falls back gracefully if not configured).
  - Applies merchant rules: hard block vs soft mode, auto-apply corrections, suggest store pickup when in range.
- Captures non-PII logs for analytics (action, ZIP/city/province/country, timestamps, provider response id).
- Computes KPIs, trends and “top problem clusters” (by ZIP/city) and surfaces actionable recommendations.
- Lets merchants configure policies and parameters: PO Box policy, soft mode, auto-apply corrections, pickup search radius, and failed delivery cost (for savings estimate).
- Manages store pickup locations and suggests pickup if the shipping address is undeliverable but within the configured radius.

## Key Features

- Address validation with server authority:
  - Actions: `OK`, `CORRECTED`, `UNVERIFIED`, `BLOCK_MISSING_UNIT`, `BLOCK_PO_BOX`, `BLOCK_UNDELIVERABLE`, `SUGGEST_PICKUP`.
  - Soft mode downgrades blocks to warnings.
  - Optionally auto-apply server-suggested corrections back to checkout fields when safe.
- Admin analytics dashboard:
  - KPIs: total validations, deliverable OK, corrected, blocked, estimated savings.
  - Trends over time; top problem ZIPs/cities; provider metrics (ok/fail counts, p50 latency); CSV export.
- Settings and pickup management UIs.
- Rate limiting (per-IP and per-shop) with Redis support and in-memory fallback.
- Session token verification (JWT HS256 with `SHOPIFY_API_SECRET`), with a dev stub token accepted only in non-production.

## How It Works

- Pipeline: `app/lib/validateAddressPipeline.js`
  - Normalize address (`address-normalize.js`) and compute a canonical key.
  - DPV provider selection via `DPV_PROVIDER` env: USPS, EasyPost, Shippo; falls back to a heuristic stub on error.
  - Map DPV flags to actions (`dpv.js`): block PO Boxes (configurable), require missing unit, or block undeliverable.
  - If hard-blocked as undeliverable, try Google geocode to suggest nearest pickup if within configured radius.
  - Otherwise, run a lightweight correction and optionally call Google Address Validation to improve formatting and confidence.
  - Return a single authoritative response to the extension: action, message, correctedAddress, dpv flags, optional rooftop/map.
- Logging & analytics: `app/lib/logs.js`, `app/routes/api/analytics.*`
  - Writes non-PII logs to Prisma (falls back to memory if DB unavailable).
  - Analytics endpoints compute KPIs, time trends, top problem areas, and recommendations.
- Security: `app/lib/session-verify.js`
  - Verifies UI extension session tokens (JWT HS256) with counters accessible at `/api/security/stats`.
- Rate limiting: `app/lib/rate-limit-redis.js` (per-IP and per-shop sliding window), with local fallback.
- Pickups: `app/lib/pickups.js` manages locations; distance computed with `app/lib/haversine.js`.

## Architecture Overview

- Remix entry: `app/root.jsx`, `app/entry.server.jsx`
- Shopify bootstrap: `app/shopify.server.js`
- Data access (Prisma): `app/db.server.js`, `prisma/schema.prisma`
- Validation pipeline: `app/lib/validateAddressPipeline.js` (uses `dpv.js`, `google.js`, `address-normalize.js`)
- Settings store: `app/lib/settings.js` (Prisma-backed with defaults)
- Logging & metrics: `app/lib/logs.js`, `app/lib/metrics.js`
- Rate limits: `app/lib/rate-limit-redis.js` and `app/lib/rate-limit.js`
- Admin UI: `app/components/*` and routes under `app/routes`

### Data Model (Prisma)

- `Session`: Shopify sessions (`@shopify/shopify-app-session-storage-prisma`).
- `AppSetting`: per-shop settings (PO Box policy, soft mode, auto-apply, pickup radius, failed delivery cost).
- `ValidationLog`: outcome logs without PII (ZIP/city/province/country only).
- `PickupLocation`: store pickup points for suggestions.

## UI Extensions

- Checkout UI: `extensions/checkout-ui` (`purchase.checkout.delivery-address.render`, `purchase.checkout.block.render`)
  - Debounces address input, calls `/api/validate-address`, renders result, optionally auto-applies corrections, and blocks progress for hard rules (unless soft mode).
- Thank-you: `extensions/thank-you` (`purchase.thank-you.block.render`)
  - Shows final status of the shipping address, useful for post-purchase hygiene.
- Customer Account: `extensions/customer-address` (`customer-account.profile.addresses.render-after`)
  - Evaluates default address and surfaces hygiene messages.

All extensions call server endpoints with `Authorization: Bearer <token>` using `getSessionToken()`.

## API Endpoints (server)

- `POST /api/validate-address` → validate an address with context
  - Body: `{ context: { source, shopDomain }, address: { address1,address2,city,province,zip,country }, options? }`
  - Returns: `{ status, action, message, correctedAddress?, dpvFlags?, rooftop?, mapImageUrl?, confidence?, settings, providerResponseId? }`
- `POST /api/pickup-distance-check` → determine nearest pickup and in-range evaluation
- `GET /api/settings` and `PATCH /api/settings/update` → get/update settings (per shop)
- `GET /api/pickups` / `POST /api/pickups` / `PATCH|DELETE /api/pickups/:id` → manage pickup locations
- Analytics:
  - `GET /api/analytics/summary`
  - `GET /api/analytics/top-problems`
  - `GET /api/analytics/providers`
  - `POST /api/analytics/simulate`
- `GET /api/security/stats` → session token verification counters
- `GET /admin/logs/csv` → CSV export of non-PII logs

See `docs/api-usage.md` for request/response shapes and examples.

## Development

- Install deps and set up DB: `npm run setup`
- Start dev with Shopify Remix + Vite: `npm run dev`
- Lint and typecheck: `npm run verify`
- Build: `npm run build` → `build/`
- Serve production build: `npm run start`
- Smoke tests: `npm test`

Environment variables and OAuth scopes are documented in `docs/env-and-scopes.md`.

## Dev on Windows & WSL/Linux

- Use the local Shopify CLI for correct native binaries.
  - This repo includes `@shopify/cli` in devDependencies so npm resolves a platform‑correct binary.
  - Standard dev: `npm run dev`
  - One‑shot fallback (always latest CLI): `npm run dev:npx`
- Install dependencies per OS. Do not copy `node_modules` between Windows and WSL/Linux.
  - On Windows: `npm ci`
  - On WSL/Linux: `npm ci`
  - If you switch OS, clean and reinstall: `rm -rf node_modules package-lock.json && npm ci`
- WSL specifics (avoid Windows global CLI):
  - Prefer `npm run dev` so npm uses `./node_modules/.bin/shopify` from this project.
  - If PATH in WSL contains a Windows npm global (e.g., `/mnt/c/Users/<you>/AppData/Roaming/npm`), it can cause esbuild mismatch errors.
    - Quick check: `echo $PATH | tr ':' '\n' | grep -i appdata || true`
    - Safe workaround without changing PATH: use `npm run dev` or `npm run dev:npx`.
  - Optional convenience in WSL: `alias shopify="$(npm bin)/shopify"` in `~/.bashrc` so `shopify` resolves locally.
- Node version: use a version matching `package.json` engines (`^18.20`, `^20.10`, or `>=21`).
  - This repo includes an `.nvmrc` pinned to `20.10.0`.
  - With nvm: `nvm use` (and `nvm install` the first time).

## Configuration Highlights

- DPV providers: set `DPV_PROVIDER` to `usps`, `easypost`, or `shippo`. Missing credentials degrade to a local stub.
- Google Address Validation: set `GOOGLE_MAPS_API_KEY` to enable; optional Static Maps signing via `GOOGLE_MAPS_URL_CLIENT_ID` and `GOOGLE_MAPS_URL_SIGNING_SECRET`.
- Rate limits: per-IP and per-shop via Redis if `REDIS_URL` is set; in-memory fallback in dev.
- Session verification: JWT HS256 with `SHOPIFY_API_SECRET`. In dev, a stub token `dev.stub.jwt` is allowed unless `SESSION_TOKEN_ALLOW_DEV_STUB=false`.

## Notes

- PII minimization: logs only include city/ZIP/province/country and coarse context. Address2 is excluded from the normalized hash.
- Address-level caching: the validation pipeline caches results per normalized address and policy toggles using `app/lib/cache.js` (Redis if configured, in-memory otherwise). TTL is controlled by `CACHE_TTL_SECONDS` (default 86400).

Environment & secrets

 SESSION_TOKEN_ALLOW_DEV_STUB=false in production

 SESSION_SECRET (or SHOPIFY_API_SECRET) set and rotated

 SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL configured

 DPV provider chosen + creds set
DPV_PROVIDER=usps|easypost|shippo
USPS_WEBTOOLS_USERID or EASYPOST_API_KEY or SHIPPO_API_TOKEN

 (Optional) Google: GOOGLE_MAPS_API_KEY (+ Static Maps signing vars if used)

 Redis: REDIS_URL (required for multi-instance prod)

 Rate limits: RATE_LIMIT_PER_SHOP_MIN (e.g., 600)

 Caching: CACHE_TTL_SECONDS (e.g., 86400)

 Logs retention: LOG_TTL_DAYS (e.g., 90)

Security

 Strict JWT verification enabled (no dev stub)

 All API routes check Authorization: Bearer <jwt>

 Webhooks HMAC verified, failures alerting

 CORS headers scoped to your embedded app origin

Reliability / cost control

 Redis enabled for cache and rate-limit

 Provider calls wrapped with retry/backoff + circuit breaker

 Quota/budget alerting (Google/DPV) at 80%+

 Cache hit-rate & provider health surfaced on Analytics

UX / behavior

 Checkout writeback warning banner shows when auto-apply fails (wallet/restricted)

 Soft mode behavior verified end-to-end (BLOCK_* → UNVERIFIED)

 Empty-state + skeletons render (first-run merchant)

 iFrame sizing / embedded nav is smooth (no horizontal scroll)

Data & privacy

 Logs exclude PII (no phone/email; address2 redacted)

 CSV export contains only coarse location + action

 TTL cleanup job scheduled (e.g., daily)

Acceptance smoke

 PO Box → BLOCK_PO_BOX (or UNVERIFIED in soft mode)

 Multi-unit without address2 → BLOCK_MISSING_UNIT via DPV

 Clean SFR → OK

 Undeliverable + nearby pickup → SUGGEST_PICKUP

 Per-shop rate-limit returns 429 with resetAt

 Analytics totals/trends match seeded data


 How to run (local / staging)
# Ensure your Remix app is running (and allows dev stub tokens)
export SESSION_TOKEN_ALLOW_DEV_STUB=true
npm run dev

# In another terminal:
export APP_URL="http://localhost:3000"
export DEV_STUB_TOKEN="dev.stub.jwt"
export SHOP_DOMAIN="demo-shop.myshopify.com"

node scripts/seed-demo-logs.js --logs 250 --days 14


Now open /analytics:

You should see KPIs, trend chart, insights, top ZIP/City tables populated.

CSV export works with your current filters.

To reseed, just rerun the script; your analytics will update accordingly.

🔒 Safety reminders

Never use the seed script (with stub token) against production.

Turn strict JWT on in production (SESSION_TOKEN_ALLOW_DEV_STUB=false) and switch any automation to real App Bridge tokens.

Keep Redis enabled in staging/prod so rate limits and cache behave like real deployments.
