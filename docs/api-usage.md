# API Usage Guide

This guide shows how to call the app’s APIs from UI extensions, Admin pages, and external tools (for testing). All endpoints require an Authorization header containing a short‑lived session token.

- Extensions: obtain a token via `const token = await api.sessionToken.get()` (Checkout/Thank‑you/Customer Account).
- Admin: use authenticated routes in the embedded app; for direct fetches from the browser, forward the token.
- Dev convenience: when `NODE_ENV !== 'production'` (or `SESSION_TOKEN_ALLOW_DEV_STUB !== 'false'`), `Bearer dev.stub.jwt` is accepted.

## Auth Header

- Header: `Authorization: Bearer <token>`
- Content type for writes: `Content-Type: application/json`

## Validate Address

- POST `/api/validate-address`
- Body
```json
{
  "context": { "source": "checkout", "shopDomain": "example.myshopify.com" },
  "address": {
    "address1": "123 main st",
    "address2": "",
    "city": "Atlanta",
    "province": "GA",
    "zip": "30303",
    "country": "US"
  },
  "options": { "allowPickupFallback": true }
}
```
- Response (shape)
```json
{
  "status": "ok",
  "action": "OK | CORRECTED | UNVERIFIED | BLOCK_MISSING_UNIT | BLOCK_PO_BOX | SUGGEST_PICKUP",
  "message": "string",
  "correctedAddress": {"address1":"","address2":"","city":"","province":"","zip":"","country":""},
  "dpvFlags": {"deliverable":true,"missingSecondary":false,"poBox":false,"ambiguous":false},
  "rooftop": {"lat": 0, "lng": 0},
  "mapImageUrl": "https://…" ,
  "confidence": 0.0,
  "settings": {"softMode":false, "autoApplyCorrections":true, …},
  "providerResponseId": "id"
}
```

Example (cURL):
```sh
curl -s -X POST http://localhost:3000/api/validate-address \
  -H "Authorization: Bearer dev.stub.jwt" \
  -H "Content-Type: application/json" \
  -d '{"context":{"source":"checkout","shopDomain":"dev-shop.myshopify.com"},"address":{"address1":"123 Main St","city":"Atlanta","zip":"30303","country":"US"}}'
```

## Pickup Distance Check

- POST `/api/pickup-distance-check`
- Body
```json
{
  "context": { "source": "checkout", "shopDomain": "example.myshopify.com" },
  "customerLocation": { "lat": 33.749, "lng": -84.388 },
  "pickupLocations": [ { "name": "Midtown", "lat": 33.76, "lng": -84.39 } ],
  "radiusKm": 25
}
```
- Response
```json
{ "status": "ok", "inRange": true, "nearest": {"name":"Midtown","lat":33.76,"lng":-84.39,"distanceKm":1.25}, "distanceKm": 1.25, "radiusKm": 25 }
```

## Settings

- GET `/api/settings` → `{ status: "ok", settings: { … } }`
- PATCH `/api/settings/update`
  - Fields accepted: `blockPoBoxes` (bool), `autoApplyCorrections` (bool), `softMode` (bool), `pickupRadiusKm` (number ≥ 0), `failedDeliveryCostUsd` (number ≥ 0)

Example:
```sh
curl -s -X PATCH http://localhost:3000/api/settings/update \
  -H "Authorization: Bearer dev.stub.jwt" \
  -H "Content-Type: application/json" \
  -d '{"blockPoBoxes":true, "softMode":false, "pickupRadiusKm":25}'
```

## Pickups

- GET `/api/pickups` → `{ status: "ok", pickups: [ … ] }`
- POST `/api/pickups` → `{ status: "ok", pickup }` with `{ name, lat, lng }`
- PATCH `/api/pickups/:id` → `{ status: "ok", pickup }`
- DELETE `/api/pickups/:id` → `{ status: "ok" }`

## Analytics

- GET `/api/analytics/summary` → KPIs + daily trends
- GET `/api/analytics/top-problems` → top by ZIP/city
- GET `/api/analytics/providers` → provider metrics snapshot
- POST `/api/analytics/simulate` → what‑if impact of toggles

Example (simulate):
```sh
curl -s -X POST http://localhost:3000/api/analytics/simulate \
  -H "Authorization: Bearer dev.stub.jwt" \
  -H "Content-Type: application/json" \
  -d '{"toggles": {"softMode": true, "blockPoBoxes": false}}'
```

## Admin CSV Export

- GET `/admin/logs/csv?range=7d&segment=all`
- Requires `Authorization` header. Exports non‑PII columns: timestamp, action, city/zip/province/country.

## Errors & Limits

- 401 `{ "error": "unauthorized" }` → missing/invalid token or strict mode without proper JWT
- 405 `{ "error": "method_not_allowed" }`
- 429 `{ "error": "rate_limited" }` → IP or per‑shop quota exceeded; response includes `resetAt`
- 400 `{ "error": "bad_request" }` → malformed inputs
- 500 `{ "error": "server_error" }`

## Notes

- Rate limits: per‑IP and per‑shop; see `RATE_LIMIT_PER_SHOP_MIN` for tuning.
- Dev: use `dev.stub.jwt` only locally. In production, extensions must use real session tokens.
