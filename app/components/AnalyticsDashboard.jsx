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
  FormLayout,
  SettingToggle,
  Banner,
  Divider,
  SkeletonPage,
  SkeletonDisplayText,
  SkeletonBodyText,
  Spinner,
  EmptyState,
  Layout,
} from "@shopify/polaris";
import ClientOnly from "./ClientOnly.jsx";
const StackedAreaChartClient = React.lazy(() => import("./StackedAreaChart.client.jsx"));
import SafeIcon from "./SafeIcon.jsx";
import { useLocation } from "@remix-run/react";
import { ToastContext } from "./ToastContext.jsx";
import { endpoints } from "../lib/api-endpoints.js";
import { getAuthorizationHeader } from "../lib/admin-auth.client.js";

function KpiCard({ title, value, subtitle, trend, trendPositive, icon }) {
  return (
    <Card>
      <Box padding="400">
        <InlineStack align="space-between" blockAlign="start">
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">{title}</Text>
            <Text as="p" variant="heading2xl">{value}</Text>
            {subtitle && (
              <Text as="p" variant="bodySm" tone="subdued">{subtitle}</Text>
            )}
            {trend && (
              <Badge tone={trendPositive ? "success" : "critical"}>
                {trend}
              </Badge>
            )}
          </BlockStack>
          {icon && (
            <Box color="text-subdued">
              {icon}
            </Box>
          )}
        </InlineStack>
      </Box>
    </Card>
  );
}

function CircularPickupRadiusViz() {
  return (
    <Box padding="400">
      <InlineStack align="center">
        <Box
          width="120px"
          height="120px"
          borderRadius="50%"
          background="bg-surface-secondary"
          border="border-subdued"
          borderWidth="025"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            width="8px"
            height="8px"
            borderRadius="50%"
            background="bg-success-strong"
          />
        </Box>
      </InlineStack>
    </Box>
  );
}

