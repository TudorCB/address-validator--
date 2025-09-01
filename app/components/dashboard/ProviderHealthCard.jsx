import { Text } from "@shopify/polaris";
import Section from "./Section.jsx";
import React from "react";

export default function ProviderHealthCard({ health }) {
  const ok = health?.provider?.ok ?? 0;
  const fail = health?.provider?.fail ?? 0;
  const total = ok + fail || 1;
  const successRate = Math.round((ok / total) * 100);
  const p50 = health?.provider?.p50 ?? null;

  return (
    <Section title="Provider health">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <Text as="p" variant="bodySm" tone="subdued">Success rate</Text>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{successRate}%</div>
        </div>
        <div>
          <Text as="p" variant="bodySm" tone="subdued">p50 latency</Text>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{p50 != null ? `${p50} ms` : "—"}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, color: "#616161" }}>
        <Text as="p" variant="bodySm">Watch for drops in success or spikes in latency. The dashboard will fall back to soft warnings if providers struggle.</Text>
      </div>
    </Section>
  );
}

