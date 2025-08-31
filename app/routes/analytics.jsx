import { json } from "@remix-run/node";
import { Page, Layout, Card, Text, Button, Select, InlineStack } from "@shopify/polaris";
import { useNavigate, useLocation } from "@remix-run/react";
import AppFrame from "../components/AppFrame.jsx";
import React from "react";
import ClientOnly from "../components/ClientOnly.jsx";
import { SkeletonKpi, SkeletonChart, SkeletonCardLines } from "../components/Skeletons.jsx";
import { EmptyAnalytics, EmptyProblems } from "../components/EmptyStates.jsx";
const StackedAreaChartClient = React.lazy(() => import("../components/StackedAreaChart.client.jsx"));
import { t } from "../lib/i18n.js";
import { endpoints } from "../lib/api-endpoints.js";
import { getAuthorizationHeader } from "../lib/admin-auth.client.js";
import { getAuthorizationHeader } from "../lib/admin-auth.client.js";

export const loader = async () => json({});

function Kpi({ title, value, help }) {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text as="h3" variant="headingMd">{title}</Text>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, marginTop: 6 }}>{value}</div>
        {help ? <div style={{ color: "#616161", marginTop: 4 }}>{help}</div> : null}
      </div>
    </Card>
  );
}

function InsightCard({ insight, onQuickToggle }) {
  const levelColor = insight.severity === "high" ? "#D82C0D" : insight.severity === "medium" ? "#8A6116" : "#006FBB";
  const quick = insight.quickToggle; // { label, patch } optional

  return (
    <Card>
      <div style={{ padding: 16 }}>
        <Text as="h3" variant="headingMd">{insight.title}</Text>
        <div style={{ marginTop: 6, color: levelColor, fontWeight: 600, fontSize: 12, letterSpacing: .3, textTransform: "uppercase" }}>
          {insight.severity} priority
        </div>
        <div style={{ marginTop: 8, color: "#434343", lineHeight: 1.5 }}>{insight.body}</div>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={insight.cta.href}><Button primary>{insight.cta.label}</Button></a>
          {quick ? <Button onClick={() => onQuickToggle(quick.patch)}>{quick.label}</Button> : null}
        </div>
      </div>
    </Card>
  );
}

