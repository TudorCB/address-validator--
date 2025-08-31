# Address Validator++ — v1.1 Roadmap

## Validation Integrations
- Google Address Validation API (done; enable via GOOGLE_MAPS_API_KEY)
- DPV adapters: USPS, EasyPost, Shippo (done)
- International providers (Loqate, Melissa) — investigation

## Maps & UX
- Static Maps signed URLs (optional; supported via CLIENT_ID + SIGNING_SECRET)
- Rooftop confirmation modal (pin drag; store coordinates in order attributes)

## Performance & Cost
- Redis-backed caching layer (per-address hash) — wire up `app/lib/cache.js` in pipeline
- Per-shop quotas & alerting; admin notifications for high fallback rates

## Security
- Harden App Bridge token handling in Admin UI (replace stub usage)
- Secret rotation, integrity checks, and audit trails

## Admin
- Additional insights and guided CTAs
- Multi-shop dashboards and filters

## Testing
- Contract tests for `/api/validate-address`
- Extension harness tests and end-to-end smoke flows
