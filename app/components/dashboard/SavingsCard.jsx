import { Text } from "@shopify/polaris";
import Section from "./Section.jsx";
import React from "react";

export default function SavingsCard({ estimatedSavings, failedDeliveryCostUsd }) {
  return (
    <Section title="Estimated savings">
      <div style={{ fontWeight: 600, fontSize: 24 }}>
        ${Number(estimatedSavings || 0).toLocaleString()}
      </div>
      <div style={{ marginTop: 8, color: "#616161" }}>
        <Text as="p" variant="bodySm">
          Based on your configured failed-delivery cost (${failedDeliveryCostUsd ?? 12}/order).
          Adjust this in <a href="/settings">Settings</a> to refine.
        </Text>
      </div>
    </Section>
  );
}