function ProblemsTable({ title, rows }) {
  const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" };
  const td = { borderBottom: "1px solid #eee", padding: "8px", verticalAlign: "top" };
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <Text as="h3" variant="headingMd">{title}</Text>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Key</th>
                <th style={th}>Total</th>
                <th style={th}>Blocked</th>
                <th style={th}>Missing Unit</th>
                <th style={th}>PO Box</th>
                <th style={th}>Corrected</th>
                <th style={th}>Unverified</th>
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((r) => (
                <tr key={r.key}>
                  <td style={td}>{r.key}</td>
                  <td style={td}>{r.total}</td>
                  <td style={td}>{r.blocked}</td>
                  <td style={td}>{r.missingUnit}</td>
                  <td style={td}>{r.poBox}</td>
                  <td style={td}>{r.corrected}</td>
                  <td style={td}>{r.unverified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [range, setRange] = React.useState("7d");
  const [segment, setSegment] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasData, setHasData] = React.useState(false);
  const [summary, setSummary] = React.useState(null);
  const [insights, setInsights] = React.useState([]);
  const [problems, setProblems] = React.useState({ topByZip: [], topByCity: [] });
  const [providerMetrics, setProviderMetrics] = React.useState(null);

  async function fetchAll() {
    try {
      setIsLoading(true);
      const headers = await getAuthorizationHeader();
      const [s, i, p, pm] = await Promise.all([
        fetch(endpoints.analyticsSummary({ range, segment }), { headers }).then(r => r.json()),
        fetch(endpoints.analyticsRecommendations({ range, segment }), { headers }).then(r => r.json()),
        fetch(endpoints.analyticsTopProblems({ range, segment }), { headers }).then(r => r.json()),
        fetch(endpoints.analyticsProviders(), { headers }).then(r => r.json()),
      ]);

      // attach quick toggles
      const enriched = (i?.insights || []).map(ins => {
        if (ins.id === "po-box-policy") return { ...ins, quickToggle: { label: t("insights.quick.enable_po_box_block"), patch: { blockPoBoxes: true } } };
        if (ins.id === "auto-apply-corrections") return { ...ins, quickToggle: { label: t("insights.quick.enable_auto_apply"), patch: { autoApplyCorrections: true } } };
        if (ins.id === "missing-unit-helper") return { ...ins, quickToggle: { label: t("insights.quick.turn_off_soft_mode"), patch: { softMode: false } } };
        return ins;
      });

      setSummary(s);
      setInsights(enriched);
      setProblems({ topByZip: p?.topByZip || [], topByCity: p?.topByCity || [] });
      setProviderMetrics(pm || null);
      const total = s?.kpis?.totalValidations ?? 0;
      setHasData(total > 0);
    } catch (e) {
      console.error(e);
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [range, segment]);

  const k = summary?.kpis || {};
  const days = Array.isArray(summary?.trends) ? summary.trends : [];
  const trend = [
    { name: "OK", data: days.map(d => ({ key: d.day, value: d.ok || 0 })) },
    { name: "Corrected", data: days.map(d => ({ key: d.day, value: d.corrected || 0 })) },
    { name: "Blocked", data: days.map(d => ({ key: d.day, value: d.blocked || 0 })) },
  ];

  async function quickToggle(patch) {
    try {
      const res = await fetch(endpoints.settingsUpdate(), {
        method: "PATCH",
        headers: { "content-type": "application/json", ...(await getAuthorizationHeader()) },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      await fetchAll();
      alert("Setting updated.");
    } catch (e) {
      console.error(e);
      alert("Could not update setting. See console.");
    }
  }

  return (
    <AppFrame>
      <Page
        title={t("analytics.title")}
        subtitle={t("analytics.subtitle")}
        primaryAction={{
          content: t("analytics.export_csv"),
          onAction: async () => {
            try {
              const auth = await getAuthorizationHeader();
              const url = `/admin/logs/csv?range=${range}&segment=${segment}`;
              const res = await fetch(url, { headers: auth });
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
              alert("CSV export failed.");
            }
          }
        }}
        secondaryActions={[
          { content: t("analytics.view_logs"), onAction: () => navigate(`/admin/logs${location.search || ""}`) },
          { content: t("analytics.change_rules"), onAction: () => navigate(`/settings${location.search || ""}`) }
        ]}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: 12 }}>
                <InlineStack gap="400" wrap={false}>
                  <Select
                    label="Range"
                    options={[
                      {label:"7 days",value:"7d"},
                      {label:"14 days",value:"14d"},
                      {label:"30 days",value:"30d"}
                    ]}
                    value={range}
                    onChange={setRange}
                  />
                  <Select
                    label="Segment"
                    options={[
                      {label:"All",value:"all"},
                      {label:"Checkout",value:"checkout"},
                      {label:"Thank-you",value:"thank_you"},
                      {label:"Customer",value:"customer_account"}
                    ]}
                    value={segment}
                    onChange={setSegment}
                  />
                </InlineStack>
              </div>
            </Card>
          </Layout.Section>

          {isLoading ? (
            <>
              <Layout.Section oneThird><SkeletonKpi /></Layout.Section>
              <Layout.Section oneThird><SkeletonKpi /></Layout.Section>
              <Layout.Section oneThird><SkeletonKpi /></Layout.Section>

              <Layout.Section oneThird><SkeletonKpi /></Layout.Section>
              <Layout.Section oneThird><SkeletonKpi /></Layout.Section>
              <Layout.Section oneThird><SkeletonKpi /></Layout.Section>

              <Layout.Section><SkeletonChart /></Layout.Section>
              <Layout.Section><SkeletonCardLines lines={4} /></Layout.Section>
              <Layout.Section><SkeletonCardLines lines={4} /></Layout.Section>
            </>
          ) : null}

          {!isLoading && !hasData ? (
            <>
              <Layout.Section>
                <EmptyAnalytics
                  onGoToSettings={() => navigate("/settings")}
                  onGoToDocs={() => window.open("https://help.shopify.com/en/manual", "_blank")}
                />
              </Layout.Section>
              <Layout.Section>
                <EmptyProblems />
              </Layout.Section>
            </>
          ) : null}

          {!isLoading && hasData ? (
            <>
              {/* Provider health widget */}
              <Layout.Section oneThird>
                <Card>
                  <div style={{ padding: 16 }}>
                    <Text as="h3" variant="headingMd">Provider health</Text>
                    {providerMetrics ? (
                      <div style={{ marginTop: 8, color: "#434343" }}>
                        {(() => {
                          const ok = providerMetrics?.provider?.ok || 0;
                          const fail = providerMetrics?.provider?.fail || 0;
                          const total = ok + fail;
                          const successRate = total ? Math.round((ok / total) * 100) : 100;
                          const fallbackRate = total ? Math.round((fail / total) * 100) : 0;
                          const p50 = providerMetrics?.provider?.p50;
                          return (
                            <div>
                              <div><b>Success rate:</b> {successRate}%</div>
                              <div><b>p50 latency:</b> {p50 != null ? `${p50} ms` : "n/a"}</div>
                              <div><b>Fallback rate:</b> {fallbackRate}%</div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, color: "#616161" }}>{t("analytics.no_provider_data")}</div>
                    )}
                  </div>
                </Card>
              </Layout.Section>
              <Layout.Section oneThird>
                <Kpi title={t("analytics.kpi.total")} value={k.totalValidations ?? 0} help={t("analytics.kpi.total_help")} />
              </Layout.Section>
              <Layout.Section oneThird>
                <Kpi title={t("analytics.kpi.ok")} value={k.deliverableOk ?? 0} help={t("analytics.kpi.ok_help")} />
              </Layout.Section>
              <Layout.Section oneThird>
                <Kpi title={t("analytics.kpi.corrected")} value={k.corrected ?? 0} help={t("analytics.kpi.corrected_help")} />
              </Layout.Section>

              <Layout.Section oneThird>
                <Kpi title={t("analytics.kpi.blocked")} value={k.blocked ?? 0} help={t("analytics.kpi.blocked_help")} />
              </Layout.Section>
              <Layout.Section oneThird>
                <Kpi title={t("analytics.kpi.suggest_pickup")} value={k.suggestPickup ?? 0} help={t("analytics.kpi.suggest_pickup_help")} />
              </Layout.Section>
              <Layout.Section oneThird>
                <Kpi title={t("analytics.kpi.savings")} value={`$${(k.estimatedSavings ?? 0).toLocaleString()}`} help="Rough savings from prevented failed deliveries." />
              </Layout.Section>

              <Layout.Section>
                <Card>
                  <div style={{ padding: 16 }}>
                    <Text as="h3" variant="headingMd">Validation trend</Text>
                    <div style={{ height: 280, marginTop: 16 }}>
                      <ClientOnly>
                        <React.Suspense fallback={<div style={{ color: "#616161" }}>{t("analytics.loading_chart")}</div>}>
                          <StackedAreaChartClient
                            isAnimated
                            data={trend}
                            theme="Default"
                            xAxisOptions={{ labelFormatter: (v) => v?.slice(5) }}
                          />
                        </React.Suspense>
                      </ClientOnly>
                    </div>
                  </div>
                </Card>
              </Layout.Section>

              <Layout.Section>
                <Card>
                  <div style={{ padding: 16 }}>
                    <Text as="h3" variant="headingMd">{t("analytics.actionable_insights")}</Text>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12, marginTop: 12 }}>
                      {(insights || []).length === 0 ? (
                        <div style={{ color: "#616161" }}>{t("analytics.no_insights")}</div>
                      ) : (
                        (insights || []).map(i => (
                          <InsightCard
                            key={i.id}
                            insight={i}
                            onQuickToggle={async (patch) => {
                              try {
                                const res = await fetch(endpoints.settingsUpdate(), {
                                  method: "PATCH",
                                  headers: { "content-type": "application/json", ...(await getAuthorizationHeader()) },
                                  body: JSON.stringify(patch),
                                });
                                if (!res.ok) throw new Error("toggle failed");
                                await fetchAll();
                              } catch (e) {
                                console.error(e);
                                alert("Could not update setting. See console.");
                              }
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </Layout.Section>

              <Layout.Section>
                <ProblemsTable title="Top problem areas - by ZIP" rows={problems.topByZip} />
              </Layout.Section>
              <Layout.Section>
                <ProblemsTable title="Top problem areas - by City" rows={problems.topByCity} />
              </Layout.Section>
            </>
          ) : null}
        </Layout>
      </Page>
    </AppFrame>
  );
}
