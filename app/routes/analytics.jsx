import React from "react";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, Select, InlineStack } from "@shopify/polaris";
import AppFrame from "../components/AppFrame.jsx";
import ClientOnly from "../components/ClientOnly.jsx";
const StackedAreaChartClient = React.lazy(() => import("../components/StackedAreaChart.client.jsx"));

export const loader = async ({ request }) => {
  // We’ll fetch from our own APIs client-side to reuse session token; loader just renders shell
  return json({});
};

function Kpi({ title, value, subtle }) {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <Text as="h3" variant="headingMd">{title}</Text>
        <div style={{ fontSize: 28, fontWeight: 600, marginTop: 6 }}>{value}</div>
        {subtle ? <div style={{ color: "#616161", marginTop: 4 }}>{subtle}</div> : null}
      </div>
    </Card>
  );
}

function InsightCard({ insight }) {
  const levelColor = insight.severity === "high" ? "#D82C0D" : insight.severity === "medium" ? "#8A6116" : "#006FBB";
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <Text as="h3" variant="headingMd" color="inherit">{insight.title}</Text>
        <div style={{ marginTop: 6, color: levelColor, fontWeight: 600, fontSize: 12, letterSpacing: .3, textTransform: "uppercase" }}>
          {insight.severity} priority
        </div>
        <div style={{ marginTop: 8, color: "#434343" }}>{insight.body}</div>
        <div style={{ marginTop: 12 }}>
          <Link to={insight.cta.href}><Button primary>{insight.cta.label}</Button></Link>
        </div>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  // Fetch with session token from client
  const [range, setRange] = React.useState("7d");
  const [segment, setSegment] = React.useState("all");

  const [summary, setSummary] = React.useState(null);
  const [insights, setInsights] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      try {
        // Attempt to include token header if available in browser context (dev stub ok)
        const headers = { authorization: "Bearer dev.stub.jwt" };
        const s = await fetch("/api/analytics/summary", { headers }).then((r) => r.json());
        const i = await fetch("/api/analytics/recommendations", { headers }).then((r) => r.json());
        setSummary(s);
        setInsights(i?.insights || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [range, segment]);

  const k = summary?.kpis || {};
  const trend = (summary?.trends || []).map((d) => ({
    name: d.day,
    values: [
      { key: "OK", value: d.ok || 0 },
      { key: "Corrected", value: d.corrected || 0 },
      { key: "Blocked", value: d.blocked || 0 },
    ],
  }));

  return (
    <AppFrame>
      <Page
        title="Analytics & Insights"
        primaryAction={{ content: "Export CSV", onAction: () => (window.location.href = "/admin/logs") }}
        secondaryActions={[
          { content: "View Logs", url: "/admin/logs" },
          { content: "Change Rules", url: "/settings" },
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
                      { label: "7 days", value: "7d" },
                      { label: "14 days", value: "14d" },
                      { label: "30 days", value: "30d" },
                    ]}
                    value={range}
                    onChange={setRange}
                  />
                  <Select
                    label="Segment"
                    options={[
                      { label: "All", value: "all" },
                      { label: "Checkout", value: "checkout" },
                      { label: "Thank-you", value: "thank_you" },
                      { label: "Customer", value: "customer_account" },
                    ]}
                    value={segment}
                    onChange={setSegment}
                  />
                </InlineStack>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section oneThird>
            <Kpi title="Total validations" value={k.totalValidations ?? 0} subtle="All sources" />
          </Layout.Section>
          <Layout.Section oneThird>
            <Kpi title="Deliverable (OK)" value={k.deliverableOk ?? 0} subtle="Passed immediately" />
          </Layout.Section>
          <Layout.Section oneThird>
            <Kpi title="Corrected" value={k.corrected ?? 0} subtle="Normalized & applied" />
          </Layout.Section>

          <Layout.Section oneThird>
            <Kpi title="Blocked" value={k.blocked ?? 0} subtle="Hard gates" />
          </Layout.Section>
          <Layout.Section oneThird>
            <Kpi title="Suggest pickup" value={k.suggestPickup ?? 0} subtle="Saved sales via pickup" />
          </Layout.Section>
          <Layout.Section oneThird>
            <Kpi
              title="Est. savings"
              value={`$${(k.estimatedSavings ?? 0).toLocaleString()}`}
              subtle="Avoided failed deliveries"
            />
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h3" variant="headingMd">
                  Validation trend
                </Text>
                <div style={{ height: 280, marginTop: 16 }}>
                  <ClientOnly>
                    <React.Suspense fallback={<div style={{color:'#616161'}}>Loading chart…</div>}>
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
                <Text as="h3" variant="headingMd">
                  Actionable insights
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  {insights.length === 0 ? (
                    <div style={{ color: "#616161" }}>
                      No insights yet — come back after more traffic.
                    </div>
                  ) : (
                    insights.map((i) => <InsightCard key={i.id} insight={i} />)
                  )}
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppFrame>
  );
}
