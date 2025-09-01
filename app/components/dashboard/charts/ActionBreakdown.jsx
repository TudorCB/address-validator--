import Section from "../Section.jsx";
import React from "react";

export default function ActionBreakdown({ totals }) {
  // totals = { ok, corrected, blocked, unverified, suggestPickup }
  const data = [{
    name: "Actions",
    data: [
      { key: "OK", value: totals?.ok || 0 },
      { key: "Corrected", value: totals?.corrected || 0 },
      { key: "Blocked", value: totals?.blocked || 0 },
      { key: "Unverified", value: totals?.unver || 0 },
      { key: "Suggest pickup", value: totals?.suggestPickup || 0 },
    ],
  }];

  const [BarChart, setBarChart] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    import("@shopify/polaris-viz").then((m) => {
      if (mounted) setBarChart(() => m.BarChart);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <Section title="Action breakdown">
      <div style={{ height: 240 }}>
        {BarChart ? <BarChart data={data} theme="Default" /> : null}
      </div>
    </Section>
  );
}

