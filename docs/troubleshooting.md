# Address Validator++  Troubleshooting & Pitfalls

## Checkout vs Wallet Flows
- Wallets (Shop Pay, Apple Pay) may bypass full address forms. Plan post-purchase correction flows.

## API Keys
- Never call Google APIs from the extension. Server-only with quotas and caching.

## Rate Limits
- 429 from our API means local rate limit tripped. Increase window or back off client calls.

## Session Tokens
- If 401 appears, verify Authorization: Bearer token retrieval (getSessionToken) and clock skew.

## Caching
- Stale or missing cache is okay in dev; production should use Redis to avoid cost spikes.

## Extension Debugging
- Start with stub token and local fetch. Integrate the real runtime gradually.

