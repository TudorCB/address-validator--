import React from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { Page, Layout, Card, Text, TextField, Checkbox, Button, InlineStack, BlockStack, Box, ChoiceList, Banner } from "@shopify/polaris";
import { getSettings, updateSettings } from "../lib/settings.js";
import { authenticate } from "../shopify.server";
import { t } from "../lib/i18n.js";
import { ToastContext } from "../components/ToastContext.jsx";
import { getAuthorizationHeader } from "../lib/admin-auth.client.js";
import { endpoints } from "../lib/api-endpoints.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const saved = url.searchParams.get("saved") === "1";
  let shop = "__global__";
  try {
    const { session } = await authenticate.admin(request);
    shop = session?.shop || shop;
  } catch { }
  const settings = await getSettings(shop);
  return json({ settings, saved });
};

export const action = async ({ request }) => {
  let shop = "__global__";
  try {
    const { session } = await authenticate.admin(request);
    shop = session?.shop || shop;
  } catch { }
  const form = await request.formData();
  const radiusStr = form.get("pickupRadiusKm");
  const blockPoBoxesStr = form.get("blockPoBoxes");
  const autoApplyCorrectionsStr = form.get("autoApplyCorrections");
  const softModeStr = form.get("softMode");
  const failedCostStr = form.get("failedDeliveryCostUsd");

  const radius = Number(radiusStr);
  const blockPoBoxes = blockPoBoxesStr === "on" || blockPoBoxesStr === "true";
  const autoApplyCorrections = autoApplyCorrectionsStr === "on" || autoApplyCorrectionsStr === "true";
  const softMode = softModeStr === "on" || softModeStr === "true";
  const failedDeliveryCostUsd = Number(failedCostStr);

  if (!Number.isFinite(radius) || radius < 0 || radius > 500) {
    return json({ error: t("errors.pickup_radius_range") }, { status: 400 });
  }
  if (!Number.isFinite(failedDeliveryCostUsd) || failedDeliveryCostUsd < 0 || failedDeliveryCostUsd > 1000) {
    return json({ error: t("errors.failed_cost_range") }, { status: 400 });
  }

  await updateSettings({
    pickupRadiusKm: radius,
    blockPoBoxes,
    autoApplyCorrections,
    softMode,
    failedDeliveryCostUsd,
  }, shop);

  return redirect("/app/settings?saved=1");
};

