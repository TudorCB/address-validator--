import Section from "../Section.jsx";
import React from "react";

// Client-safe lazy load of Polaris Viz to avoid SSR issues
export default function StackedTrend({ series }) {
  const [Chart, setChart] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    import("@shopify/polaris-viz").then((m) => {
      if (mounted) setChart(() => m.StackedAreaChart);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <Section title="Validation trend">
      <div style={{ height: 280 }}>
        {Chart ? (
          <Chart
            isAnimated
            data={series || []}
            theme="Default"
            xAxisOptions={{ labelFormatter: (v) => v?.slice(5) }}
          />
        ) : null}
      </div>
    </Section>
  );
}

