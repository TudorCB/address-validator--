// Smoke tests for DPV providers. Run the server and execute:
//   node tests/dpv.providers.smoke.js
// Ensure DPV_PROVIDER and credentials are set in the environment.

const ENDPOINT = process.env.VAL_ENDPOINT || "http://localhost:3000/api/validate-address";
const AUTH = process.env.VAL_AUTH || "Bearer dev.stub.jwt";

async function validate(address) {
  const body = {
    context: { source: "checkout", shopDomain: "dev-shop.myshopify.com" },
    address,
    options: {},
  };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: AUTH },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function run() {
  const cases = [
    {
      name: "PO Box",
      address: { address1: "PO Box 123", address2: "", city: "Atlanta", province: "GA", zip: "30303", country: "US" },
    },
    {
      name: "Missing unit",
      address: { address1: "123 Main St", address2: "", city: "Brooklyn", province: "NY", zip: "11201", country: "US" },
    },
    {
      name: "Good single-family",
      address: { address1: "1600 Amphitheatre Pkwy", address2: "", city: "Mountain View", province: "CA", zip: "94043", country: "US" },
    },
  ];

  for (const c of cases) {
    const { status, json } = await validate(c.address);
    console.log(`[${c.name}] -> HTTP ${status}`, json.action, json.dpvFlags, json.providerResponseId);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });

