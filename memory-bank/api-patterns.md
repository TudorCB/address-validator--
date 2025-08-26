# Shopify API Integration Patterns

## GraphQL Client Usage

### Admin GraphQL Client
```javascript
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Simple query
  const response = await admin.graphql(
    `#graphql
    query getShopInfo {
      shop {
        name
        email
        myshopifyDomain
      }
    }`
  );
  
  // Query with variables
  const productsResponse = await admin.graphql(
    `#graphql
    query getProducts($first: Int!) {
      products(first: $first) {
        nodes {
          id
          title
          handle
          featuredImage {
            url
            altText
          }
        }
      }
    }`,
    {
      variables: { first: 10 }
    }
  );
  
  return json({ shop: response.body.data.shop, products: productsResponse.body.data.products });
};
```

## Common GraphQL Queries

### Product Queries
```graphql
# Get basic product information
query getProducts($first: Int!, $cursor: String) {
  products(first: $first, after: $cursor) {
    nodes {
      id
      title
      handle
      productType
      vendor
      status
      createdAt
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}

# Get product with variants
query getProductWithVariants($id: ID!) {
  product(id: $id) {
    id
    title
    variants(first: 100) {
      nodes {
        id
        title
        sku
        price
        inventoryQuantity
      }
    }
  }
}
```

### Order Queries
```graphql
# Get recent orders
query getOrders($first: Int!) {
  orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
    nodes {
      id
      name
      processedAt
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      customer {
        displayName
        email
      }
      lineItems(first: 10) {
        nodes {
          title
          quantity
          variant {
            title
          }
        }
      }
    }
  }
}
```

## Mutation Patterns

### Product Mutations
```graphql
# Create product
mutation createProduct($input: ProductInput!) {
  productCreate(input: $input) {
    product {
      id
      title
      handle
    }
    userErrors {
      field
      message
      category
    }
  }
}

# Update product
mutation updateProduct($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      title
      handle
    }
    userErrors {
      field
      message
      category
    }
  }
}
```

## REST API Integration

### When to Use REST vs GraphQL
- Use GraphQL for most Shopify Admin API interactions
- Use REST for specific endpoints not available in GraphQL
- Use REST for webhooks (though webhook processing uses different authentication)

### REST API Client Setup
```javascript
// Usually accessed through the admin client
const restResponse = await admin.rest.get({
  path: 'products',
  query: { limit: 10 }
});
```

## Webhook Patterns

### Webhook Registration
```javascript
// In app setup or configuration
const response = await admin.rest.post({
  path: 'webhooks',
  data: {
    topic: 'products/create',
    address: `${process.env.SHOPIFY_APP_URL}/webhooks/products-create`,
    format: 'json'
  }
});
```

### Webhook Processing
```javascript
import { shopify } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await shopify.authenticate.webhook(request);
  
  switch (topic) {
    case "PRODUCTS_CREATE":
      // Handle product creation
      await handleProductCreate(payload, admin);
      break;
    case "APP_UNINSTALLED":
      // Handle app uninstallation
      await handleAppUninstall(shop, session);
      break;
    default:
      console.log(`Unhandled webhook topic: ${topic}`);
  }
  
  return new Response();
};
```

## Error Handling Patterns

### GraphQL Error Handling
```javascript
try {
  const response = await admin.graphql(
    `#graphql
    query getProducts {
      products(first: 10) {
        nodes {
          id
          title
        }
      }
    }`
  );
  
  const data = response.body.data;
  if (response.body.errors) {
    console.error('GraphQL errors:', response.body.errors);
    // Handle errors appropriately
  }
  
  return json({ products: data.products });
} catch (error) {
  console.error('GraphQL request failed:', error);
  // Handle network errors
  return json({ error: 'Failed to fetch products' }, { status: 500 });
}
```

### User Error Handling
```javascript
const response = await admin.graphql(
  `#graphql
  mutation createProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
      }
      userErrors {
        field
        message
        category
      }
    }
  }`,
  {
    variables: { input: productData }
  }
);

const { product, userErrors } = response.body.data.productCreate;

if (userErrors.length > 0) {
  // Handle user errors (validation, permissions, etc.)
  return json({ errors: userErrors }, { status: 400 });
}

// Success case
return json({ product });
```

## Pagination Patterns

### Cursor-Based Pagination
```javascript
const getProductsPaginated = async (admin, first = 10, cursor = null) => {
  const query = `#graphql
    query getProducts($first: Int!, $cursor: String) {
      products(first: $first, after: $cursor) {
        nodes {
          id
          title
          handle
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;
  
  const variables = { first, cursor };
  const response = await admin.graphql(query, { variables });
  
  return response.body.data.products;
};

// Usage in loader
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  
  const { admin } = await authenticate.admin(request);
  const productsData = await getProductsPaginated(admin, 10, cursor);
  
  return json({ productsData });
};
```

## Bulk Operations

### Batch Processing
```javascript
// For processing multiple items
const processProductsInBatches = async (admin, productIds, batchSize = 50) => {
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);
    
    // Process batch
    const promises = batch.map(id => 
      admin.graphql(
        `#graphql
        query getProduct($id: ID!) {
          product(id: $id) {
            id
            title
          }
        }`,
        { variables: { id } }
      )
    );
    
    const results = await Promise.all(promises);
    // Handle results
  }
};
```

## Performance Optimization

### Caching Strategies
```javascript
// Use session-based caching for non-critical data
const getCachedShopInfo = async (admin, session) => {
  const cacheKey = `shop_info_${session.shop}`;
  const cached = await getFromCache(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const response = await admin.graphql(
    `#graphql
    query getShopInfo {
      shop {
        name
        email
        myshopifyDomain
      }
    }`
  );
  
  const shopInfo = response.body.data.shop;
  await setInCache(cacheKey, shopInfo, 3600); // Cache for 1 hour
  
  return shopInfo;
};
```

### Efficient Data Fetching
```javascript
// Only fetch required fields
const getMinimalProductData = async (admin) => {
  const response = await admin.graphql(
    `#graphql
    query getProducts {
      products(first: 100) {
        nodes {
          id
          title
          # Only include fields you actually need
        }
      }
    }`
  );
  
  return response.body.data.products;
};
