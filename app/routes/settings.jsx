import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, Form, useSubmit, useFetcher } from "@remix-run/react";
import { Page, Layout, Card, Text, TextField, Checkbox, Button, Banner, InlineStack } from "@shopify/polaris";
import AppFrame from "../components/AppFrame.jsx";
import { getSettings, updateSettings } from "../lib/settings.js";

export const loader = async () => {
  return json({ settings: getSettings() });
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const radiusStr = form.get("pickupRadiusKm");
  const blockPoBoxesStr = form.get("blockPoBoxes");
  const autoApplyCorrectionsStr = form.get("autoApplyCorrections");
  const softModeStr = form.get("softMode");

  const radius = Number(radiusStr);
  const blockPoBoxes = blockPoBoxesStr === "on" || blockPoBoxesStr === "true";
  const autoApplyCorrections = autoApplyCorrectionsStr === "on" || autoApplyCorrectionsStr === "true";
  const softMode = softModeStr === "on" || softModeStr === "true";

  updateSettings({
    pickupRadiusKm: isNaN(radius) ? undefined : radius,
    blockPoBoxes,
    autoApplyCorrections,
    softMode,
  });

  return redirect("/settings?saved=1");
};

export default function SettingsPage() {
  const { settings } = useLoaderData();
  const result = useActionData();
  const fetcher = useFetcher();

  // Local state via uncontrolled refs through Polaris TextField "defaultValue"
  // We'll build a small payload on click.
  function testRadius() {
    const payload = {
      // Customer test location (input values read from DOM for simplicity)
      customerLocation: {
        lat: parseFloat(document.getElementById("test-lat").value),
        lng: parseFloat(document.getElementById("test-lng").value),
      },
      pickupLocations: [
        {
          name: document.getElementById("p1-name").value,
          lat: parseFloat(document.getElementById("p1-lat").value),
          lng: parseFloat(document.getElementById("p1-lng").value),
        },
        {
          name: document.getElementById("p2-name").value,
          lat: parseFloat(document.getElementById("p2-lat").value),
          lng: parseFloat(document.getElementById("p2-lng").value),
        },
        {
          name: document.getElementById("p3-name").value,
          lat: parseFloat(document.getElementById("p3-lat").value),
          lng: parseFloat(document.getElementById("p3-lng").value),
        },
      ],
      // radiusKm omitted to use current app setting by default
    };

    fetcher.submit(
      { _json: JSON.stringify(payload) },
      { method: "post", action: "/api/pickup-distance-check", encType: "application/json" }
    );
  }

  // Because fetcher with encType json isn't automatic, we hook submit manually:
  // Provide a small wrapper so action sees JSON.
  const originalSubmit = fetcher.submit;
  fetcher.submit = (body, opts = {}) => {
    if (opts?.encType === "application/json" && body && typeof body._json === "string") {
      return fetch("/api/pickup-distance-check", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer dev.stub.jwt" },
        body: body._json,
      }).then(async (r) => {
        const j = await r.json();
        fetcher.data = j;
        fetcher.state = "idle";
        fetcher.type = "done";
        // force re-render
        document.dispatchEvent(new Event("visibilitychange"));
      }).catch((e) => {
        console.error(e);
      });
    }
    return originalSubmit(body, opts);
  };

  const preview = fetcher.data;

  const level =
    preview?.status !== "ok" ? "critical"
    : preview?.inRange ? "success"
    : "warning";

  return (
    <AppFrame>
      <Page title="Settings">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h2" variant="headingMd">Validation Rules</Text>
                <Form method="post">
                  <div style={{ display: "grid", gap: 16, maxWidth: 520, marginTop: 16 }}>
                    <TextField
                      label="Pickup radius (km)"
                      name="pickupRadiusKm"
                      type="number"
                      min={0}
                      defaultValue={String(settings.pickupRadiusKm)}
                      autoComplete="off"
                    />
                    <Checkbox
                      label="Block PO Boxes for shipping"
                      name="blockPoBoxes"
                      defaultChecked={settings.blockPoBoxes}
                    />
                    <Checkbox
                      label="Auto-apply suggested corrections at checkout"
                      name="autoApplyCorrections"
                      defaultChecked={settings.autoApplyCorrections}
                    />
                    <Checkbox
                      label="Soft mode (never block checkout — warnings only)"
                      name="softMode"
                      defaultChecked={settings.softMode}
                    />
                    <div>
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

          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h2" variant="headingMd">Pickup Radius Gate — Preview</Text>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)", marginTop: 12 }}>
                  <TextField label="Customer lat" id="test-lat" autoComplete="off" defaultValue="33.749" />
                  <TextField label="Customer lng" id="test-lng" autoComplete="off" defaultValue="-84.388" />
                  <div style={{ alignSelf: "end", color: " #616161" }}>Using app setting radius: <b>{settings.pickupRadiusKm} km</b></div>
                </div>

                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)", marginTop: 16 }}>
                  <TextField label="Pickup #1 name" id="p1-name" autoComplete="off" defaultValue="Midtown" />
                  <TextField label="Pickup #1 lat" id="p1-lat" autoComplete="off" defaultValue="33.760" />
                  <TextField label="Pickup #1 lng" id="p1-lng" autoComplete="off" defaultValue="-84.390" />
                </div>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)", marginTop: 8 }}>
                  <TextField label="Pickup #2 name" id="p2-name" autoComplete="off" defaultValue="South" />
                  <TextField label="Pickup #2 lat" id="p2-lat" autoComplete="off" defaultValue="33.700" />
                  <TextField label="Pickup #2 lng" id="p2-lng" autoComplete="off" defaultValue="-84.400" />
                </div>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)", marginTop: 8 }}>
                  <TextField label="Pickup #3 name" id="p3-name" autoComplete="off" defaultValue="North" />
                  <TextField label="Pickup #3 lat" id="p3-lat" autoComplete="off" defaultValue="33.820" />
                  <TextField label="Pickup #3 lng" id="p3-lng" autoComplete="off" defaultValue="-84.380" />
                </div>

                <div style={{ marginTop: 16 }}>
                  <InlineStack gap="400">
                    <Button onClick={testRadius} primary>Test radius</Button>
                  </InlineStack>
                </div>

                {preview ? (
                  <div style={{ marginTop: 16 }}>
                    <Banner status={level} title={preview.inRange ? "In range" : "Out of range"}>
                      <div>
                        <div>Nearest: <b>{preview?.nearest?.name || "—"}</b></div>
                        <div>Distance: {typeof preview?.distanceKm === "number" ? `${preview.distanceKm.toFixed(2)} km` : "—"}</div>
                        <div>Radius: {preview?.radiusKm} km</div>
                        <div style={{ color: "#616161", marginTop: 6 }}>{preview?.message || ""}</div>
                      </div>
                    </Banner>
                  </div>
                ) : null}
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppFrame>
  );
}
