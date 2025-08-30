import { Card, Text } from "@shopify/polaris";
import React from "react";

export function SkeletonKpi() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <div style={{ height: 16, width: 140, background: "#F1F2F3", borderRadius: 4 }} />
        <div style={{ height: 32, width: 110, background: "#F1F2F3", borderRadius: 6, marginTop: 8 }} />
      </div>
    </Card>
  );
}

export function SkeletonChart() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <div style={{ height: 16, width: 160, background: "#F1F2F3", borderRadius: 4, marginBottom: 12 }} />
        <div
          style={{
            height: 280,
            width: "100%",
            background: "linear-gradient(90deg,#F7F8F9 25%,#ECEEEF 37%,#F7F8F9 63%)",
            borderRadius: 8,
            animation: "pulse 1.2s ease-in-out infinite",
            backgroundSize: "400% 100%",
          }}
        />
        <style>{`@keyframes pulse{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}`}</style>
      </div>
    </Card>
  );
}

export function SkeletonCardLines({ lines = 3 }) {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <div style={{ height: 16, width: 200, background: "#F1F2F3", borderRadius: 4, marginBottom: 12 }} />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{ height: 12, width: `${80 - i * 10}%`, background: "#F6F7F8", borderRadius: 4, marginTop: 8 }} />
        ))}
      </div>
    </Card>
  );
}

