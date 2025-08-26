# AGENT_SPEC.md — Shopify Remix App Guardrails

CONTEXT
- This project was scaffolded using the official Shopify Remix app template.
- Stack: @shopify/shopify-app-remix v3, Remix 2, App Bridge, Polaris, Prisma session storage.

ABSOLUTE RULES
1. **Imports & routing**
   - UI routes/components → import from `@remix-run/react`.
   - Server loaders/actions → import from `@remix-run/node`.
   - Embedded redirects → use `redirect` returned from `shopify.authenticate.admin`.

2. **Authentication & App Bridge**
   - All `/app/*` routes must call `shopify.authenticate.admin` in their loader.
   - `app/root.tsx` must wrap UI in `<AppProvider apiKey={apiKey} isEmbeddedApp>`.

3. **SSR & CSP**
   - Never call `window`/`document`/`localStorage` at module scope.
   - Don’t remove `shopify.addDocumentResponseHeaders` in `entry.server.tsx`.

4. **Webhooks**
   - Prefer declaring app-specific webhooks in `shopify.app.toml`.

5. **Icons & Polaris**
   - Only use documented Polaris/Admin `IconName`s. Prefer a type-safe wrapper.

6. **Build**
   - Don’t modify `vite.config.ts` unless adding a deployment preset.
   - `tsconfig.json` must remain strict.

7. **Testing**
   - Each new route must include a tested loader/action.
   - Always run `npm run verify` after generation.

DO NOTS
- Don’t scaffold new Remix/Vite apps from scratch.
- Don’t import server-only modules in client components.
- Don’t use raw `<a>` inside embedded UI.

REFERENCES
- Shopify Remix app template docs
- `@shopify/shopify-app-remix` v3 docs
- Polaris & Admin extension icon lists
