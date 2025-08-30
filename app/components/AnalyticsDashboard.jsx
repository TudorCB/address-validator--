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
  Divider,
  BlockStack,
  Badge,
} from "@shopify/polaris";
import ClientOnly from "./ClientOnly.jsx";
const StackedAreaChartClient = React.lazy(() => import("./StackedAreaChart.client.jsx"));
import SafeIcon from "./SafeIcon.jsx";

function KpiCard({ title, value, subtitle, trend, trendPositive, icon }) {
  return (
    <Card>
      <Box padding="400" background="bg-surface-secondary" border="border" borderRadius="300">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="150">
            <Text as="h3" variant="headingMd">{title}</Text>
            <Text as="p" variant="heading2xl">{value}</Text>
            {subtitle ? (
              <Text as="p" tone="subdued">{subtitle}</Text>
            ) : null}
            {trend ? (
              <Text as="p" tone={trendPositive ? "success" : "critical"}>{trend}</Text>
            ) : null}
          </BlockStack>
          <div aria-hidden style={{ fontSize: 28 }}>{icon}</div>
        </InlineStack>
      </Box>
    </Card>
  );
}

function SimpleUSHeatMap() {
  // A very simple placeholder US map silhouette with positioned heat circles
  const circles = [
    { cx: 60, cy: 50, r: 10 }, // CA
    { cx: 140, cy: 75, r: 9 }, // TX
    { cx: 210, cy: 45, r: 8 }, // IL
    { cx: 250, cy: 55, r: 10 }, // NY
    { cx: 230, cy: 75, r: 9 }, // FL
  ];
  return (
    <svg viewBox="0 0 300 150" width="100%" height="160" role="img" aria-label="US heatmap">
      <rect x="0" y="0" width="300" height="150" rx="12" fill="#F1F2F4" />
      {/* Simplified landmass path */}
      <path
        d="M20,90 C40,50 90,40 120,55 C140,65 170,55 190,60 C220,70 250,60 270,70 L270,90 C230,110 180,100 150,110 C120,120 80,110 50,110 Z"
        fill="#DCDDE0"
      />
      {circles.map((c, i) => (
        <circle key={i} {...c} fill="#FF6B6B" fillOpacity="0.85" />
      ))}
    </svg>
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
  

  const token = "dev.stub.jwt"; // accepted by session-verify in dev

  const trendData = React.useMemo(() => {
    const t = summary?.trends || [];
    return t.map((d) => ({
      name: d.day,
      values: [
        { key: "Successful", value: d.ok || 0 },
        { key: "Corrected", value: d.corrected || 0 },
        { key: "Blocked", value: d.blocked || 0 },
      ],
    }));
  }, [summary]);

  async function fetchData() {
    const headers = { authorization: `Bearer ${token}` };
    const s = await fetch(`/api/analytics.summary?range=${range}&segment=${segment}`, { headers }).then((r) => r.json());
    const p = await fetch(`/api/analytics.top-problems?range=${range}&segment=${segment}`, { headers }).then((r) => r.json());
    setSummary(s);
    setProblems({ topByZip: p?.topByZip || [], topByCity: p?.topByCity || [] });
  }

  async function fetchSettings() {
    try {
      const res = await fetch(`/api/settings`, { headers: { authorization: `Bearer ${token}` } });
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
      const res = await fetch(`/api/settings.update`, {
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
  const pctCorrected = pct(k?.corrected || 0);

  // no logs table on the simplified dashboard

  return (
    <Page title="Address validation Analytics" subtitle="To provide actionable insights & Solutions">
      {/* Filters */}
      <Box paddingBlockEnd="300">
        <Card>
          <Box padding="300">
            <InlineStack gap="400" wrap={false} align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Overview</Text>
              <InlineStack gap="300">
                <Select
                  label="Range"
                  labelHidden
                  options={[
                    { label: "7 days", value: "7d" },
                    { label: "14 days", value: "14d" },
                    { label: "30 days", value: "30d" },
                  ]}
                  value={range}
                  onChange={setRange}
                />
                <Select
                  label="Source"
                  labelHidden
                  options={[
                    { label: "All", value: "all" },
                    { label: "Checkout", value: "checkout" },
                    { label: "Thank-you", value: "thank_you" },
                    { label: "Account", value: "customer_account" },
                  ]}
                  value={segment}
                  onChange={setSegment}
                />
              </InlineStack>
            </InlineStack>
          </Box>
        </Card>
      </Box>

      {/* KPIs */}
      <Grid columns={{ sm: 1, md: 2, lg: 4 }} gap="400">
        <Grid.Cell>
          <KpiCard
            title="Validations"
            value={(k.totalValidations ?? 0).toLocaleString()}
            trend="+12% vs last month"
            trendPositive
            icon={<SafeIcon name="ArrowUpIcon" />}
          />
        </Grid.Cell>
        <Grid.Cell>
          <KpiCard title="Addresses Corrected" value={(k.corrected ?? 0).toLocaleString()} subtitle="Corrected" icon={<SafeIcon name="WrenchIcon" />} />
        </Grid.Cell>
        <Grid.Cell>
          <KpiCard title="Deliveries Blocked" value={(k.blocked ?? 0).toLocaleString()} subtitle="Blocked" icon={<SafeIcon name="ShieldIcon" />} />
        </Grid.Cell>
        <Grid.Cell>
          <KpiCard title="Estimated Savings" value={`$${(k.estimatedSavings ?? 0).toLocaleString()}`} subtitle="Based on avg $18/failed delivery" icon={<SafeIcon name="CashDollarIcon" />} />
        </Grid.Cell>
      </Grid>

      {/* Validation Trends */}
      <Box paddingBlockStart="400">
        <Card>
          <Box padding="400">
            <Text as="h3" variant="headingMd">Validation Trends</Text>
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
                <Badge tone="success">Successful</Badge>
                <Badge tone="info">Corrected</Badge>
                <Badge tone="critical">Blocked</Badge>
              </InlineStack>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Insights + Top Problems */}
      <Box paddingBlockStart="400">
        <Grid columns={{ sm: 1, md: 2, lg: 2 }} gap="400">
          <Grid.Cell>
            <Card>
              <Box padding="400">
                <Text as="h3" variant="headingMd">Insights</Text>
                <Box paddingBlockStart="300">
                  <BlockStack gap="300">
                    <BlockStack gap="100">
                      <InlineStack blockAlign="center" gap="200">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-label="Enable PO Box blocking"
                          checked={poBoxBlock}
                          onChange={(e) => setPoBoxBlock(e.target.checked)}
                        />
                        <Text as="p" variant="bodyMd">Enable PO Box blocking</Text>
                      </InlineStack>
                      <Text tone="subdued">{pctPoBox}% of addresses in the last {range} were PO Boxes.</Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="100">
                      <InlineStack blockAlign="center" gap="200">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-label="Enforce complete addresses"
                          checked={enforceUnit}
                          onChange={(e) => setEnforceUnit(e.target.checked)}
                        />
                        <Text as="p" variant="bodyMd">Enforce complete addresses</Text>
                      </InlineStack>
                      <Text tone="subdued">{pctMissingUnit}% of validations are missing apartment numbers.</Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="100">
                      <InlineStack blockAlign="center" gap="200">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-label="Auto-apply corrections"
                          checked={autoApply}
                          onChange={(e) => setAutoApply(e.target.checked)}
                        />
                        <Text as="p" variant="bodyMd">Auto-apply corrections</Text>
                      </InlineStack>
                      <Text tone="subdued">Automatically adjust corrections where possible ({pctCorrected}% corrected).</Text>
                    </BlockStack>

                    <Box paddingBlockStart="300">
                      <Button variant="primary" onClick={applySettings}>Apply All Changes</Button>
                    </Box>
                  </BlockStack>
                </Box>
              </Box>
            </Card>
          </Grid.Cell>

          <Grid.Cell>
            <Card>
              <Box padding="400">
                <Text as="h3" variant="headingMd">Pickup radius</Text>
                <Box paddingBlockStart="300">
                  <SimpleUSHeatMap />
                </Box>
                <Box paddingBlockStart="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued">Settings</Text>
                    <Button url="/settings" plain>Validation rules</Button>
                  </InlineStack>
                </Box>
              </Box>
            </Card>
          </Grid.Cell>
        </Grid>
      </Box>

      {/* Top problem tables + export */}
      <Box paddingBlockStart="400">
        <Grid columns={{ sm: 1, md: 2, lg: 2 }} gap="400">
          <Grid.Cell>
            <Card>
              <Box padding="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">Top problem ZIP codes</Text>
                  <Button
                    onClick={async () => {
                      try {
                        const url = `/admin/logs.csv?range=${range}&segment=${segment}`;
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
                    Export logs CSV
                  </Button>
                </InlineStack>
                <Box paddingBlockStart="200">
                  <BlockStack gap="100">
                    {(problems.topByZip || []).slice(0, 5).map((r) => (
                      <InlineStack key={r.key} align="space-between">
                        <Text as="p">{r.key}</Text>
                        <Text as="p">{(r.total || 0).toLocaleString()}</Text>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </Box>
              </Box>
            </Card>
          </Grid.Cell>
          <Grid.Cell>
            <Card>
              <Box padding="400">
                <Text as="h3" variant="headingMd">Top problem cities</Text>
                <Box paddingBlockStart="200">
                  <BlockStack gap="100">
                    {(problems.topByCity || []).slice(0, 5).map((r) => (
                      <InlineStack key={r.key} align="space-between">
                        <Text as="p">{r.key}</Text>
                        <Text as="p">{(r.total || 0).toLocaleString()}</Text>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </Box>
              </Box>
            </Card>
          </Grid.Cell>
        </Grid>
      </Box>

      
    </Page>
  );
}
