import { Card, Text } from "@shopify/polaris";
import React from "react";

export default function MetricCard({ title, value, help }) {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text as="h3" variant="headingMd">{title}</Text>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, marginTop: 6 }}>{value}</div>
        {help ? <div style={{ color: "#616161", marginTop: 4 }}>{help}</div> : null}
      </div>
    </Card>
  );
}

