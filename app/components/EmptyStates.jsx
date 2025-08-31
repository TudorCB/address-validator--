import { Card, EmptyState, Button } from "@shopify/polaris";
import React from "react";
import { t } from "../lib/i18n.js";

export function EmptyAnalytics({ onGoToSettings, onGoToDocs }) {
  return (
    <Card>
      <div style={{ padding: 0 }}>
        <EmptyState
          heading={t("analytics.empty.heading")}
          action={{ content: t("analytics.empty.review_rules"), onAction: onGoToSettings }}
          secondaryAction={{ content: t("analytics.empty.read_setup"), onAction: onGoToDocs }}
          image="https://cdn.shopify.com/shopifycloud/web/assets/v1/5843a9b1ab1a8a8c0b1f.svg"
        >
          <p>
            {t("analytics.empty.body")}
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
          {t("analytics.empty.no_problems")}
        </p>
      </div>
    </Card>
  );
}
