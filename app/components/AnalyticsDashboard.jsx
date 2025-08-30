import React from "react";
import {
  Page,
  Card,
  Grid,
  Text,
  InlineStack,
  Button,
  Select,
  TextField,
  DataTable,
  Box,
  Divider,
  Bleed,
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
  const [search, setSearch] = React.useState("");
  const [poBoxBlock, setPoBoxBlock] = React.useState(true);
  const [enforceUnit, setEnforceUnit] = React.useState(false); // maps to softMode=false

  // Data state (live from API)
  const [summary, setSummary] = React.useState(null);
  const [problems, setProblems] = React.useState({ topByZip: [], topByCity: [] });
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  const [logs, setLogs] = React.useState({ rows: [], loading: false });

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
      setSettingsLoaded(true);
    } catch (e) {
      console.error("settings load failed", e);
    }
  }

  async function applySettings() {
    try {
      const patch = { blockPoBoxes: poBoxBlock, softMode: !enforceUnit };
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
    // Logs
    (async () => {
      try {
        setLogs((s) => ({ ...s, loading: true }));
        const url = new URL(`/api/logs`, window.location.origin);
        url.searchParams.set("range", range);
        url.searchParams.set("segment", segment);
        if (search) url.searchParams.set("q", search);
        const res = await fetch(url.toString(), { headers: { authorization: `Bearer ${token}` } });
        const body = await res.json();
        setLogs({ rows: body?.rows || [], loading: false });
      } catch (e) {
        console.error(e);
        setLogs({ rows: [], loading: false });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, segment, search]);

  React.useEffect(() => {
    if (!settingsLoaded) fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const k = summary?.kpis || {};

  // Placeholder table rows (can be wired later)
  const tableRows = logs.rows.map((r) => [
    new Date(r.ts || Date.now()).toLocaleString(),
    r.orderId || "",
    r.source || "",
    r.action || "",
    r.status || "",
  ]);

  return (
    <Page title="Address Validator++: Analytics & Insights" subtitle="Better Deliveries, Lower Costs, Happier Customers">
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
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">Actionable Insights</Text>
                  <InlineStack gap="200">
                    <InlineStack blockAlign="center" gap="150">
                      <Text as="span" tone="subdued">Enforce Unit/Apt #</Text>
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label="Enforce Unit/Apt #"
                        checked={enforceUnit}
                        onChange={(e) => setEnforceUnit(e.target.checked)}
                      />
                    </InlineStack>
                  </InlineStack>
                </InlineStack>

                <Box paddingBlockStart="300">
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack blockAlign="center" gap="200">
                          <input
                            type="checkbox"
                            role="switch"
                            aria-label="Enable PO Box Blocking"
                            checked={poBoxBlock}
                            onChange={(e) => setPoBoxBlock(e.target.checked)}
                          />
                          <Text as="p" variant="bodyMd">Enable PO Box Blocking</Text>
                        </InlineStack>
                        <Text tone="subdued">Automatically prevent to PO Boxes. Reduce missing address details.</Text>
                      </BlockStack>
                    </InlineStack>

                    <Divider />

                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack blockAlign="center" gap="200">
                          <input
                            type="checkbox"
                            role="switch"
                            aria-label="Enforce Unit/Apt #"
                            checked={enforceUnit}
                            onChange={(e) => setEnforceUnit(e.target.checked)}
                          />
                          <Text as="p" variant="bodyMd">Enforce Unit/Apt #</Text>
                        </InlineStack>
                        <Text tone="subdued">Require unit or apartment numbers where applicable.</Text>
                      </BlockStack>
                    </InlineStack>

                    <Box paddingBlockStart="300">
                      <Button variant="primary" onClick={applySettings}>
                        Apply All Changes
                      </Button>
                    </Box>
                  </BlockStack>
                </Box>
              </Box>
            </Card>
          </Grid.Cell>

          <Grid.Cell>
            <Card>
              <Box padding="400">
                <Text as="h3" variant="headingMd">Top Problem ZIPs/Cities</Text>
                <Box paddingBlockStart="300">
                  <SimpleUSHeatMap />
                </Box>
                <Box paddingBlockStart="200">
                  <BlockStack gap="100">
                    {(problems.topByZip || []).slice(0, 5).map((r, idx) => (
                      <Text as="p" key={r.key}>{`${idx + 1}. ${r.key} - ${r.total}`}</Text>
                    ))}
                  </BlockStack>
                </Box>
              <Box paddingBlockStart="300">
                <Button>View Full Report</Button>
              </Box>
            </Box>
          </Card>
        </Grid.Cell>
      </Grid>
      </Box>

      {/* Validation Log Viewer */}
      <Box paddingBlockStart="400">
        <Card>
          <Bleed marginInline="400" marginBlock="0">
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Validation Log Viewer</Text>
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
                  CSV Export
                </Button>
              </InlineStack>

              <Box paddingBlockStart="300">
                <InlineStack gap="300" wrap>
                  <Button>Filter</Button>
                  <Select
                    label="Date Range"
                    labelHidden
                    options={[
                      { label: "Last 7 days", value: "7d" },
                      { label: "Last 14 days", value: "14d" },
                      { label: "Last 30 days", value: "30d" },
                      { label: "All", value: "all" },
                    ]}
                    value={range}
                    onChange={setRange}
                  />
                  <Select
                    label="Source"
                    labelHidden
                    options={[
                      { label: "Source (Checkout, Thank-you, Account)", value: "all" },
                      { label: "Checkout", value: "checkout" },
                      { label: "Thank-you", value: "thank_you" },
                      { label: "Account", value: "customer_account" },
                    ]}
                    value={segment}
                    onChange={setSegment}
                  />
                  <TextField
                    label="Search"
                    labelHidden
                    value={search}
                    onChange={setSearch}
                    placeholder="Search"
                  />
                </InlineStack>
              </Box>

              <Box paddingBlockStart="300">
                {logs.loading ? (
                  <Text tone="subdued">Loading logs...</Text>
                ) : (
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text", "text"]}
                    headings={["Timestamp", "Order ID", "Source", "Action", "Status"]}
                    rows={tableRows}
                  />
                )}
              </Box>
            </Box>
          </Bleed>
        </Card>
      </Box>
    </Page>
  );
}
