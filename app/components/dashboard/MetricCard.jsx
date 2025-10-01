import { Card, Text, InlineStack, Box } from "@shopify/polaris";
import React from "react";

export default function MetricCard({ title, value, help }) {
  return (
    <Card>
      <Box padding="400">
        <InlineStack gap="200" blockAlign="center">
          <Text as="h3" variant="headingMd">{title}</Text>
        </InlineStack>
        <Box paddingBlockStart="200">
          <Text as="p" variant="heading2xl">{value}</Text>
        </Box>
        {help ? (
          <Box paddingBlockStart="100">
            <Text as="p" tone="subdued">{help}</Text>
          </Box>
        ) : null}
      </Box>
    </Card>
  );
}

