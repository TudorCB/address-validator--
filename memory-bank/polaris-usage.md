# Shopify Polaris Component Usage Guide

## Current Version Information
Based on package.json: Polaris v12.0.0

## Icon Naming Conventions (Polaris v12+)

### Common Icons and Their Correct Names
- Add/Plus: `PlusCircleIcon`
- Delete/Remove: `DeleteIcon`
- Edit: `EditIcon`
- Save: `SaveIcon`
- Cancel: `CancelIcon`
- View: `ViewIcon`
- Download: `DownloadIcon`
- Upload: `UploadIcon`
- Search: `SearchIcon`
- Filter: `FilterIcon`
- Sort: `SortIcon`
- Settings: `SettingsIcon`
- Help: `HelpIcon`
- Info: `InfoIcon`
- Warning: `WarningIcon`
- Error: `CriticalIcon`
- Success: `CircleTickIcon`
- Close: `CancelSmallIcon`

### Icon Import Pattern
```javascript
import { PlusCircleIcon, DeleteIcon, EditIcon } from "@shopify/polaris";
```

## Layout Components

### Page Component
```javascript
import { Page, Layout, Card } from "@shopify/polaris";

<Page 
  title="Products"
  primaryAction={{
    content: "Add product",
    icon: PlusCircleIcon,
    onAction: handleAddProduct
  }}
>
  <Layout>
    <Layout.Section>
      <Card>
        {/* Content */}
      </Card>
    </Layout.Section>
  </Layout>
</Page>
```

### Layout Structure
- Use `Page` as the main wrapper
- Use `Layout` for organizing sections
- Use `Layout.Section` for content areas
- Use `Card` for individual content blocks

## Form Components

### Basic Form Structure
```javascript
import { 
  Form, 
  FormLayout, 
  TextField, 
  Button,
  Card,
  Page
} from "@shopify/polaris";

<Form onSubmit={handleSubmit}>
  <FormLayout>
    <TextField
      label="Product title"
      value={title}
      onChange={setTitle}
      required
    />
    <Button submit primary>
      Save product
    </Button>
  </FormLayout>
</Form>
```

## Data Display Components

### Resource List
```javascript
import { ResourceList, TextStyle } from "@shopify/polaris";

<ResourceList
  resourceName={{ singular: 'product', plural: 'products' }}
  items={products}
  renderItem={(item) => {
    const { id, title } = item;
    return (
      <ResourceList.Item
        id={id}
        url={`/app/products/${id}`}
        accessibilityLabel={`View details for ${title}`}
      >
        <TextStyle variation="strong">{title}</TextStyle>
      </ResourceList.Item>
    );
  }}
/>
```

## Navigation Components

### Navigation Menu
```javascript
import { NavMenu } from "@shopify/app-bridge-react";
import { Link } from "@remix-run/react";

<NavMenu>
  <Link to="/app" rel="home">
    Home
  </Link>
  <Link to="/app/products">
    Products
  </Link>
  <Link to="/app/settings">
    Settings
  </Link>
</NavMenu>
```

## Modal and Overlay Components

### Modal Dialog
```javascript
import { Modal, TextContainer, Text } from "@shopify/polaris";

<Modal
  open={active}
  onClose={setActive}
  title="Delete product"
  primaryAction={{
    content: 'Delete',
    onAction: handleDelete,
    destructive: true
  }}
  secondaryActions={[
    {
      content: 'Cancel',
      onAction: setActive,
    },
  ]}
>
  <Modal.Section>
    <TextContainer>
      <Text>Are you sure you want to delete this product?</Text>
    </TextContainer>
  </Modal.Section>
</Modal>
```

## Common Component Patterns

### Button Variations
```javascript
import { Button } from "@shopify/polaris";

// Primary action
<Button primary>Save</Button>

// Secondary action
<Button>Cancel</Button>

// Destructive action
<Button destructive>Delete</Button>

// With icon
<Button icon={PlusCircleIcon}>Add item</Button>

// Plain button
<Button plain>Remove</Button>
```

### Status Indicators
```javascript
import { Badge, Spinner } from "@shopify/polaris";

// Status badges
<Badge status="success">Active</Badge>
<Badge status="warning">Pending</Badge>
<Badge status="critical">Error</Badge>

// Loading spinner
{loading && <Spinner size="small" />}
```

## Responsive Design Patterns

### Mobile-Friendly Layouts
```javascript
import { Layout, Card } from "@shopify/polaris";

<Layout>
  <Layout.Section secondary>
    <Card title="Summary">
      {/* Summary content */}
    </Card>
  </Layout.Section>
  <Layout.Section>
    <Card title="Details">
      {/* Details content */}
    </Card>
  </Layout.Section>
</Layout>
```

## Best Practices

### Component Usage Guidelines
1. Always import components from `@shopify/polaris`
2. Use proper layout hierarchy (Page > Layout > Card)
3. Follow Shopify design guidelines
4. Use appropriate status indicators
5. Implement proper accessibility attributes
6. Test responsive behavior
7. Use consistent spacing and typography

### Performance Considerations
- Import only needed components
- Use proper loading states
- Implement virtualized lists for large datasets
- Optimize image usage
- Minimize re-renders

### Accessibility
- Use proper ARIA attributes
- Implement keyboard navigation
- Provide sufficient color contrast
- Use semantic HTML structure
- Include proper labels and descriptions
