import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, Form } from "@remix-run/react";
import { Page, Layout, Card, Text, TextField, Checkbox, Button } from "@shopify/polaris";
import AppFrame from "../components/AppFrame.jsx";
import { getSettings, updateSettings } from "../lib/settings.js";

export const loader = async () => {
  return json({ settings: getSettings() });
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const radiusStr = form.get("pickupRadiusKm");
  const blockPoBoxesStr = form.get("blockPoBoxes");
  const radius = Number(radiusStr);
  const blockPoBoxes = blockPoBoxesStr === "on" || blockPoBoxesStr === "true";
  updateSettings({ pickupRadiusKm: isNaN(radius) ? undefined : radius, blockPoBoxes });
  return redirect("/settings?saved=1");
};

export default function SettingsPage() {
  const { settings } = useLoaderData();
  const result = useActionData();

  return (
    <AppFrame>
      <Page title="Settings">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h2" variant="headingMd">Validation Rules</Text>
                <Form method="post">
                  <div style={{ display: "grid", gap: 16, maxWidth: 480, marginTop: 16 }}>
                    <TextField
                      label="Pickup radius (km)"
                      name="pickupRadiusKm"
                      type="number"
                      min={0}
                      defaultValue={String(settings.pickupRadiusKm)}
                      autoComplete="off"
                    />
                    <div>
                      <Checkbox
                        label="Block PO Boxes for shipping"
                        name="blockPoBoxes"
                        defaultChecked={settings.blockPoBoxes}
                      />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Button submit primary>Save</Button>
                    </div>
                  </div>
                </Form>
                {result?.error ? (
                  <div style={{ marginTop: 12, color: "crimson" }}>{result.error}</div>
                ) : null}
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppFrame>
  );
}

