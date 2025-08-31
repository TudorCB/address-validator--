import React from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text, TextField, Button, InlineStack, DataTable, Modal, Box, Banner } from "@shopify/polaris";
import AppFrame from "../components/AppFrame.jsx";

export const loader = async () => json({});

function useSessionHeaders() {
  // For now, dev stub token consistent with rest of app
  const token = "dev.stub.jwt"; // TODO: replace with real session token from App Bridge
  return React.useMemo(() => ({ authorization: `Bearer ${token}` }), [token]);
}

function validateLatLng(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || la < -90 || la > 90) return "Latitude must be between -90 and 90";
  if (!Number.isFinite(ln) || ln < -180 || ln > 180) return "Longitude must be between -180 and 180";
  return null;
}

export default function PickupsPage() {
  useLoaderData();
  const headers = useSessionHeaders();

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [name, setName] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [formError, setFormError] = React.useState(null);

  const [editing, setEditing] = React.useState(null); // { id, name, lat, lng }
  const [saving, setSaving] = React.useState(false);

  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch("/api/pickups", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Fetch failed: ${res.status}`);
      setRows(data.pickups || []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); /* eslint-disable-line */ }, []);

  async function onAdd() {
    try {
      const err = validateLatLng(lat, lng);
      if (!name.trim()) return setFormError("Name is required");
      if (err) return setFormError(err);
      setFormError(null);
      setSaving(true);
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), lat: Number(lat), lng: Number(lng) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Create failed: ${res.status}`);
      setName(""); setLat(""); setLng("");
      await refresh();
    } catch (e) {
      setFormError(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this pickup location?")) return;
    try {
      const res = await fetch(`/api/pickups/${encodeURIComponent(id)}`, { method: "DELETE", headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Delete failed: ${res.status}`);
      await refresh();
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  async function onSaveEdit() {
    try {
      const err = validateLatLng(editing.lat, editing.lng);
      if (!editing.name.trim()) return setFormError("Name is required");
      if (err) return setFormError(err);
      setFormError(null);
      setSaving(true);
      const res = await fetch(`/api/pickups/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ name: editing.name.trim(), lat: Number(editing.lat), lng: Number(editing.lng) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Update failed: ${res.status}`);
      setEditing(null);
      await refresh();
    } catch (e) {
      setFormError(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  const tableRows = rows.map((r) => [r.name, String(r.lat), String(r.lng),
    <InlineStack key={r.id} gap="200">
      <Button onClick={() => setEditing({ ...r })}>Edit</Button>
      <Button tone="critical" onClick={() => onDelete(r.id)}>Delete</Button>
    </InlineStack>
  ]);

  return (
    <AppFrame>
      <Page title="Pickup Locations" subtitle="Manage store pickup points used for suggestions">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h3" variant="headingMd">Add Pickup Location</Text>
                <div style={{ marginTop: 12 }}>
                  <InlineStack gap="300" wrap={false}>
                    <TextField label="Name" value={name} onChange={setName} autoComplete="off" />
                    <TextField label="Latitude" type="number" value={lat} onChange={setLat} autoComplete="off" />
                    <TextField label="Longitude" type="number" value={lng} onChange={setLng} autoComplete="off" />
                    <div style={{ display: "flex", alignItems: "end" }}>
                      <Button variant="primary" loading={saving} onClick={onAdd}>Add</Button>
                    </div>
                  </InlineStack>
                  {formError ? (
                    <Box paddingBlockStart="200"><Banner status="critical" title={formError} /></Box>
                  ) : null}
                </div>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: 16 }}>
                <Text as="h3" variant="headingMd">Locations</Text>
                <div style={{ marginTop: 12 }}>
                  {error ? (
                    <Banner status="critical" title={String(error)} />
                  ) : null}
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric", "text"]}
                    headings={["Name", "Latitude", "Longitude", "Actions"]}
                    rows={loading ? [] : tableRows}
                    footerContent={loading ? "Loading..." : `${rows.length} locations`}
                  />
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>

        <Modal
          open={!!editing}
          onClose={() => { setEditing(null); setFormError(null); }}
          title="Edit Pickup Location"
          primaryAction={{ content: "Save", onAction: onSaveEdit, loading: saving }}
          secondaryActions={[{ content: "Cancel", onAction: () => setEditing(null) }]}
        >
          <Modal.Section>
            {editing ? (
              <InlineStack gap="300" wrap>
                <TextField label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
                <TextField label="Latitude" type="number" value={String(editing.lat)} onChange={(v) => setEditing({ ...editing, lat: v })} />
                <TextField label="Longitude" type="number" value={String(editing.lng)} onChange={(v) => setEditing({ ...editing, lng: v })} />
              </InlineStack>
            ) : null}
            {formError ? <Box paddingBlockStart="200"><Banner status="critical" title={formError} /></Box> : null}
          </Modal.Section>
        </Modal>
      </Page>
    </AppFrame>
  );
}

