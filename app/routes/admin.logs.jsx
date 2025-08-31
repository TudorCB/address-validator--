import AdminLogsTable from "../components/AdminLogsTable.jsx";
import { readLogs } from "../lib/logs.js";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // Ensure this page is accessed within an authenticated embedded admin session
  await authenticate.admin(request);
  const logs = await readLogs({ limit: 100 });
  return json({ logs });
};

export default function AdminLogsPage() {
  const { logs } = useLoaderData();
  return (
    <div style={{ padding: 16 }}>
      <h2>Address Validator++  Recent Logs</h2>
      <p style={{ color: "#666" }}>Showing up to 100 latest entries (in-memory).</p>
      <AdminLogsTable logs={logs} />
    </div>
  );
}
