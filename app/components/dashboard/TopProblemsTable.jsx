import { Text, Tabs } from "@shopify/polaris";
import Section from "./Section.jsx";
import React from "react";

function Table({ rows }) {
  const th = { textAlign: "left", borderBottom: "1px solid #eee", padding: "8px" };
  const td = { borderBottom: "1px solid #f3f3f3", padding: "8px", verticalAlign: "top" };
  return (
    <div style={{ overflowX: "auto" }}>
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
  );
}

export default function TopProblemsTable({ topByZip, topByCity }) {
  const [tab, setTab] = React.useState(0);
  const tabs = [
    { id: "zip", content: "By ZIP", panelID: "zip-panel" },
    { id: "city", content: "By City", panelID: "city-panel" },
  ];
  return (
    <Section title="Top problem areas">
      <Tabs tabs={tabs} selected={tab} onSelect={setTab}>
        <div id={tabs[tab].panelID} style={{ marginTop: 12 }}>
          {tab === 0 ? <Table rows={topByZip} /> : <Table rows={topByCity} />}
        </div>
      </Tabs>
    </Section>
  );
}

