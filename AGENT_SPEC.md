# AI Agent Specification for Shopify Development

## Overview
This document defines the requirements and capabilities for AI coding agents working on Shopify app development projects. The agent must understand Shopify-specific patterns, conventions, and constraints to provide accurate assistance.

## Required Knowledge Areas

### Shopify Fundamentals
- Shopify app architecture and embedded app SDK
- Shopify authentication flows (OAuth, session management)
- Shopify Admin API and GraphQL patterns
- Polaris design system and component library
- App Bridge integration and navigation
- Webhook handling and processing

### Technical Stack
- Remix framework with Vite
- React with hooks and context
- TypeScript/JavaScript (ES6+)
- Prisma ORM for database operations
- Shopify CLI tooling and deployment

### Development Environment
- Shopify Partner dashboard integration
- ngrok tunneling for local development
- Environment variable management
- Package management with npm/yarn

## Required Context Files
Agents must read and understand these files before providing Shopify development assistance:

1. **`.clinerules`** - Core Shopify development rules and patterns
2. **`shopify-context.json`** - Machine-readable reference data
3. **`memory-bank/projectbrief.md`** - Project overview and goals
4. **`memory-bank/shopify-patterns.md`** - Detailed development patterns
5. **`memory-bank/polaris-usage.md`** - Component usage guidelines
6. **`memory-bank/api-patterns.md`** - API integration patterns
7. **`memory-bank/common-errors.md`** - Error solutions and debugging
8. **`memory-bank/progress.md`** - Current project status

## Critical Rules Enforcement

### Authentication Patterns
- **MUST** always use `authenticate.admin(request)` for admin routes
- **MUST** use `shopify.authenticate.webhook(request)` for webhooks
- **MUST NOT** bypass Shopify's authentication middleware
- **MUST** handle authentication errors gracefully

### Component Usage
- **MUST** use Shopify Polaris components exclusively
- **MUST** follow correct icon naming conventions (v12+: `PlusCircleIcon`)
- **MUST** import Polaris CSS in app routes
- **MUST** wrap embedded apps in AppProvider

### Route Structure
- **MUST** follow Shopify route naming conventions:
  - App routes: `app/routes/app.*.jsx`
  - Public routes: `app/routes/*/route.jsx`
  - Webhook routes: `app/routes/webhooks.*.jsx`
  - Auth routes: `app/routes/auth.$.jsx`

### Development Commands
- **MUST** use `shopify app dev` for development
- **MUST** use `shopify app deploy` for deployment
- **MUST NOT** modify core Shopify CLI managed files
- **MUST NOT** change Vite HMR configuration

## Common Mistake Prevention

### Polaris Icons
```javascript
// ❌ WRONG - Old naming
import { PlusCircle } from "@shopify/polaris";

// ✅ CORRECT - New naming (v12+)
import { PlusCircleIcon } from "@shopify/polaris";
```

### Authentication
```javascript
// ❌ WRONG - Missing authentication
export const loader = async ({ request }) => {
  return json({ data: [] });
};

// ✅ CORRECT - Proper authentication
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return json({ data: [] });
};
```

### App Bridge
```javascript
// ❌ WRONG - Missing AppProvider
export default function App() {
  return <NavMenu>{/* ... */}</NavMenu>;
}

// ✅ CORRECT - Proper AppProvider
export default function App() {
  const { apiKey } = useLoaderData();
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>{/* ... */}</NavMenu>
      <Outlet />
    </AppProvider>
  );
}
```

## Required Response Format

When providing Shopify development assistance, agents must:

1. **Reference Context Files**: Explicitly mention which context files inform the response
2. **Follow Patterns**: Use code patterns from the documentation
3. **Prevent Errors**: Warn about common pitfalls from `common-errors.md`
4. **Provide Explanations**: Explain why Shopify-specific approaches are necessary
5. **Include Validation**: Suggest how to test or validate the solution

## Capability Requirements

### Code Generation
- Generate Shopify-compliant Remix routes
- Create proper loader and action functions
- Implement GraphQL queries with correct syntax
- Build Polaris UI components with proper structure

### Debugging Assistance
- Identify Shopify-specific error patterns
- Suggest solutions from documented common errors
- Provide debugging strategies for authentication issues
- Explain webhook processing troubleshooting

### Architecture Guidance
- Recommend Shopify-appropriate architectural patterns
- Suggest proper component organization
- Guide API integration best practices
- Advise on performance optimization

## Integration Points

### File System Awareness
- Understand Shopify app directory structure
- Recognize route naming conventions
- Know location of configuration files
- Understand Prisma schema location

### Tool Chain Integration
- Shopify CLI command knowledge
- Vite development server understanding
- ngrok tunneling awareness
- Deployment process understanding

## Quality Assurance

### Code Review Checklist
Before providing code solutions, agents must verify:

- [ ] Authentication properly implemented
- [ ] Polaris components used correctly
- [ ] Route structure follows conventions
- [ ] GraphQL queries use proper syntax
- [ ] Webhooks use correct authentication
- [ ] Error boundaries implemented
- [ ] No modification of managed files
- [ ] Follows documented patterns

### Response Validation
Agents should self-validate responses against:

- ✅ Shopify patterns documentation
- ✅ Common errors prevention guide
- ✅ Polaris component usage guide
- ✅ API integration patterns
- ✅ Current project context

## Performance Considerations

### Response Optimization
- Provide concise, focused solutions
- Reference documentation rather than duplicating content
- Prioritize Shopify-specific knowledge over general web dev
- Include performance implications when relevant

### Context Management
- Load context files efficiently
- Cache relevant information appropriately
- Update context understanding based on project progress
- Maintain awareness of version-specific requirements

## Error Handling Protocol

When encountering Shopify-specific issues, agents must:

1. **Identify the Pattern**: Match the issue to documented patterns
2. **Reference Solutions**: Point to specific solutions in context files
3. **Provide Context**: Explain why the issue occurs in Shopify apps
4. **Suggest Prevention**: Recommend how to avoid similar issues
5. **Document Learning**: Note new patterns for future reference
