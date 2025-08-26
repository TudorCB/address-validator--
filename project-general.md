## Project Overview
This project is a Shopify App Template built using the Remix framework . Its main goal is to provide a production-ready foundation for building Shopify apps, eliminating the complexity of setting up an app from scratch . It's designed for developers who want to create applications that integrate with the Shopify platform .

## Architecture & Structure
The template follows a layered architecture with clear separation between authentication, business logic, and data persistence .

### High-level Architecture Overview
The application's architecture involves entry points like `entry.server.jsx` and `root.jsx`, which lead to route handlers such as `routes/app.jsx`, `routes/app._index.jsx`, `routes/auth.*`, and `routes/webhooks.*` . Core services like `shopify.server.js` and `db.server.js` handle Shopify API interactions and database operations, respectively . External dependencies include the Shopify Admin GraphQL API and a SQLite database for session storage . Configuration files like `graphqlrc.js`, `prisma/schema.prisma`, and `shopify.app.toml` define schema, database models, and app metadata .

### Key Directories and Their Purposes
*   `app/shopify.server.js`: Centralizes Shopify API and authentication setup .
*   `app/db.server.js`: Configures the Prisma client for database interactions .
*   `app/routes/app.jsx`: Defines the authenticated app layout .
*   `app/routes/app._index.jsx`: Contains examples of GraphQL queries .
*   `app/routes/auth.*`: Handles OAuth flow routes .
*   `app/routes/webhooks.*`: Manages Shopify webhook handlers .
*   `prisma/schema.prisma`: Defines session and data models for the database .
*   `shopify.app.toml`: Contains Shopify app configuration metadata .
*   `.graphqlrc.js`: Sets up GraphQL schema introspection .

## Development Setup

### Prerequisites and Dependencies
To set up the project, you need Node.js (v18.20, v20.10, or >=21.0.0), a Shopify Partner Account, and a test store (development or Shopify Plus sandbox) . Key dependencies include `@prisma/client`, `@remix-run/*`, `@shopify/app-bridge-react`, `@shopify/polaris`, `@shopify/shopify-app-remix`, and `@shopify/shopify-app-session-storage-prisma` .

### Installation Steps
After ensuring prerequisites are met, run `yarn install`, `npm install`, or `pnpm install` to install dependencies .

### How to Run the Project Locally
To run the project locally, use `yarn dev`, `npm run dev`, or `pnpm run dev` . This command is powered by the Shopify CLI, which handles logging into your partners account, connecting to an app, providing environment variables, updating remote config, and creating a tunnel .

## Code Organization
The template organizes code into logical modules with clear responsibilities . For example, `app/shopify.server.js` handles central Shopify API and authentication setup , while `app/routes/app._index.jsx` contains GraphQL query examples .

## Key Features & Implementation

### Main Features and How They're Implemented
*   **Authentication**: Implemented via OAuth flow with session storage, handled by `@shopify/shopify-app-remix` and `PrismaSessionStorage` . The `shopify.authenticate.admin(request)` function is used to authenticate requests .
*   **Database**: Uses Prisma ORM with SQLite by default for session and app data persistence . The database schema is defined in `prisma/schema.prisma` .
*   **API Integration**: Utilizes a GraphQL Admin API client for Shopify store data operations . An example of querying products is shown using `admin.graphql()` .
*   **Webhooks**: Handled by individual route handlers, such as `app/routes/webhooks.app.uninstalled.tsx` and `app/routes/webhooks.app.scopes_update.tsx` . App-specific webhooks are recommended to be declared in `shopify.app.toml` .
*   **UI Framework**: Employs the Polaris design system for a consistent Shopify admin experience .

## Testing Strategy
The provided context does not contain explicit information about testing frameworks used, test file organization, how to run tests, or testing best practices within this codebase.

## Build & Deployment

### Build Process and Scripts
Remix handles building the app . The build command is `yarn build`, `npm run build`, or `pnpm run build` .

### Deployment Configuration
Deployment documentation is available on `shopify.dev/docs/apps/deployment/web` . For production, the `NODE_ENV` environment variable should be set to `production` . Hosting on Vercel is recommended with the Vercel Preset, requiring imports from `@vercel/remix` instead of `@remix-run/node` .

## Git Workflow
The provided context does not contain explicit information about branching strategy, commit message conventions, code review process, or release process.

## Common Patterns & Best Practices
*   **Authentication and API Interaction**: The `shopify` constant exported from `app/shopify.server.js` is used for authentication and querying data .
*   **Navigation in Embedded Apps**: For embedded Shopify apps, it's crucial to use `Link` from `@remix-run/react` or `@shopify/polaris`, `redirect` from `authenticate.admin`, and `useSubmit` or `<Form/>` from `@remix-run/react` to maintain user sessions .
*   **Webhook Management**: It is recommended to declare app-specific webhooks in the `shopify.app.toml` file for automatic updates when running `deploy` .

