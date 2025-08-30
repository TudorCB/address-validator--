import assert from "node:assert/strict";

async function run() {
  const payload = {
    customerLocation: { lat: 33.749, lng: -84.388 },
    pickupLocations: [
      { lat: 33.76, lng: -84.39, name: "Midtown" },
      { lat: 33.70, lng: -84.40, name: "South" }
    ]
  };
  const res = await fetch("http://localhost:3000/api/pickup-distance-check", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer dev.stub.jwt" },
    body: JSON.stringify(payload)
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, "ok");
  assert.ok(json.nearest);
  console.log("[pickup-distance] nearest ->", json.nearest?.name, json.nearest?.distanceKm);
}

run().catch((e) => { console.error(e); process.exit(1); });

