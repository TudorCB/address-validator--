import { json } from "@remix-run/node";
import AnalyticsDashboard from "../components/AnalyticsDashboard.jsx";

export const loader = async () => json({});

export default function AppIndex() {
  return <AnalyticsDashboard />;
}

