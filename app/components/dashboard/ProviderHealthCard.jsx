import { Text, Box, Grid, BlockStack } from "@shopify/polaris";
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
      <Box paddingBlockStart="300">
        <Grid columns={{ sm: 2 }} gap="400">
          <Grid.Cell>
            <BlockStack gap="150">
              <Text as="p" variant="bodySm" tone="subdued">Success rate</Text>
              <Text as="p" variant="headingLg">{successRate}%</Text>
            </BlockStack>
          </Grid.Cell>
          <Grid.Cell>
            <BlockStack gap="150">
              <Text as="p" variant="bodySm" tone="subdued">p50 latency</Text>
              <Text as="p" variant="headingLg">{p50 != null ? `${p50} ms` : "—"}</Text>
            </BlockStack>
          </Grid.Cell>
        </Grid>
      </Box>
      <Box paddingBlockStart="300">
        <Text as="p" variant="bodySm" tone="subdued">
          Watch for drops in success or spikes in latency. The dashboard will fall back to soft warnings if providers struggle.
        </Text>
      </Box>
    </Section>
  );
}

