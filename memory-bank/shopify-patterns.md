# Shopify Development Patterns Documentation

## Authentication Patterns

### Admin Route Authentication
```javascript
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  // Use admin.graphql for API calls
  // Use session for session data
  return json({ data });
};
```

### Webhook Authentication
```javascript
import { shopify } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await shopify.authenticate.webhook(request);
  // Handle webhook payload
  return new Response();
};
```

## Route Structure Patterns

### App Routes
- Located in `app/routes/` directory
- Prefixed with `app.` (e.g., `app.products.jsx`)
- Must include authentication middleware
- Use embedded app patterns

### Public Routes
- Located in `app/routes/` root
- Handle authentication flows
- Include error handling with Shopify boundaries

### Webhook Routes
- Located in `app/routes/`
- Named with `webhooks.` prefix
- Handle specific Shopify webhook topics

## Component Patterns

### Embedded App Structure
```javascript
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        {/* Navigation links */}
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}
```

## Data Patterns

### GraphQL Queries
```javascript
const response = await admin.graphql(
  `#graphql
  query getProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        handle
      }
    }
  }`,
  {
    variables: { first: 10 }
  }
);
```

### Session Management
- Uses Prisma session storage
- Automatic session handling through Shopify auth
- Session data available in authenticated routes

## Error Handling Patterns

### Route Error Boundaries
```javascript
import { boundary } from "@shopify/shopify-app-remix/server";
import { useRouteError } from "@remix-run/react";

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

## API Integration Patterns

### Product Data Access
- Use Shopify Admin GraphQL API
- Leverage admin.graphql client from authentication
- Handle pagination for large datasets
- Implement proper error handling

### Webhook Processing
- Validate webhook signatures
- Process asynchronously when possible
- Handle retries and failures gracefully
- Log important events for debugging

## UI/UX Patterns

### Polaris Component Usage
- Always use Shopify Polaris components
- Follow Shopify design guidelines
- Use proper layout components (Page, Layout, Card)
- Implement responsive design patterns

### Navigation Patterns
- Use NavMenu for main navigation
- Links must use Remix Link component
- Maintain embedded app context
- Provide clear user pathways

## Development Workflow Patterns

### Local Development
1. Run `shopify app dev` to start development server
2. Use ngrok tunneling for Shopify integration
3. Test in Partner dashboard
4. Monitor Shopify CLI logs

### Testing Patterns
- Test authentication flows
- Verify embedded app functionality
- Test webhook processing
- Validate API integrations

### Deployment Patterns
- Use `shopify app deploy` for deployment
- Validate configuration files
- Test in staging environment
- Monitor deployment logs
