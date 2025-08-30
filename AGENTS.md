# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Remix app code. Key areas: `routes/` (file-based routes), `components/`, `root.jsx`, `entry.server.jsx`, `shopify.server.js`, `db.server.js`.
- `extensions/`: App extensions (e.g., `checkout-ui/`, `customer-address/`, `thank-you/`).
- `prisma/`: Database schema (`schema.prisma`) and dev SQLite (`dev.sqlite`).
- `public/`: Static assets served by Remix.
- `build/`: Generated server/client output (do not edit).
- `.shopify/`, `shopify.app.toml`: Shopify app configuration and context.

## Build, Test, and Development Commands
- `npm run dev`: Start Shopify Remix dev with live reload and ngrok/tunnel.
- `npm run build`: Build Remix app for production (`build/`).
- `npm run start`: Serve production build (`remix-serve`).
- `npm run setup`: Prisma generate + migrate deploy (ensure DB is ready).
- `npm run lint`: Lint with ESLint + Prettier config.
- `npm run verify`: Lint and typecheck (`tsc --noEmit`).
- `npm run prisma`: Access Prisma CLI; e.g., `npm run prisma migrate dev`.
- Optional: `npm run graphql-codegen` if GraphQL types/documents change.

## Coding Style & Naming Conventions
- Language: JS/JSX with TypeScript types enabled (no emit). Indent 2 spaces.
- Linting: `eslint.config.js` extends Remix + Prettier; fix issues before PR.
- Files: Remix routes in `app/routes/*`. Use `.server.js` for server-only modules.
- Naming: kebab-case for route filenames; PascalCase for React components.

## Testing Guidelines
- No formal test runner is configured yet. Prefer adding Vitest/Jest next.
- For now, rely on `npm run verify` and manual testing via `npm run dev`.
- If adding tests, place beside source as `*.test.(js|jsx|ts|tsx)` and add a `test` script.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (`feat:`, `fix:`, `chore:`). Example: `feat(routes): add address validation endpoint`.
- PRs: Include summary, linked issues, screenshots for UI (Polaris) changes, and test steps.
- Keep PRs small and focused; note any schema changes (Prisma migrations).

## Security & Configuration Tips
- Secrets: Copy `.env.example` to `.env`; never commit secrets. Shopify config lives in `shopify.app.toml` and `.shopify/`.
- DB: Dev uses SQLite; consider Postgres/MySQL for production. Run `npm run setup` after schema changes.
- Node: Use a version matching `engines` in `package.json`.
- Docker: See `Dockerfile` and `deploy.sh` for containerized runs/deploys.

