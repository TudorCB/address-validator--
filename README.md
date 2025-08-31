# Address Validator++ (Shopify + Remix)

Address Validator++ is a Shopify app that validates and normalizes shipping addresses across multiple storefront surfaces (Checkout, Thank‑you, and Customer Account) and provides merchants with actionable analytics and controls. It is built with Remix, Polaris, Prisma, and Shopify app libraries. UI extensions call server APIs with session tokens; the server applies validation rules, rate limits, and logs outcomes for analysis.

• Admin UI: Polaris dashboard, analytics, settings, and pickup management
• Extensions: Checkout UI, Thank‑you, and Customer Account surfaces
• Server: Validation pipeline (DPV stub + Google), rate limiting, JWT token verification, logging, and analytics APIs

## Project Docs

- Acceptance checklist (v1): `docs/acceptance.md`
- Roadmap (v1.1): `docs/roadmap-v1_1.md`
- Troubleshooting: `docs/troubleshooting.md`
- Environment & scopes: `docs/env-and-scopes.md`

## What It Does

- Validates addresses during checkout and other surfaces using a pipeline that:
  - Normalizes the input (street suffix casing, ZIP capitalization, etc.).
  - Runs a DPV-style check (stubbed provider) to detect PO Boxes and missing apartment/unit.
  - Optionally calls Google Address Validation for rooftop‑level signals and suggested formatting (falls back gracefully if not configured).
  - Applies merchant rules: hard block vs soft mode, auto‑apply corrections, suggest store pickup when in range.
- Captures non‑PII logs for analytics (action, ZIP/city/province/country, timestamps, provider response id).
- Computes KPIs, trends and “top problem clusters” (by ZIP/city) and provides quick actionable recommendations.
- Lets merchants configure policies and parameters: PO Box policy, soft mode, auto‑apply corrections, pickup search radius, and failed delivery cost (for savings estimate).
- Manages store pickup locations and suggests pickup if the shipping address is undeliverable but within the configured radius.

## Key Features

- Address validation with server authority:
  - Actions: `OK`, `CORRECTED`, `UNVERIFIED`, `BLOCK_MISSING_UNIT`, `BLOCK_PO_BOX`, `SUGGEST_PICKUP`.
  - Soft mode downgrades blocks to warnings.
  - Auto‑apply server‑suggested corrections back to checkout fields when safe.
- Admin analytics dashboard:
  - KPIs: total validations, corrected, blocked, estimated savings.
  - Trends over time; top problem ZIPs/cities; provider metrics (ok/fail rates, p50 latency).
  - CSV export for recent logs.
- Settings and pickup management UIs.
- Rate limiting (per‑IP and per‑shop) with Redis support, in‑memory fallback.
- Session token verification for all API endpoints called by extensions (JWT HS256 using `SHOPIFY_API_SECRET`) with a dev stub token.

## Architecture Overview

- Remix app entry: `app/root.jsx`, `app/entry.server.jsx`.
- Shopify server bootstrap: `app/shopify.server.js`.
- Data access (Prisma): `app/db.server.js`, `prisma/schema.prisma`.
- Validation pipeline: `app/lib/validateAddressPipeline.js` (uses `app/lib/dpv.js`, `app/lib/google.js`, `app/lib/address-normalize.js`).
- Settings: `app/lib/settings.js` (Prisma backed).
- Pickup utilities: `app/lib/pickups.js` + distance `app/lib/haversine.js`.
- Rate limiting: `app/lib/rate-limit-redis.js` (Redis) and `app/lib/rate-limit.js` (in‑memory).
- Session token verification: `app/lib/session-verify.js`.
- Logging & metrics: `app/lib/logs.js`, `app/lib/metrics.js` (PII minimized).
- Admin UI: `app/components/*` and routes under `app/routes`.

### Data Model (Prisma)

- `Session`: Shopify sessions (provided by `@shopify/shopify-app-session-storage-prisma`).
- `AppSetting`: per‑shop settings (PO Box policy, soft mode, auto‑apply, pickup radius, failed delivery cost).
- `ValidationLog`: outcome logs without PII (ZIP/city/province/country only; normalized address hash is computed transiently).
- `PickupLocation`: store pickup points for suggestions.

## UI Extensions

