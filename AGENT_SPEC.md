# AGENT_SPEC.md â€” Shopify Remix App Guardrails

CONTEXT
- Scaffolded using Shopify Remix app template.
- Stack: @shopify/shopify-app-remix v3, Remix 2, App Bridge, Polaris, Prisma session storage.

RULES
- Always use Vite + Remix SSR.
- Only import server modules in loader/action.
- Use <ClientOnly> for browser-only components.
- Use <SafeIcon> for Polaris icons.
- Keep .js/.jsx files (no TS unless project uses TS).

VERIFY
- Run 'npm run verify' after changes.
