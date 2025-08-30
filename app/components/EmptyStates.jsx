import { Card, EmptyState, Button } from "@shopify/polaris";
import React from "react";

export function EmptyAnalytics({ onGoToSettings, onGoToDocs }) {
  return (
    <Card>
      <div style={{ padding: 0 }}>
        <EmptyState
          heading="No analytics yet"
          action={{ content: "Review validation rules", onAction: onGoToSettings }}
          secondaryAction={{ content: "Read setup guide", onAction: onGoToDocs }}
          image="https://cdn.shopify.com/shopifycloud/web/assets/v1/5843a9b1ab1a8a8c0b1f.svg"
        >
          <p>
            As orders come in, we’ll show validation trends, blocked causes, and savings. In the meantime,
            ensure your rules are set the way you want.
          </p>
        </EmptyState>
      </div>
    </Card>
  );
}

export function EmptyProblems() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <p style={{ color: "#616161", margin: 0 }}>
          No problem clusters yet. Great news — keep an eye here for ZIPs or cities that frequently need
          attention.
        </p>
      </div>
    </Card>
  );
}

