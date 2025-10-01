import { Card, Text, Box } from "@shopify/polaris";
import React from "react";

export default function Section({ title, children }) {
  return (
    <Card>
      <Box padding="400">
        {title ? <Text as="h3" variant="headingMd">{title}</Text> : null}
        {title && <Box paddingBlockStart="300">{children}</Box>}
        {!title && <>{children}</>}
      </Box>
    </Card>
  );
}

