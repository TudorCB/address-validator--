# Address Validator++  v1 Acceptance Checklist

## Extensions
- [ ] Checkout UI extension TOML uses points:
      - purchase.checkout.delivery-address.render
      - purchase.checkout.block.render
- [ ] Thank You extension TOML uses purchase.thank-you.block.render
- [ ] Customer Address extension TOML uses customer-account.profile.addresses.render-after

## Backend
- [ ] /api/validate-address accepts POST JSON with {context, address}
- [ ] Responds with fields: status, action, message, correctedAddress?, dpvFlags?, rooftop?, mapImageUrl?, confidence?
- [ ] Rate limit returns 429 with { error: "rate_limited" }
- [ ] Session check returns 401 with { error: "unauthorized" }

## Dev UI
- [ ] Demo checkout UI calls the API with a stubbed token and renders messages
- [ ] Logs endpoint /admin/logs lists recent calls

## Non-Goals (v1)
- [ ] Real Google Address Validation & Static Maps signing (planned)
- [ ] Real JWT verification (planned)
- [ ] Redis cache (planned)

