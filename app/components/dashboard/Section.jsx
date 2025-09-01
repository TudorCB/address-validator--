import { Card, Text } from "@shopify/polaris";
import React from "react";

export default function Section({ title, children }) {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        {title ? <Text as="h3" variant="headingMd">{title}</Text> : null}
        <div style={{ marginTop: title ? 12 : 0 }}>{children}</div>
      </div>
    </Card>
  );
}

