import React from "react";
import { json } from "@remix-run/node";
import AppFrame from "../components/AppFrame.jsx";
import AnalyticsDashboard from "../components/AnalyticsDashboard.jsx";

export const loader = async () => json({});

export default function AnalyticsPreviewRoute() {
  return (
    <AppFrame>
      <AnalyticsDashboard />
    </AppFrame>
  );
}

