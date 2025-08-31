# Address Validator++ — v1 Acceptance Checklist

## Extensions
- [x] Checkout UI extension (`purchase.checkout.delivery-address.render`, `purchase.checkout.block.render`)
- [x] Thank You extension (`purchase.thank-you.block.render`)
- [x] Customer Account extension (`customer-account.profile.addresses.render-after`)

## Backend
- [x] `/api/validate-address` accepts POST JSON with `{ context, address }`
- [x] Responds with fields: `status`, `action`, `message`, `correctedAddress?`, `dpvFlags?`, `rooftop?`, `mapImageUrl?`, `confidence?`, `settings`
- [x] Per-IP and per-shop rate limits (429 on exceed)
- [x] Session check with JWT HS256 (401 on failure), dev stub allowed in non-production
- [x] Settings CRUD: `/api/settings`, `/api/settings/update`
- [x] Pickup CRUD: `/api/pickups`, `/api/pickups/:id`
- [x] Analytics: `summary`, `top-problems`, `providers`, `simulate`
- [x] Admin CSV export of non‑PII logs: `/admin/logs/csv`

## Admin UI
- [x] Polaris frame + navigation
- [x] Settings page (PO Box policy, soft mode, auto-apply, pickup radius, failed delivery cost)
- [x] Pickup locations management
- [x] Analytics dashboard (KPIs, trend, insights, problem clusters)

## Non-Goals (v1)
- [ ] International address validation providers
- [ ] Full caching of provider responses (cache util is present but not wired)
- [ ] Advanced anomaly detection and alerting

