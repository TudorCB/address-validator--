import { json, redirect } from "@remix-run/node";
import AnalyticsDashboard from "../components/AnalyticsDashboard.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  // When loaded from Shopify Admin, redirect into the embedded /app layout
  if (url.searchParams.get("shop") || url.searchParams.get("host")) {
    return redirect(`/app/${url.search}`);
  }
  return json({});
};

export default function DashboardPage() {
  return (
    <AnalyticsDashboard />
  );
}