export default function SettingsPage() {
  const { settings, saved } = useLoaderData();
  const result = useActionData();
  const { show } = React.useContext(ToastContext);

  const [blockPoBoxes, setBlockPoBoxes] = React.useState(!!settings.blockPoBoxes);
  const [autoApplyCorrections, setAutoApplyCorrections] = React.useState(!!settings.autoApplyCorrections);
  const [softMode, setSoftMode] = React.useState(!!settings.softMode);
  const [pickupRadiusKm, setPickupRadiusKm] = React.useState(String(settings.pickupRadiusKm ?? 25));
  const [failedDeliveryCostUsd, setFailedDeliveryCostUsd] = React.useState(String(settings.failedDeliveryCostUsd ?? 12));

  const enforceUnit = !softMode;
  const handleModeChange = (sel) => setSoftMode((sel?.[0] || "hard") === "soft");

  const radiusNumber = Number(pickupRadiusKm);
  const radiusError = !Number.isFinite(radiusNumber) || radiusNumber < 0 || radiusNumber > 500 ? "Must be between 0 and 500" : undefined;
  const costNumber = Number(failedDeliveryCostUsd);
  const costError = !Number.isFinite(costNumber) || costNumber < 0 || costNumber > 1000 ? "Must be between 0 and 1000" : undefined;

  const [sim, setSim] = React.useState(null); // { delta, baseline, simulated }
  const [simError, setSimError] = React.useState(null);
  const [simLoading, setSimLoading] = React.useState(false);

  async function onSimulate() {
    try {
      setSimError(null);
      setSim(null);
      setSimLoading(true);
      const headers = await getAuthorizationHeader();
      const res = await fetch(endpoints.analyticsSimulate(), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify({ toggles: { blockPoBoxes, softMode } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Simulate failed: ${res.status}`);
      setSim(data);
      show(t("settings.simulation_impact"));
    } catch (e) {
      console.error(e);
      setSimError(String(e.message || e));
    } finally {
      setSimLoading(false);
    }
  }

  async function onResetDefaults() {
    try {
      const defaults = { pickupRadiusKm: 25, blockPoBoxes: true, autoApplyCorrections: true, softMode: false, failedDeliveryCostUsd: 12 };
      const headers = await getAuthorizationHeader();
      const res = await fetch(endpoints.settingsUpdate(), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(defaults),
      });
      if (!res.ok) throw new Error(`Reset failed: ${res.status}`);
      setBlockPoBoxes(defaults.blockPoBoxes);
      setAutoApplyCorrections(defaults.autoApplyCorrections);
      setSoftMode(defaults.softMode);
      setPickupRadiusKm(String(defaults.pickupRadiusKm));
      setFailedDeliveryCostUsd(String(defaults.failedDeliveryCostUsd));
      show('Settings reset to defaults.');
    } catch (e) {
      console.error(e);
      alert('Could not reset to defaults.');
    }
  }

  return (
    <Page title={t("settings.title")} subtitle={t("settings.subtitle")}>
      {saved ? (
        <Box padding="300" aria-live="polite" role="status">
          <Banner status="success" title={t("settings.saved")} />
        </Box>
      ) : null}
      <Form method="post">
        <Layout>
          {/* Validation Rules */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text as="h3" variant="headingMd">{t("settings.validation_rules")}</Text>
                <Box paddingBlockStart="300">
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Checkbox label={t("settings.block_po_boxes")} name="blockPoBoxes" checked={blockPoBoxes} onChange={setBlockPoBoxes} />
                        <Text tone="subdued">{t("settings.block_po_boxes_help")}</Text>
                      </BlockStack>
                      <Checkbox label={t("settings.enforce_unit")} checked={enforceUnit} onChange={(v) => setSoftMode(!v)} />
                    </InlineStack>
                    <Text tone="subdued">Require unit/apartment for multi‑unit buildings</Text>
                  </BlockStack>
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Pickup Location Suggestions */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text as="h3" variant="headingMd">{t("settings.pickup_suggestions")}</Text>
                <Box paddingBlockStart="300">
                  <Text tone="subdued">{t("settings.validation_mode")}</Text>
                  <Box paddingBlockStart="200">
                    <ChoiceList
                      title={t("settings.validation_mode")}
                      titleHidden
                      choices={[
                        { label: t("settings.mode.hard"), value: "hard" },
                        { label: t("settings.mode.soft"), value: "soft" },
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
                <Text as="h3" variant="headingMd">Auto‑Suggest Store Pickup</Text>
                <Box paddingBlockStart="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Checkbox label={t("settings.auto_apply")} name="autoApplyCorrections" checked={autoApplyCorrections} onChange={setAutoApplyCorrections} />
                      <Text tone="subdued">{t("settings.auto_apply_help")}</Text>
                    </BlockStack>
                    <div style={{ minWidth: 260 }}>
                      <TextField
                        label={t("settings.pickup_radius")}
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

          {/* Estimated Savings */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <Text as="h3" variant="headingMd">{t("settings.estimated_savings")}</Text>
                <Box paddingBlockStart="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <div style={{ minWidth: 260 }}>
                      <TextField
                        label={t("settings.failed_cost")}
                        name="failedDeliveryCostUsd"
                        type="number"
                        min={0}
                        value={failedDeliveryCostUsd}
                        onChange={setFailedDeliveryCostUsd}
                        autoComplete="off"
                        error={result?.error?.includes("Failed Delivery Cost") ? result.error : costError}
                      />
                    </div>
                    <div>
                      <Button onClick={onSimulate} loading={simLoading}>{t("settings.simulate")}</Button>
                    </div>
                  </InlineStack>
                  {simError ? (
                    <Box paddingBlockStart="200" aria-live="polite" role="status"><Banner status="critical" title={String(simError)} /></Box>
                  ) : null}
                  {sim?.delta ? (
                    <Box paddingBlockStart="200" aria-live="polite" role="status">
                      <Banner status="info" title={t("settings.simulation_impact")}>
                        <div style={{ marginTop: 8 }}>
                          <div><b>{t("delta.blocked")}:</b> {sim.delta.blocked >= 0 ? `+${sim.delta.blocked}` : sim.delta.blocked}</div>
                          <div><b>{t("delta.ok")}:</b> {sim.delta.ok >= 0 ? `+${sim.delta.ok}` : sim.delta.ok}</div>
                          <div><b>{t("delta.corrected")}:</b> {sim.delta.corrected >= 0 ? `+${sim.delta.corrected}` : sim.delta.corrected}</div>
                          <div><b>{t("delta.unverified")}:</b> {sim.delta.unver >= 0 ? `+${sim.delta.unver}` : sim.delta.unver}</div>
                        </div>
                      </Banner>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Card>
          </Layout.Section>

          {/* Save/Cancel */}
          <Layout.Section>
            <InlineStack gap="300">
              <input type="hidden" name="softMode" value={softMode ? "on" : "false"} />
              <Button submit variant="primary" disabled={!!radiusError || !!costError}>{t("settings.save")}</Button>
              <Button url="/app">{t("settings.cancel")}</Button>
              <Button tone="critical" onClick={onResetDefaults}>Reset to defaults</Button>
            </InlineStack>
          </Layout.Section>
        </Layout>
      </Form>
      {result?.error ? (
        <Box padding="300" aria-live="polite" role="status"><Banner status="critical" title={String(result.error)} /></Box>
      ) : null}
    </Page>
  );
}
