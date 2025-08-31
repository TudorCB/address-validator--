import AdminLogsTable from "../components/AdminLogsTable.jsx";
import { readLogs } from "../lib/logs.js";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import AppFrame from "../components/AppFrame.jsx";
import { Page, Card } from "@shopify/polaris";

export const loader = async ({ request }) => {
  // Ensure this page is accessed within an authenticated embedded admin session
  await authenticate.admin(request);
  const logs = await readLogs({ limit: 100 });
  return json({ logs });
};

export default function AdminLogsPage() {
  const { logs } = useLoaderData();
  return (
    <AppFrame>
      <Page title="Recent Logs" subtitle="Address Validator++">
        <Card>
          <div style={{ padding: 12, color: '#616161' }}>Showing up to 100 latest entries.</div>
          <AdminLogsTable logs={logs} />
        </Card>
      </Page>
    </AppFrame>
  );
}
