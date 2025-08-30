# Address Validator++  v1.1 Roadmap

## Validation Integrations
- Google Address Validation API (server-side)
- USPS/UPS DPV adapters
- International providers (Loqate, Melissa)  investigation

## Maps & UX
- Static Maps signed URLs
- Rooftop confirmation modal (pin drag  store coordinates in order attributes)

## Performance & Cost
- Redis-backed caching layer (per-address hash)
- Per-shop quotas & alerting

## Security
- Proper JWT verification for session tokens
- Rotate secrets; add integrity checks

## Admin
- Merchant settings (pickup radius, block PO boxes)
- Export logs as CSV

## Testing
- Contract tests for /api/validate-address
- Extension harness tests