export default function AnalyticsDashboard() {
  const location = useLocation();
  const search = location?.search || "";
  const { show } = React.useContext(ToastContext);
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
  const [cacheMetrics, setCacheMetrics] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  const [auth, setAuth] = React.useState({});
  React.useEffect(() => { (async () => setAuth(await getAuthorizationHeader()))(); }, []);

  const trendData = React.useMemo(() => {
    const t = Array.isArray(summary?.trends) ? summary.trends : [];
    return [
      { name: "Successful", data: t.map((d) => ({ key: d.day, value: d.ok || 0 })) },
      { name: "Corrected", data: t.map((d) => ({ key: d.day, value: d.corrected || 0 })) },
      { name: "Blocked", data: t.map((d) => ({ key: d.day, value: d.blocked || 0 })) },
    ];
  }, [summary]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const headers = auth;
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
      try {
        const cm = await fetch('/api/analytics/cache', { headers }).then(r => r.json());
        setCacheMetrics(cm?.cache || null);
      } catch (e) {
        console.error('cache metrics fetch failed', e);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch(endpoints.settingsGet(), { headers: auth });
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
        headers: { "content-type": "application/json", ...auth },
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

  if (isLoading && !summary) {
    return (
      <SkeletonPage primaryAction breadcrumbs>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="400">
                <SkeletonDisplayText size="small" />
                <Box paddingBlockStart="200">
                  <SkeletonBodyText lines={3} />
                </Box>
              </Box>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <Box padding="400">
                <SkeletonDisplayText size="small" />
                <Box paddingBlockStart="200">
                  <SkeletonBodyText lines={2} />
                </Box>
              </Box>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <Box padding="400">
                <SkeletonDisplayText size="small" />
                <Box paddingBlockStart="200">
                  <SkeletonBodyText lines={2} />
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </SkeletonPage>
    );
  }

  return (
    <Box>
      {/* Modern Header with Navigation */}
      <Box paddingBlockEnd="400">
        <Card>
          <Box padding="400">
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="300" blockAlign="center">
                <Box
                  width="48px"
                  height="48px"
                  borderRadius="200"
                  background="bg-surface-success"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <SafeIcon name="StorefrontIcon" />
                </Box>
                <BlockStack gap="100">
                  <Text as="h1" variant="headingLg" fontWeight="medium">Address Validator++</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Monitor and manage address validation performance</Text>
                </BlockStack>
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
        </Card>
      </Box>

      <Page
        title="Dashboard"
        subtitle="Key performance metrics and insights"
        accessibilityLabel="Address Validator Dashboard"
        breadcrumbs={[{ content: 'Home', url: '/' }]}
      >
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

        {/* Cache Health */}
        <Box paddingBlockStart="400">
          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Cache health</Text>
                <Badge tone={(cacheMetrics?.hitRate ?? 0) >= 50 ? "success" : "warning"}>
                  {cacheMetrics?.hitRate ?? 0}% hit rate
                </Badge>
              </InlineStack>
              <Box paddingBlockStart="300">
                <InlineStack gap="400">
                  <Text>Gets: {(cacheMetrics?.get ?? 0).toLocaleString()}</Text>
                  <Text>Hits: {(cacheMetrics?.hit ?? 0).toLocaleString()}</Text>
                  <Text>Miss: {(cacheMetrics?.miss ?? 0).toLocaleString()}</Text>
                  <Text>Sets: {(cacheMetrics?.set ?? 0).toLocaleString()}</Text>
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
                      {(problems.topByZip || []).length > 0 ? (
                        (problems.topByZip || []).slice(0, 5).map((r, index) => {
                          const zipDisplay = r.key ? r.key.split('-').pop() : `ZIP ${index + 1}`;
                          return (
                            <InlineStack key={r.key || index} align="space-between">
                              <Text as="p">{zipDisplay}</Text>
                              <Text as="p">{(r.total || 0).toLocaleString()}</Text>
                            </InlineStack>
                          );
                        })
                      ) : (
                        <EmptyState
                          heading="No problem ZIPs found"
                          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                          <p>All ZIP codes are performing well</p>
                        </EmptyState>
                      )}
                    </BlockStack>
                  </Box>
                  <Box paddingBlockStart="400">
                    <Button
                      size="slim"
                      onClick={async () => {
                        setIsExporting(true);
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
                        } finally {
                          setIsExporting(false);
                        }
                      }}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <InlineStack gap="200">
                          <Spinner size="small" />
                          <span>Exporting...</span>
                        </InlineStack>
                      ) : (
                        "Export logs to CSV"
                      )}
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
                      {(problems.topByCity || []).length > 0 ? (
                        (problems.topByCity || []).slice(0, 5).map((r, index) => (
                          <InlineStack key={r.key || index} align="space-between">
                            <Text as="p">{r.key || `City ${index + 1}`}</Text>
                            <Text as="p">{(r.total || 0).toLocaleString()}</Text>
                          </InlineStack>
                        ))
                      ) : (
                        <EmptyState
                          heading="No problem cities found"
                          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                          <p>All cities are performing well</p>
                        </EmptyState>
                      )}
                    </BlockStack>
                  </Box>
                </Box>
              </Card>
            </Grid.Cell>

            {/* Right: Insights + Pickup radius */}
            <Grid.Cell>
              <BlockStack gap="400">
                {/* Settings Card */}
                <Card>
                  <Box padding="400">
                    <Text as="h3" variant="headingMd">Validation Settings</Text>
                    <Box paddingBlockStart="300">
                      <FormLayout>
                        <SettingToggle
                          action={{
                            content: poBoxBlock ? "Disable" : "Enable",
                            onAction: async () => {
                              const next = !poBoxBlock;
                              setPoBoxBlock(next);
                              try {
                                const res = await fetch(endpoints.settingsUpdate(), {
                                  method: "PATCH",
                                  headers: { "content-type": "application/json", ...auth },
                                  body: JSON.stringify({ blockPoBoxes: next }),
                                });
                                if (!res.ok) throw new Error("failed");
                                show("PO Box policy updated.");
                              } catch (err) {
                                console.error(err);
                                setPoBoxBlock(!next);
                                show("Could not save setting. Reverted.", { status: "error" });
                              }
                            }
                          }}
                          enabled={poBoxBlock}
                          title="Block PO Boxes"
                        >
                          {pctPoBox}% of addresses in the last 30 days were PO Boxes.
                        </SettingToggle>

                        <SettingToggle
                          action={{
                            content: enforceUnit ? "Disable" : "Enable",
                            onAction: async () => {
                              const next = !enforceUnit;
                              setEnforceUnit(next);
                              try {
                                const res = await fetch(endpoints.settingsUpdate(), {
                                  method: "PATCH",
                                  headers: { "content-type": "application/json", ...auth },
                                  body: JSON.stringify({ softMode: !next }),
                                });
                                if (!res.ok) throw new Error("failed");
                                show("Validation mode updated.");
                              } catch (err) {
                                console.error(err);
                                setEnforceUnit(!next);
                                show("Could not save setting. Reverted.", { status: "error" });
                              }
                            }
                          }}
                          enabled={enforceUnit}
                          title="Enforce unit/apartment"
                        >
                          {pctMissingUnit}% of validations are missing apartment numbers.
                        </SettingToggle>

                        <SettingToggle
                          action={{
                            content: autoApply ? "Disable" : "Enable",
                            onAction: async () => {
                              const next = !autoApply;
                              setAutoApply(next);
                              try {
                                const res = await fetch(endpoints.settingsUpdate(), {
                                  method: "PATCH",
                                  headers: { "content-type": "application/json", ...auth },
                                  body: JSON.stringify({ autoApplyCorrections: next }),
                                });
                                if (!res.ok) throw new Error("failed");
                                show("Auto-apply corrections updated.");
                              } catch (err) {
                                console.error(err);
                                setAutoApply(!next);
                                show("Could not save setting. Reverted.", { status: "error" });
                              }
                            }
                          }}
                          enabled={autoApply}
                          title="Auto-apply corrections"
                        >
                          Automatically adjust corrections when possible
                        </SettingToggle>
                      </FormLayout>
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
                        <Button url={`/settings${search}`} plain>Validation rules</Button>
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