## Dependencies & Tools

### Key Dependencies and Their Purposes
*   `@prisma/client`: Database ORM .
*   `@remix-run/react`: Full-stack framework .
*   `@shopify/app-bridge-react`: Integrates the app within Shopify's Admin .
*   `@shopify/polaris`: UI component library and design system .
*   `@shopify/shopify-app-remix`: Provides authentication and methods for interacting with Shopify APIs .
*   `@shopify/shopify-app-session-storage-prisma`: Handles session management with Prisma .

### Development Tools and Utilities
*   **Shopify CLI**: Powers local development, handles authentication, environment variables, and tunneling .
*   **Vite**: Build tool .
*   **TypeScript**: Provides type safety .
*   **Prisma**: Used for database migrations and schema changes .

### Package Management Approach
The project supports `yarn`, `npm`, and `pnpm` for package management .

## Security Considerations

### Authentication and Authorization
The template implements a complete OAuth flow with secure session management . Authentication is handled by `shopify.authenticate.admin()` .

### Security Best Practices Followed
*   **HMAC webhook validation**: Ensures the integrity of incoming webhooks .
*   **Secure OAuth implementation**: Provides a secure authentication process .

## Troubleshooting & FAQ

### Common Issues and Solutions
*   **Database tables don't exist**: Run the `setup` script (`prisma generate && prisma migrate deploy`) in `package.json` .
*   **Navigating/redirecting breaks an embedded app**: Use `Link` from `@remix-run/react` or `@shopify/polaris`, `redirect` from `authenticate.admin`, and `useSubmit` or `<Form/>` from `@remix-run/react` .
*   **OAuth loop when changing app scopes**: Run `yarn deploy`, `npm run deploy`, or `pnpm run deploy` to update scopes with Shopify .
*   **Shop-specific webhook subscriptions aren't updated**: Use app-specific webhooks defined in `shopify.app.toml` or uninstall/reinstall the app in your development store to force the OAuth process .
*   **Admin created webhook failing HMAC validation**: Use app-specific webhooks defined in `shopify.app.toml` or create webhook subscriptions using the `shopifyApp` object .
*   **Incorrect GraphQL Hints**: Update the `.graphqlrc.ts` config if using other Shopify APIs or third-party GraphQL APIs .
*   **`First parameter has member 'readable' that is not a ReadableStream`**: See the section on "Hosting on Vercel" .
*   **Admin object undefined on webhook events triggered by the CLI**: The `admin` object is only available when the webhook is triggered by a shop that has installed the app <cite repo="TudorCB/address-validator--" path="README.md" start="2

# Development Partnership and How We Should Partner

We build production code together. I handle implementation details while you guide architecture and catch complexity early.

## Core Workflow: Research → Plan → Implement → Validate

**Start every feature with:** "Let me research the codebase and create a plan before implementing."

1. **Research** - Understand existing patterns and architecture
2. **Plan** - Propose approach and verify with you
3. **Implement** - Build with tests and error handling
4. **Validate** - ALWAYS run formatters, linters, and tests after implementation

## Code Organization

**Keep functions small and focused:**
- If you need comments to explain sections, split into functions
- Group related functionality into clear packages
- Prefer many small files over few large ones

## Architecture Principles

**This is always a feature branch:**
- Delete old code completely - no deprecation needed
- No "removed code" or "added this line" comments - just do it

**Prefer explicit over implicit:**
- Clear function names over clever abstractions
- Obvious data flow over hidden magic
- Direct dependencies over service locators

## Maximize Efficiency

**Parallel operations:** Run multiple searches, reads, and greps in single messages
**Multiple agents:** Split complex tasks - one for tests, one for implementation
**Batch similar work:** Group related file edits together

## Problem Solving

**When stuck:** Stop. The simple solution is usually correct.

**When uncertain:** "Let me ultrathink about this architecture."

**When choosing:** "I see approach A (simple) vs B (flexible). Which do you prefer?"

Your redirects prevent over-engineering. When uncertain about implementation, stop and ask for guidance.

## Testing Strategy

**Match testing approach to code complexity:**
- Complex business logic: Write tests first (TDD)
- Simple CRUD operations: Write code first, then tests
- Hot paths: Add benchmarks after implementation

**Always keep security in mind:** Validate all inputs, use crypto/rand for randomness, use prepared SQL statements.

**Performance rule:** Measure before optimizing. No guessing.

## Progress Tracking

- **Use Todo lists** for task management
- **Clear naming** in all code

Focus on maintainable solutions over clever abstractions.

---
Generated using [Sidekick Dev]({REPO_URL}), your coding agent sidekick.
