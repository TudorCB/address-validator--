import React from "react";
import {
  Page,
  Card,
  Grid,
  Text,
  InlineStack,
  Button,
  Select,
  Box,
  BlockStack,
  Badge,
} from "@shopify/polaris";
import ClientOnly from "./ClientOnly.jsx";
const StackedAreaChartClient = React.lazy(() => import("./StackedAreaChart.client.jsx"));
import SafeIcon from "./SafeIcon.jsx";
import { endpoints } from "../lib/api-endpoints.js";

function KpiCard({ title, value, subtitle, trend, trendPositive, icon }) {
  return (
    <Card>
      <Box padding="400" background="bg-surface-secondary" border="border" borderRadius="300">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="150">
            <Text as="h3" variant="headingMd">{title}</Text>
            <Text as="p" variant="heading2xl">{value}</Text>
            {subtitle ? <Text as="p" tone="subdued">{subtitle}</Text> : null}
            {trend ? <Text as="p" tone={trendPositive ? "success" : "critical"}>{trend}</Text> : null}
          </BlockStack>
          {icon ? <div aria-hidden style={{ fontSize: 28 }}>{icon}</div> : null}
        </InlineStack>
      </Box>
    </Card>
  );
}

function CircularPickupRadiusViz() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #E8F5E8, #C1E8C1)',
        border: '2px solid #B8E6B8', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2D7A2D' }} />
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  // Filters and local UI state
  const [range, setRange] = React.useState("30d");
  const [segment, setSegment] = React.useState("all");
  const [poBoxBlock, setPoBoxBlock] = React.useState(true);
  const [enforceUnit, setEnforceUnit] = React.useState(false); // maps to softMode=false
  const [autoApply, setAutoApply] = React.useState(false);

  // Data state (live from API)
  const [summary, setSummary] = React.useState(null);
  const [problems, setProblems] = React.useState({ topByZip: [], topByCity: [] });
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  const [security, setSecurity] = React.useState(null);
  const [providerMetrics, setProviderMetrics] = React.useState(null);

  const token = "dev.stub.jwt"; // accepted by session-verify in dev

  const trendData = React.useMemo(() => {
    const t = Array.isArray(summary?.trends) ? summary.trends : [];
    return [
      { name: "Successful", data: t.map((d) => ({ key: d.day, value: d.ok || 0 })) },
      { name: "Corrected", data: t.map((d) => ({ key: d.day, value: d.corrected || 0 })) },
      { name: "Blocked", data: t.map((d) => ({ key: d.day, value: d.blocked || 0 })) },
    ];
  }, [summary]);

  async function fetchData() {
    const headers = { authorization: `Bearer ${token}` };
    const s = await fetch(endpoints.analyticsSummary({ range, segment }), { headers }).then((r) => r.json());
    const p = await fetch(endpoints.analyticsTopProblems({ range, segment }), { headers }).then((r) => r.json());
    setSummary(s);
    setProblems({ topByZip: p?.topByZip || [], topByCity: p?.topByCity || [] });
    try {
      const sec = await fetch(endpoints.securityStats(), { headers }).then((r) => r.json());
      setSecurity(sec?.stats || null);
    } catch (e) {
      console.error("security stats fetch failed", e);
    }
    try {
      const prov = await fetch(endpoints.analyticsProviders(), { headers }).then((r) => r.json());
      // normalize to provider object
      setProviderMetrics(prov?.provider || prov || null);
    } catch (e) {
      console.error("provider metrics fetch failed", e);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch(endpoints.settingsGet(), { headers: { authorization: `Bearer ${token}` } });
      const body = await res.json();
      const st = body?.settings || {};
      setPoBoxBlock(!!st.blockPoBoxes);
      setEnforceUnit(!st.softMode);
      setAutoApply(!!st.autoApplyCorrections);
      setSettingsLoaded(true);
    } catch (e) {
      console.error("settings load failed", e);
    }
  }

  async function applySettings() {
    try {
      const patch = { blockPoBoxes: poBoxBlock, softMode: !enforceUnit, autoApplyCorrections: !!autoApply };
      const res = await fetch(endpoints.settingsUpdate(), {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`apply failed ${res.status}`);
    } catch (e) {
      console.error("apply settings error", e);
    }
  }

  React.useEffect(() => {
    fetchData().catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, segment]);

  React.useEffect(() => {
    if (!settingsLoaded) fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const k = summary?.kpis || {};
  const total = k.totalValidations || 0;
  const pct = (n) => (total > 0 ? Math.round((n * 1000) / total) / 10 : 0);
  const pctPoBox = pct(k?.causes?.blockedPoBox || 0);
  const pctMissingUnit = pct(k?.causes?.blockedMissingUnit || 0);

  return (
    <Box>
      {/* Header with Branding */}
      <Box paddingBlockEnd="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#00A047', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SafeIcon name="StoreIcon" />
            </div>
            <Text as="h1" variant="headingLg">Address Validator ++</Text>
          </InlineStack>
          <Select
            label="Time Range"
            labelHidden
            options={[
              { label: "Last 7 days", value: "7d" },
              { label: "Last 14 days", value: "14d" },
              { label: "Last 30 days", value: "30d" },
            ]}
            value={range}
            onChange={setRange}
          />
        </InlineStack>
      </Box>

      <Page title="Key Metrics" subtitle="Address Validator++">
        {/* KPIs */}
        <Grid columns={{ sm: 1, md: 3, lg: 3 }} gap="400">
          <Grid.Cell>
            <KpiCard
              title="Validations"
              value={(k.totalValidations ?? 0).toLocaleString()}
              subtitle="Total"
              icon={<SafeIcon name="ClipboardChecklistIcon" />}
            />
          </Grid.Cell>
          <Grid.Cell>
            <KpiCard
              title="Savings"
              value={`$${(k.estimatedSavings ?? 0).toLocaleString()}`}
              subtitle="Estimated"
              icon={<SafeIcon name="CashDollarIcon" />}
            />
          </Grid.Cell>
          <Grid.Cell>
            <KpiCard
              title="Blocked"
              value={(k.blocked ?? 0).toLocaleString()}
              subtitle="Hard gated"
              icon={<SafeIcon name="AlertTriangleIcon" />}
            />
          </Grid.Cell>
        </Grid>

        {/* Security Stats */}
        <Box paddingBlockStart="400">
          <Card>
            <Box padding="400">
              <Text as="h3" variant="headingMd">Security (last 24h)</Text>
              <Box paddingBlockStart="300">
                <InlineStack gap="400">
                  <Text>Total: {(security?.total ?? 0).toLocaleString()}</Text>
                  <Text>OK: {(security?.ok ?? 0).toLocaleString()}</Text>
                  <Text>Fail: {Object.values(security?.fail || {}).reduce((a,b)=>a+Number(b||0),0).toLocaleString()}</Text>
                  <Text tone="subdued">expired: {security?.fail?.expired ?? 0}, badsig: {security?.fail?.badsig ?? 0}</Text>
                </InlineStack>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Provider Health */}
        <Box paddingBlockStart="400">
          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Provider health</Text>
                <Badge tone={(providerMetrics?.fail ?? 0) > 0 ? "warning" : "success"}>
                  {((providerMetrics?.ok ?? 0) + (providerMetrics?.fail ?? 0)) || 0} calls
                </Badge>
              </InlineStack>
              <Box paddingBlockStart="300">
                <InlineStack gap="400">
                  <Text>OK: {(providerMetrics?.ok ?? 0).toLocaleString()}</Text>
                  <Text>Fail: {(providerMetrics?.fail ?? 0).toLocaleString()}</Text>
                  <Text>P50: {providerMetrics?.p50 != null ? `${Math.round(providerMetrics.p50)} ms` : '—'}</Text>
                </InlineStack>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Validation Trend */}
        <Box paddingBlockStart="400">
          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Trend</Text>
                <Select
                  label="Segment"
                  labelHidden
                  options={[
                    { label: "All", value: "all" },
                    { label: "Checkout", value: "checkout" },
                    { label: "Thank you", value: "thank_you" },
                    { label: "Customer account", value: "customer_account" },
                  ]}
                  value={segment}
                  onChange={setSegment}
                />
              </InlineStack>
              <Box paddingBlockStart="300">
                <ClientOnly>
                  <React.Suspense fallback={<Text tone="subdued">Loading chart...</Text>}>
                    <StackedAreaChartClient
                      isAnimated
                      data={trendData}
                      theme="Default"
                      xAxisOptions={{ labelFormatter: (v) => String(v).slice(5) }}
                    />
                  </React.Suspense>
                </ClientOnly>
              </Box>
              <Box paddingBlockStart="200">
                <InlineStack gap="200">
                  <Badge tone="success">Deliverable</Badge>
                  <Badge tone="info">Corrected</Badge>
                  <Badge tone="critical">Blocked</Badge>
                </InlineStack>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Three-column layout: ZIPs, Cities, Insights */}
        <Box paddingBlockStart="400">
          <Grid columns={{ sm: 1, md: 3, lg: 3 }} gap="400">
            {/* Left: Top problem ZIPs */}
            <Grid.Cell>
              <Card>
                <Box padding="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingMd">Top problem ZIPs</Text>
                    <Text as="span" variant="bodySm" tone="subdued">Address</Text>
                  </InlineStack>
                  <Box paddingBlockStart="300">
                    <BlockStack gap="200">
                      {(problems.topByZip || []).slice(0, 5).map((r, index) => {
                        const zipDisplay = r.key ? r.key.split('-').pop() : `ZIP ${index + 1}`;
                        return (
                          <InlineStack key={r.key || index} align="space-between">
                            <Text as="p">{zipDisplay}</Text>
                            <Text as="p">{(r.total || 0).toLocaleString()}</Text>
                          </InlineStack>
                        );
                      })}
                    </BlockStack>
                  </Box>
                  <Box paddingBlockStart="400">
                    <Button
                      size="slim"
                      onClick={async () => {
                        try {
                          const url = `/admin/logs/csv?range=${range}&segment=${segment}`;
                          const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
                          if (!res.ok) throw new Error(`Export failed: ${res.status}`);
                          const blob = await res.blob();
                          const href = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = href;
                          a.download = `address-validator-logs-${range}-${segment}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(href);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      Export logs to CSV
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid.Cell>

            {/* Middle: Top problem cities */}
            <Grid.Cell>
              <Card>
                <Box padding="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingMd">Top problem cities</Text>
                    <Text as="span" variant="bodySm" tone="subdued">Amount</Text>
                  </InlineStack>
                  <Box paddingBlockStart="300">
                    <BlockStack gap="200">
                      {(problems.topByCity || []).slice(0, 5).map((r, index) => (
                        <InlineStack key={r.key || index} align="space-between">
                          <Text as="p">{r.key || `City ${index + 1}`}</Text>
                          <Text as="p">{(r.total || 0).toLocaleString()}</Text>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  </Box>
                </Box>
              </Card>
            </Grid.Cell>

            {/* Right: Insights + Pickup radius */}
            <Grid.Cell>
              <BlockStack gap="400">
                {/* Insights Card */}
                <Card>
                  <Box padding="400">
                    <Text as="h3" variant="headingMd">Insights</Text>
                    <Box paddingBlockStart="300">
                      <BlockStack gap="300">
                        <BlockStack gap="150">
                          <InlineStack blockAlign="center" gap="200">
                            <input
                              type="checkbox"
                              role="switch"
                              aria-label="Enable PO Box blocking"
                              checked={poBoxBlock}
                              onChange={(e) => setPoBoxBlock(e.target.checked)}
                              style={{ width: 40, height: 20, borderRadius: 10, appearance: 'none', backgroundColor: poBoxBlock ? '#00A047' : '#DDD', position: 'relative', cursor: 'pointer' }}
                            />
                            <Text as="p" variant="bodyMd">Block PO Boxes</Text>
                          </InlineStack>
                          <Text tone="subdued">{pctPoBox}% of addresses in the last 30 days were PO Boxes.</Text>
                        </BlockStack>

                        <BlockStack gap="150">
                          <InlineStack blockAlign="center" gap="200">
                            <input
                              type="checkbox"
                              role="switch"
                              aria-label="Enforce complete addresses"
                              checked={enforceUnit}
                              onChange={(e) => setEnforceUnit(e.target.checked)}
                              style={{ width: 40, height: 20, borderRadius: 10, appearance: 'none', backgroundColor: enforceUnit ? '#00A047' : '#DDD', position: 'relative', cursor: 'pointer' }}
                            />
                            <Text as="p" variant="bodyMd">Enforce unit/apartment</Text>
                          </InlineStack>
                          <Text tone="subdued">{pctMissingUnit}% of validations are missing apartment numbers.</Text>
                        </BlockStack>

                        <BlockStack gap="150">
                          <InlineStack blockAlign="center" gap="200">
                            <input
                              type="checkbox"
                              role="switch"
                              aria-label="Auto-apply corrections"
                              checked={autoApply}
                              onChange={(e) => setAutoApply(e.target.checked)}
                              style={{ width: 40, height: 20, borderRadius: 10, appearance: 'none', backgroundColor: autoApply ? '#00A047' : '#DDD', position: 'relative', cursor: 'pointer' }}
                            />
                            <Text as="p" variant="bodyMd">Auto-apply corrections</Text>
                          </InlineStack>
                          <Text tone="subdued">Automatically adjust corrections when possible</Text>
                        </BlockStack>
                      </BlockStack>
                    </Box>
                  </Box>
                </Card>

                {/* Pickup radius Card */}
                <Card>
                  <Box padding="400">
                    <Text as="h3" variant="headingMd">Pickup radius</Text>
                    <Box paddingBlockStart="300">
                      <CircularPickupRadiusViz />
                    </Box>
                    <Box paddingBlockStart="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text tone="subdued">Settings</Text>
                        <Button url="/settings" plain>Validation rules</Button>
                      </InlineStack>
                    </Box>
                  </Box>
                </Card>
              </BlockStack>
            </Grid.Cell>
          </Grid>
        </Box>
      </Page>
    </Box>
  );
}
