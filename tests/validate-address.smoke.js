import assert from "node:assert/strict";

async function run() {
  const payload = {
    context: { source: "checkout", shopDomain: "dev-shop.myshopify.com" },
    address: { address1: "123 Main St", city: "Atlanta", zip: "30303", country: "US" },
    options: { allowPickupFallback: true }
  };
  const res = await fetch("http://localhost:3000/api/validate-address", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer dev.stub.jwt" },
    body: JSON.stringify(payload)
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, "ok");
  assert.ok(json.action);
  console.log("[validate-address] OK ->", json.action);
}

run().catch((e) => { console.error(e); process.exit(1); });

