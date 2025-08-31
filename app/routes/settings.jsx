import React from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { Page, Layout, Card, Text, TextField, Checkbox, Button, InlineStack, BlockStack, Box, ChoiceList, Banner } from "@shopify/polaris";
import AppFrame from "../components/AppFrame.jsx";
import { getSettings, updateSettings } from "../lib/settings.js";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const saved = url.searchParams.get("saved") === "1";
  let shop = "__global__";
  try {
    const { session } = await authenticate.admin(request);
    shop = session?.shop || shop;
  } catch {}
  const settings = await getSettings(shop);
  return json({ settings, saved });
};

export const action = async ({ request }) => {
  let shop = "__global__";
  try {
    const { session } = await authenticate.admin(request);
    shop = session?.shop || shop;
  } catch {}
  const form = await request.formData();
  const radiusStr = form.get("pickupRadiusKm");
  const blockPoBoxesStr = form.get("blockPoBoxes");
  const autoApplyCorrectionsStr = form.get("autoApplyCorrections");
  const softModeStr = form.get("softMode");

  const radius = Number(radiusStr);
  const blockPoBoxes = blockPoBoxesStr === "on" || blockPoBoxesStr === "true";
  const autoApplyCorrections = autoApplyCorrectionsStr === "on" || autoApplyCorrectionsStr === "true";
  const softMode = softModeStr === "on" || softModeStr === "true";

  if (!Number.isFinite(radius) || radius < 0 || radius > 500) {
    return json({ error: "Pickup Search Radius must be a number between 0 and 500." }, { status: 400 });
  }

  await updateSettings({
    pickupRadiusKm: radius,
    blockPoBoxes,
    autoApplyCorrections,
    softMode,
  }, shop);

  return redirect("/settings?saved=1");
};

export default function SettingsPage() {
  const { settings, saved } = useLoaderData();
  const result = useActionData();

  const [blockPoBoxes, setBlockPoBoxes] = React.useState(!!settings.blockPoBoxes);
  const [autoApplyCorrections, setAutoApplyCorrections] = React.useState(!!settings.autoApplyCorrections);
  const [softMode, setSoftMode] = React.useState(!!settings.softMode);
  const [pickupRadiusKm, setPickupRadiusKm] = React.useState(String(settings.pickupRadiusKm ?? 25));

  const enforceUnit = !softMode;
  const handleModeChange = (sel) => setSoftMode((sel?.[0] || "hard") === "soft");

  const radiusNumber = Number(pickupRadiusKm);
  const radiusError = !Number.isFinite(radiusNumber) || radiusNumber < 0 || radiusNumber > 500 ? "Must be between 0 and 500" : undefined;

  return (
    <AppFrame>
      <Page title="Address Validator++: Settings" subtitle="Customize your address policies">
        {saved ? (
          <Box padding="300">
            <Banner status="success" title="Settings saved" />
          </Box>
        ) : null}
        <Form method="post">
          <Layout>
            {/* Validation Rules */}
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text as="h3" variant="headingMd">Validation Rules</Text>
                  <Box paddingBlockStart="300">
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Checkbox label="Block PO Boxes" name="blockPoBoxes" checked={blockPoBoxes} onChange={setBlockPoBoxes} />
                          <Text tone="subdued">Prevent shipping to PO Box addresses</Text>
                        </BlockStack>
                        <Checkbox label="Enforce Unit/Apt #" checked={enforceUnit} onChange={(v) => setSoftMode(!v)} />
                      </InlineStack>
                      <Text tone="subdued">Require unit/apartment for multiâ€‘unit buildings</Text>
                    </BlockStack>
                  </Box>
                </Box>
              </Card>
            </Layout.Section>

            {/* Pickup Location Suggestions */}
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text as="h3" variant="headingMd">Pickup Location Suggestions</Text>
                  <Box paddingBlockStart="300">
                    <Text tone="subdued">Validation Mode</Text>
                    <Box paddingBlockStart="200">
                      <ChoiceList
                        title="Validation Mode"
                        titleHidden
                        choices={[
                          { label: "Hard Mode (Strict blocking at checkout)", value: "hard" },
                          { label: "Soft (Warn and allow override)", value: "soft" },
                        ]}
                        selected={[softMode ? "soft" : "hard"]}
                        onChange={handleModeChange}
                        allowMultiple={false}
                      />
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Layout.Section>

            {/* Autoâ€‘Suggest Store Pickup */}
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <Text as="h3" variant="headingMd">Autoâ€‘Suggest Store Pickup</Text>
                  <Box paddingBlockStart="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Checkbox label="Autoâ€‘Apply Corrections" name="autoApplyCorrections" checked={autoApplyCorrections} onChange={setAutoApplyCorrections} />
                        <Text tone="subdued">Automatically fix common typos and formatting issues</Text>
                      </BlockStack>
                      <div style={{ minWidth: 260 }}>
                        <TextField
                          label="Pickup Search Radius (km)"
                          name="pickupRadiusKm"
                          type="number"
                          min={0}
                          value={pickupRadiusKm}
                          onChange={setPickupRadiusKm}
                          autoComplete="off"
                          error={result?.error?.includes("Pickup Search Radius") ? result.error : radiusError}
                        />
                      </div>
                    </InlineStack>
                  </Box>
                </Box>
              </Card>
            </Layout.Section>

            {/* Save/Cancel */}
            <Layout.Section>
              <InlineStack gap="300">
                <input type="hidden" name="softMode" value={softMode ? "on" : "false"} />
                <Button submit variant="primary" disabled={!!radiusError}>Save Settings</Button>
                <Button url="/index">Cancel</Button>
              </InlineStack>
            </Layout.Section>
          </Layout>
        </Form>
        {result?.error ? (
          <Box padding="300"><Banner status="critical" title={String(result.error)} /></Box>
        ) : null}
      </Page>
    </AppFrame>
  );
}

