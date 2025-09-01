import { Card, Text, Button } from "@shopify/polaris";
import React from "react";

function InsightCard({ insight, onQuickToggle }) {
  const quick = insight.quickToggle;
  const tone =
    insight.severity === "high" ? "#D82C0D" :
    insight.severity === "medium" ? "#8A6116" :
    "#006FBB";

  return (
    <Card>
      <div style={{ padding: 16 }}>
        <Text as="h3" variant="headingMd">{insight.title}</Text>
        <div style={{ marginTop: 6, color: tone, fontWeight: 600, fontSize: 12, letterSpacing: .2, textTransform: "uppercase" }}>
          {insight.severity} priority
        </div>
        <div style={{ marginTop: 8, color: "#434343", lineHeight: 1.55 }}>{insight.body}</div>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={insight.cta.href}><Button primary>{insight.cta.label}</Button></a>
          {quick ? <Button onClick={() => onQuickToggle(quick.patch)}>{quick.label}</Button> : null}
        </div>
      </div>
    </Card>
  );
}

export default function InsightsGrid({ insights, onQuickToggle }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
      {(insights || []).map(i => (
        <InsightCard key={i.id} insight={i} onQuickToggle={onQuickToggle} />
      ))}
      {(!insights || insights.length === 0) ? <div style={{ color:"#616161" }}>No insights yet—come back after more traffic.</div> : null}
    </div>
  );
}

