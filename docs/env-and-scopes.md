# Address Validator++  Environment & OAuth Scopes

## Environment Variables

These variables are primarily for the server-only Remix application.

### Core Configuration
- `SHOPIFY_API_KEY`: Your Shopify app's client ID.
- `SHOPIFY_API_SECRET`: Your Shopify app's client secret.
- `SHOPIFY_APP_URL`: The public URL of your application.
- `SCOPES`: Comma-separated list of Shopify OAuth scopes. This can be used as an alternative to the `access_scopes` in `shopify.app.toml`.
- `SESSION_SECRET`: A long, random string used for signing session cookies.

### External Services
- `GOOGLE_MAPS_API_KEY`: API key for Google Maps services, used server-side.
- `REDIS_URL`: Connection URL for a Redis instance for production caching (e.g., `redis://:password@host:port`).

### Application Behavior
- `NODE_ENV`: Set to `production` or `development`. Affects certain behaviors like database logging.
- `CACHE_TTL_SECONDS`: Time-to-live for cached items in seconds. Defaults to `86400` (24 hours).
- `RATE_LIMIT_PER_MIN`: The number of requests allowed per minute. Defaults to `300`.
- `SHOP_CUSTOM_DOMAIN`: Optional variable for handling custom shop domains.
- `SESSION_TOKEN_ALLOW_DEV_STUB`: In dev only, allow the stub token `dev.stub.jwt` for local testing. Defaults to `true` when `NODE_ENV!="production"`. Set to `false` to enforce strict JWT verification.

### Development & Build
- `PORT` or `SHOPIFY_APP_PORT`: Port for the main Remix app server. Defaults to `3000`.
- `FRONTEND_PORT`: Port for the Vite development server. Defaults to `8002`.
- `HOST`: Used during development to set `SHOPIFY_APP_URL`.

### Optional (Future Integrations)
- `UPS_API_KEY`
- `DPV_API_KEY`
- `GOOGLE_MAPS_URL_SIGNING_SECRET`: For signing Static Maps URLs.

## Shopify Admin OAuth Scopes

Scopes can be defined in `shopify.app.toml` or via the `SCOPES` environment variable.

- `read_checkouts`: To analyze and validate addresses during checkout.
- `read_customers`, `write_customers`: For customer address hygiene features.
- `read_orders`: For optional order reconciliation.

> **Note:** Always confirm scope names against the target Shopify Admin API version you are using.

## Security Notes
- Never embed sensitive API keys (Google, UPS, etc.) in frontend extension bundles.
- Extensions should use `getSessionToken` to get a short-lived token, which must be verified by the server-side application.
- Session token verification uses HMAC (HS256) with `SHOPIFY_API_SECRET`. Ensure `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are set correctly.

## Quick Install URL
Use this link to install the app to your development store (per-user):

https://quickstart-23c8bad8.myshopify.com/admin/oauth/authorize?client_id=5157c62e833750cbbe886fa1f9995997&scope=read_checkouts,read_customers,write_customers,read_orders&redirect_uri=https%3A%2F%2Fsn-architecture-specifics-lid.trycloudflare.com%2Fauth%2Fcallback&state=STATE&grant_options%5B%5D=per-user

- Replace `STATE` with a cryptographically random nonce that your app validates on callback.
- Scopes and redirect URI reflect the current configuration in `shopify.app.toml` and `.env`.

Offline access token variant (optional):

https://quickstart-23c8bad8.myshopify.com/admin/oauth/authorize?client_id=5157c62e833750cbbe886fa1f9995997&scope=read_checkouts,read_customers,write_customers,read_orders&redirect_uri=https%3A%2F%2Fsn-architecture-specifics-lid.trycloudflare.com%2Fauth%2Fcallback&state=STATE
