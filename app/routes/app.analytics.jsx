import { json } from "@remix-run/node";
import { Page, Layout } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import React from "react";

import MetricCard from "../components/dashboard/MetricCard.jsx";
import FilterBar from "../components/dashboard/FilterBar.jsx";
import ProviderHealthCard from "../components/dashboard/ProviderHealthCard.jsx";
import SavingsCard from "../components/dashboard/SavingsCard.jsx";
import TopProblemsTable from "../components/dashboard/TopProblemsTable.jsx";
import InsightsGrid from "../components/dashboard/InsightsGrid.jsx";
import StackedTrend from "../components/dashboard/charts/StackedTrend.jsx";
import ActionBreakdown from "../components/dashboard/charts/ActionBreakdown.jsx";

import { SkeletonKpi, SkeletonChart, SkeletonCardLines } from "../components/Skeletons.jsx";
import { EmptyAnalytics, EmptyProblems } from "../components/EmptyStates.jsx";

export const loader = async () => json({}); // embedded; client fetches with token

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [range, setRange] = React.useState("7d");
  const [segment, setSegment] = React.useState("all");

  const [isLoading, setIsLoading] = React.useState(true);
  const [hasData, setHasData] = React.useState(false);

  const [summary, setSummary] = React.useState(null);
  const [insights, setInsights] = React.useState([]);
  const [problems, setProblems] = React.useState({ topByZip: [], topByCity: [] });
  const [health, setHealth] = React.useState({});

  const tokenHeader = { authorization: "Bearer dev.stub.jwt" }; // TODO: replace with App Bridge token

  async function fetchAll() {
    try {
      setIsLoading(true);
      const q = `?range=${range}&segment=${segment}`;
      const [s, i, p, h] = await Promise.all([
        fetch(`/api/analytics.summary${q}`, { headers: tokenHeader }).then(r => r.json()),
        fetch(`/api/analytics.recommendations${q}`, { headers: tokenHeader }).then(r => r.json()),
        fetch(`/api/analytics.top-problems${q}`, { headers: tokenHeader }).then(r => r.json()),
        fetch(`/api/analytics.providers`, { headers: tokenHeader }).then(r => r.json()).catch(() => ({})),
      ]);

      // attach quick toggles to relevant insights
      const enriched = (i?.insights || []).map(ins => {
        if (ins.id === "po-box-policy") return { ...ins, quickToggle: { label: "Enable PO Box block", patch: { blockPoBoxes: true } } };
        if (ins.id === "auto-apply-corrections") return { ...ins, quickToggle: { label: "Enable Auto-apply", patch: { autoApplyCorrections: true } } };
        if (ins.id === "missing-unit-helper") return { ...ins, quickToggle: { label: "Turn OFF Soft Mode", patch: { softMode: false } } };
        return ins;
      });

      setSummary(s);
      setInsights(enriched);
      setProblems({ topByZip: p?.topByZip || [], topByCity: p?.topByCity || [] });
      setHealth(h);

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
  const trend = (summary?.trends || []).map(d => ({
    name: d.day,
    values: [
      { key: "OK", value: d.ok || 0 },
      { key: "Corrected", value: d.corrected || 0 },
      { key: "Blocked", value: d.blocked || 0 },
    ],
  }));

  async function quickToggle(patch) {
    try {
      const res = await fetch("/api/settings.update", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...tokenHeader },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Could not update setting.");
    }
  }

  async function exportCsv() {
    try {
      const url = `/admin/logs.csv?range=${range}&segment=${segment}`;
      const res = await fetch(url, { headers: tokenHeader });
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

  return (
    <Page
      title="Insights & Solutions"
      subtitle="A minimalist, focused view into deliverability quality and actions."
      primaryAction={{ content: "Export CSV", onAction: exportCsv }}
      secondaryActions={[
        { content: "View Logs", onAction: () => navigate("/admin/logs") },
        { content: "Change Rules", onAction: () => navigate("/settings") }
      ]}
    >
      <Layout>

        <Layout.Section>
          <FilterBar range={range} setRange={setRange} segment={segment} setSegment={setSegment} />
        </Layout.Section>

        {isLoading ? (
          <>
            <Layout.Section oneThird><SkeletonKpi /></Layout.Section>
            <Layout.Section oneThird><SkeletonKpi /></Layout.Section>
            <Layout.Section oneThird><SkeletonKpi /></Layout.Section>

            <Layout.Section><SkeletonChart /></Layout.Section>
            <Layout.Section oneHalf><SkeletonCardLines /></Layout.Section>
            <Layout.Section oneHalf><SkeletonCardLines /></Layout.Section>
          </>
        ) : null}

        {!isLoading && !hasData ? (
          <>
            <Layout.Section>
              <EmptyAnalytics onGoToSettings={() => navigate("/settings")} />
            </Layout.Section>
            <Layout.Section>
              <EmptyProblems />
            </Layout.Section>
          </>
        ) : null}

        {!isLoading && hasData ? (
          <>
            {/* KPI Row */}
            <Layout.Section oneThird>
              <MetricCard title="Total validations" value={k.totalValidations ?? 0} help="All checks across sources." />
            </Layout.Section>
            <Layout.Section oneThird>
              <MetricCard title="OK (deliverable)" value={k.deliverableOk ?? 0} help="Passed without intervention." />
            </Layout.Section>
            <Layout.Section oneThird>
              <MetricCard title="Corrected" value={k.corrected ?? 0} help="Normalized & applied." />
            </Layout.Section>

            {/* Trend + Breakdown */}
            <Layout.Section>
              <StackedTrend series={trend} />
            </Layout.Section>
            <Layout.Section oneHalf>
              <ActionBreakdown totals={{
                ok: k.deliverableOk ?? 0,
                corrected: k.corrected ?? 0,
                blocked: k.blocked ?? 0,
                unver: k.unver ?? 0,
                suggestPickup: k.suggestPickup ?? 0
              }} />
            </Layout.Section>
            <Layout.Section oneHalf>
              <SavingsCard estimatedSavings={k.estimatedSavings} failedDeliveryCostUsd={summary?.kpis?.failedDeliveryCostUsd ?? 12} />
            </Layout.Section>

            {/* Insights */}
            <Layout.Section>
              <InsightsGrid insights={insights} onQuickToggle={quickToggle} />
            </Layout.Section>

            {/* Provider health + Top problems */}
            <Layout.Section oneThird>
              <ProviderHealthCard health={health} />
            </Layout.Section>
            <Layout.Section twoThird>
              <TopProblemsTable topByZip={problems.topByZip} topByCity={problems.topByCity} />
            </Layout.Section>
          </>
        ) : null}
      </Layout>
    </Page>
  );
}
