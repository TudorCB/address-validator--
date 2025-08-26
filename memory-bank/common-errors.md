# Common Shopify App Development Errors and Solutions

## Authentication Errors

### "Unauthorized" or "401" Errors
**Problem**: Authentication middleware not properly implemented
**Solution**: 
```javascript
// ❌ Wrong - Missing authentication
export const loader = async ({ request }) => {
  // Direct API call without authentication
  return json({ data: [] });
};

// ✅ Correct - Always authenticate first
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  // Now you can use admin.graphql
  return json({ data: [] });
};
```

### Session Storage Issues
**Problem**: Database migrations not run or session table missing
**Solution**:
1. Run `npm run setup` to execute Prisma migrations
2. Check `prisma/schema.prisma` for Session model
3. Verify database connection in environment variables

## Icon and Component Errors

### "Module not found" for Polaris Icons
**Problem**: Incorrect icon names or imports
**Solution**:
```javascript
// ❌ Wrong - Old naming convention
import { PlusCircle } from "@shopify/polaris";

// ✅ Correct - New naming convention (v12+)
import { PlusCircleIcon } from "@shopify/polaris";
```

### Missing Polaris Styles
**Problem**: Polaris CSS not imported in app route
**Solution**:
```javascript
// In app/routes/app.jsx
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];
```

## Vite Configuration Errors

### HMR Connection Issues
**Problem**: Manual modification of HMR settings in `vite.config.js`
**Solution**: 
- Never modify the HMR configuration in `vite.config.js`
- Let Shopify CLI manage the configuration automatically
- Restart development server with `shopify app dev`

### Port Conflicts
**Problem**: Vite server port conflicts
**Solution**:
- Don't manually change port settings in `vite.config.js`
- Use Shopify CLI's automatic port management
- Check for other running processes

## App Bridge Errors

### "AppBridge is not defined" or Context Issues
**Problem**: Missing AppProvider wrapper
**Solution**:
```javascript
// ❌ Wrong - Missing AppProvider
export default function App() {
  return (
    <NavMenu>
      {/* Navigation */}
    </NavMenu>
  );
}

// ✅ Correct - Proper AppProvider setup
export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        {/* Navigation */}
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}
```

## GraphQL API Errors

### "Field 'X' doesn't exist on type 'Y'"
**Problem**: Using incorrect field names or GraphQL syntax
**Solution**:
1. Check Shopify Admin API documentation for correct field names
2. Use GraphQL introspection to explore available fields
3. Ensure proper GraphQL syntax with `#graphql` comment

### "Insufficient permissions" or "User errors"
**Problem**: Missing scopes or insufficient permissions
**Solution**:
1. Check `shopify.app.toml` for required scopes
2. Reinstall app to update permissions
3. Handle userErrors in GraphQL responses:
```javascript
const { product, userErrors } = response.body.data.productCreate;
if (userErrors.length > 0) {
  // Handle validation errors
}
```

## Webhook Errors

### "Webhook verification failed"
**Problem**: Incorrect webhook authentication
**Solution**:
```javascript
// ✅ Correct webhook authentication
import { shopify } from "../shopify.server";

export const action = async ({ request }) => {
  // Must use shopify.authenticate.webhook, not authenticate.admin
  const { topic, shop, session, admin, payload } = await shopify.authenticate.webhook(request);
  // Handle webhook
  return new Response();
};
```

### Missing Webhook Processing
**Problem**: Webhooks not properly handled
**Solution**:
1. Implement proper webhook routes with correct naming (`webhooks.{topic}`)
2. Use Shopify's webhook authentication
3. Return `new Response()` for successful processing

## Development Environment Errors

### "SHOPIFY_API_KEY is not defined"
**Problem**: Environment variables not set by Shopify CLI
**Solution**:
- Always run `shopify app dev` instead of `npm run dev`
- Shopify CLI automatically sets required environment variables
- Don't manually set Shopify environment variables

### Tunneling Issues
**Problem**: ngrok tunnel not working or expired
**Solution**:
- Let Shopify CLI manage tunneling automatically
- Check Shopify Partner dashboard for app URL
- Restart development server if tunnel issues persist

## Deployment Errors

### "App not loading in Shopify admin"
**Problem**: Production build issues or incorrect configuration
**Solution**:
1. Use `shopify app deploy` for deployment
2. Verify `shopify.app.toml` configuration
3. Check app URL matches deployed URL
4. Ensure all required scopes are declared

### Database Migration Issues
**Problem**: Prisma migrations not run in production
**Solution**:
1. Ensure `npm run setup` runs during deployment
2. Check database connection strings
3. Verify Prisma schema matches production database

## Routing Errors

### "Route not found" or 404 Errors
**Problem**: Incorrect route naming conventions
**Solution**:
- App routes: `app/routes/app.{name}.jsx`
- Public routes: `app/routes/{name}/route.jsx`
- Webhook routes: `app/routes/webhooks.{topic}.jsx`

### Nested Route Issues
**Problem**: Incorrect outlet usage in parent routes
**Solution**:
```javascript
// Parent route must include <Outlet />
export default function App() {
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>{/* Navigation */}</NavMenu>
      <Outlet /> {/* Required for nested routes */}
    </AppProvider>
  );
}
```

## Performance Issues

### Slow Page Loads
**Problem**: Too much data fetched or inefficient queries
**Solution**:
1. Only fetch required fields in GraphQL queries
2. Implement pagination for large datasets
3. Use caching for non-critical data
4. Optimize database queries

### Memory Leaks
**Problem**: Improper component cleanup or event listeners
**Solution**:
1. Use React hooks properly (useEffect cleanup)
2. Remove event listeners on component unmount
3. Avoid circular references in data structures

## Debugging Tips

### Enable Detailed Logging
```javascript
// Add to loaders/actions for debugging
console.log('Session:', session);
console.log('Shop:', session?.shop);
console.log('API Response:', response.body);
```

### Check Shopify CLI Logs
- Monitor terminal output from `shopify app dev`
- Look for warning messages and error stack traces
- Check ngrok tunnel status in CLI output

### Browser Developer Tools
- Check Network tab for failed requests
- Monitor Console for JavaScript errors
- Inspect elements to verify component rendering
