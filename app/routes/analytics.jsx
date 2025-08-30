import React from "react";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, Select, InlineStack } from "@shopify/polaris";
import AppFrame from "../components/AppFrame.jsx";
import ClientOnly from "../components/ClientOnly.jsx";
const StackedAreaChartClient = React.lazy(() => import("../components/StackedAreaChart.client.jsx"));

export const loader = async () => json({});

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

function InsightCard({ insight, onQuickToggle }) {
  const levelColor = insight.severity === "high" ? "#D82C0D" : insight.severity === "medium" ? "#8A6116" : "#006FBB";
  const quick = insight.quickToggle;
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <Text as="h3" variant="headingMd">{insight.title}</Text>
        <div style={{ marginTop: 6, color: levelColor, fontWeight: 600, fontSize: 12, letterSpacing: .3, textTransform: "uppercase" }}>
          {insight.severity} priority
        </div>
        <div style={{ marginTop: 8, color: "#434343" }}>{insight.body}</div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <Link to={insight.cta.href}><Button primary>{insight.cta.label}</Button></Link>
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
  const [range, setRange] = React.useState("7d");
  const [segment, setSegment] = React.useState("all");
  const [summary, setSummary] = React.useState(null);
  const [insights, setInsights] = React.useState([]);
  const [problems, setProblems] = React.useState({ topByZip: [], topByCity: [] });

  async function fetchAll() {
    const headers = { authorization: "Bearer dev.stub.jwt" };
    const s = await fetch(`/api/analytics/summary?range=${range}&segment=${segment}`, { headers }).then((r) => r.json());
    const i = await fetch(`/api/analytics/recommendations?range=${range}&segment=${segment}`, { headers }).then((r) => r.json());
    const p = await fetch(`/api/analytics/top-problems?range=${range}&segment=${segment}`, { headers }).then((r) => r.json());

    const enriched = (i?.insights || []).map((ins) => {
      if (ins.id === "po-box-policy") return { ...ins, quickToggle: { label: "Enable PO Box block", patch: { blockPoBoxes: true } } };
      if (ins.id === "auto-apply-corrections") return { ...ins, quickToggle: { label: "Enable Auto-apply", patch: { autoApplyCorrections: true } } };
      if (ins.id === "missing-unit-helper") return { ...ins, quickToggle: { label: "Soft mode OFF (enforce)", patch: { softMode: false } } };
      return ins;
    });

    setSummary(s);
    setInsights(enriched);
    setProblems({ topByZip: p?.topByZip || [], topByCity: p?.topByCity || [] });
  }

  React.useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function quickToggle(patch) {
    try {
      const res = await fetch("/api/settings/update", {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: "Bearer dev.stub.jwt" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      await fetchAll();
      alert("Setting updated.");
    } catch (e) {
      console.error(e);
      alert("Could not update setting. Check console.");
    }
  }

  return (
    <AppFrame>
      <Page
        title="Analytics & Insights"
        primaryAction={{
          content: "Export CSV",
          onAction: async () => {
            try {
              const token = "dev.stub.jwt";
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
              alert("CSV export failed.");
            }
          },
        }}
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
                  <Select label="Range" options={[{ label: "7 days", value: "7d" }, { label: "14 days", value: "14d" }, { label: "30 days", value: "30d" }]} value={range} onChange={setRange} />
                  <Select label="Segment" options={[{ label: "All", value: "all" }, { label: "Checkout", value: "checkout" }, { label: "Thank-you", value: "thank_you" }, { label: "Customer", value: "customer_account" }]} value={segment} onChange={setSegment} />
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
            <Kpi title="Est. savings" value={`$${(k.estimatedSavings ?? 0).toLocaleString()}`} subtle="Avoided failed deliveries" />
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h3" variant="headingMd">Validation trend</Text>
                <div style={{ height: 280, marginTop: 16 }}>
                  <ClientOnly>
                    <React.Suspense fallback={<div style={{ color: "#616161" }}>Loading chart…</div>}>
                      <StackedAreaChartClient isAnimated data={trend} theme="Default" xAxisOptions={{ labelFormatter: (v) => v?.slice(5) }} />
                    </React.Suspense>
                  </ClientOnly>
                </div>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h3" variant="headingMd">Actionable insights</Text>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12, marginTop: 12 }}>
                  {insights.length === 0 ? (
                    <div style={{ color: "#616161" }}>No insights yet — come back after more traffic.</div>
                  ) : (
                    insights.map((i) => <InsightCard key={i.id} insight={i} onQuickToggle={quickToggle} />)
                  )}
                </div>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <ProblemsTable title="Top problem areas — by ZIP" rows={problems.topByZip} />
          </Layout.Section>
          <Layout.Section>
            <ProblemsTable title="Top problem areas — by City" rows={problems.topByCity} />
          </Layout.Section>
        </Layout>
      </Page>
    </AppFrame>
  );
}