- Checkout UI: `extensions/checkout-ui` (`purchase.checkout.delivery-address.render`)
  - Debounces address input, calls `/api/validate-address`, shows results, optionally auto‑applies corrections, and blocks progress when hard rules trigger.
- Thank‑you: `extensions/thank-you` (`purchase.thank-you.block.render`)
  - Shows final status of the shipping address, useful for post‑purchase hygiene.
- Customer Account: `extensions/customer-address` (`customer-account.profile.addresses.render-after`)
  - Evaluates default address and surfaces hygiene messages.

All extensions use `getSessionToken()` to fetch a short‑lived token and call server endpoints with `Authorization: Bearer <token>`.

## API Endpoints

- `POST /api/validate-address` → validate an address with context
  - Body: `{ context: { source, shopDomain }, address: { address1,address2,city,province,zip,country }, options? }`
  - Response: `{ status, action, message, correctedAddress?, dpvFlags?, rooftop?, mapImageUrl?, confidence?, settings?, providerResponseId? }`
- `POST /api/pickup-distance-check` → compute nearest pickup for a geo point
- `GET /api/settings` → read shop settings
- `PATCH /api/settings/update` → update allowed fields
- `GET/POST /api/pickups` → list/create pickup locations
- `PATCH/DELETE /api/pickups/:id` → update/delete pickup location
- Analytics (used by admin dashboard):
  - `GET /api/analytics/summary`
  - `GET /api/analytics/top-problems`
  - `GET /api/analytics/providers`
  - `POST /api/analytics/simulate` (what‑if impact of toggles)
- Admin CSV export: `GET /admin/logs.csv`

All endpoints require `Authorization: Bearer <session-token>` and enforce per‑IP and per‑shop rate limits. In development, the stub token `dev.stub.jwt` is accepted unless `SESSION_TOKEN_ALLOW_DEV_STUB=false`.

## Configuration & Environment

See `docs/env-and-scopes.md` for the full list. Common variables:

- Shopify: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES` (or use `shopify.app.toml`).
- Providers: `GOOGLE_MAPS_API_KEY` (optional), `GOOGLE_MAPS_URL_CLIENT_ID` and `GOOGLE_MAPS_URL_SIGNING_SECRET` for Static Maps URLs (optional).
- Redis (optional): `REDIS_URL` for rate limiting and caching.
- Behavior: `SESSION_TOKEN_ALLOW_DEV_STUB`, `RATE_LIMIT_PER_SHOP_MIN`, `LOG_TTL_DAYS`.

## Development

Install dependencies and prepare the DB:

```sh
npm install
npm run setup
```

Run the app with Shopify CLI (tunnel + HMR):

```sh
npm run dev
```

Build and serve production:

```sh
npm run build
npm run start
```

Typecheck + lint:

```sh
npm run verify
```

Smoke tests (requires the server on :3000):

```sh
npm test
```

## Files of Interest (jump‑off points)

- Remix shell: `app/root.jsx`, `app/entry.server.jsx`
- Shopify bootstrap: `app/shopify.server.js`
- Validation pipeline: `app/lib/validateAddressPipeline.js`
- Google adapter: `app/lib/google.js`
- DPV stub: `app/lib/dpv.js`
- Settings & pickups: `app/lib/settings.js`, `app/lib/pickups.js`
- Session verify: `app/lib/session-verify.js`
- Admin UI: `app/components/AnalyticsDashboard.jsx`, `app/components/AppFrame.jsx`, `app/routes/analytics.jsx`, `app/routes/settings.jsx`, `app/routes/pickups.jsx`, `app/routes/index.jsx`
- APIs: `app/routes/api.*` and `app/routes/api.*/*/route.js`

## Security & Privacy

- Extensions never include provider secrets; server performs all external calls.
- Logs exclude PII (no phone/email; `address2` is stripped) and focus on outcome + region.
- JWT session verification validates signature, time claims, and destination host; strict mode is enforced in production.

## Limitations / Current State

- DPV is a stubbed adapter; integrate USPS/UPS in production.
- Google Address Validation is optional; the app falls back to heuristics if unavailable.
- Dev environments can use the stub token; configure `SESSION_TOKEN_ALLOW_DEV_STUB=false` to harden.

---

© Address Validator++ — Remix + Shopify. See `docs/` for acceptance, roadmap, and troubleshooting.

