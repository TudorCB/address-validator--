import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Page, Layout, Card, Text } from "@shopify/polaris";
import AppFrame from "../components/AppFrame.jsx";
import AdminLogsTable from "../components/AdminLogsTable.jsx";
import { readLogs } from "../lib/logs.js";
import { getSettings } from "../lib/settings.js";

export const loader = async () => {
  const logs = readLogs({ limit: 50 });
  const settings = getSettings();
  return json({ logs, settings });
};

export default function DashboardPage() {
  const { logs, settings } = useLoaderData();

  return (
    <AppFrame>
      <Page title="Address Validator++">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h2" variant="headingMd">Overview</Text>
                <div style={{ marginTop: 12, color: "#616161" }}>
                  Current settings: pickup radius <b>{settings.pickupRadiusKm} km</b>, PO Boxes <b>{settings.blockPoBoxes ? "blocked" : "allowed"}</b>.
                  &nbsp;<Link to="/settings">Edit settings</Link>
                </div>
              </div>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h2" variant="headingMd">Recent validations</Text>
                <div style={{ marginTop: 12 }}>
                  <AdminLogsTable logs={logs} />
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppFrame>
  );
}
