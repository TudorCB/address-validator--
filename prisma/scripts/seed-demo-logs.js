/**
 * Seed realistic demo data for Address Validator++.
 * - Creates per-shop settings (optional)
 * - Creates pickup locations
 * - Generates validation logs across actions and segments
 *
 * USAGE (local/staging):
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 \
 *   APP_URL=http://localhost:3000 \
 *   DEV_STUB_TOKEN=dev.stub.jwt \
 *   SHOP_DOMAIN=demo-shop.myshopify.com \
 *   node scripts/seed-demo-logs.js --logs 200 --days 14
 *
 * NOTE: Requires dev stub auth enabled (SESSION_TOKEN_ALLOW_DEV_STUB=true).
 *       DO NOT run against production with stub tokens.
 */

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const TOKEN = process.env.DEV_STUB_TOKEN || "dev.stub.jwt";
const SHOP_DOMAIN = process.env.SHOP_DOMAIN || "demo-shop.myshopify.com";

function headers() {
  return { "content-type": "application/json", authorization: `Bearer ${TOKEN}` };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function arg(name, def) {
  const i = process.argv.findIndex((x) => x === name || x === name.replace(/=/, ""));
  if (i >= 0 && process.argv[i].includes("=")) {
    // --name=value
    const [, v] = process.argv[i].split("=");
    return v ?? def;
  }
  const j = process.argv.findIndex((x) => x === name);
  if (j >= 0 && process.argv[j + 1] && !process.argv[j + 1].startsWith("--")) return process.argv[j + 1];
  return def;
}

const TOTAL_LOGS = Number(arg("--logs", 200));
const DAYS = Number(arg("--days", 14));

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function weighted(pairs) {
  const total = pairs.reduce((s,[,w])=>s+w,0);
  let r = Math.random() * total;
  for (const [val,w] of pairs) { if ((r-=w) <= 0) return val; }
  return pairs[0][0];
}
function randomDateWithinDays(days) {
  const now = Date.now();
  const past = now - Math.floor(Math.random() * days) * 24 * 3600 * 1000;
  // randomize time within the day
  return new Date(past - Math.floor(Math.random() * 12) * 3600 * 1000);
}

// A few US cities / zips to cluster "top problems"
const LOCS = [
  { city: "Atlanta", province: "GA", zip: "30303" },
  { city: "Brooklyn", province: "NY", zip: "11201" },
  { city: "Los Angeles", province: "CA", zip: "90012" },
  { city: "Chicago", province: "IL", zip: "60601" },
  { city: "Austin", province: "TX", zip: "78701" },
];

const SEGMENTS = ["checkout", "thank_you", "customer_account"];

const ACTION = {
  OK: "OK",
  CORRECTED: "CORRECTED",
  BLOCK_MISSING_UNIT: "BLOCK_MISSING_UNIT",
  BLOCK_PO_BOX: "BLOCK_PO_BOX",
  BLOCK_UNDELIVERABLE: "BLOCK_UNDELIVERABLE",
  UNVERIFIED: "UNVERIFIED",
  SUGGEST_PICKUP: "SUGGEST_PICKUP",
};

// craft action mix (adjust weights to taste)
const ACTION_WEIGHTS = [
  [ACTION.OK, 55],
  [ACTION.CORRECTED, 20],
  [ACTION.BLOCK_MISSING_UNIT, 10],
  [ACTION.BLOCK_PO_BOX, 5],
  [ACTION.BLOCK_UNDELIVERABLE, 4],
  [ACTION.UNVERIFIED, 4],
  [ACTION.SUGGEST_PICKUP, 2],
];

async function putSettings() {
  const res = await fetch(`${APP_URL}/api/settings.update`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      blockPoBoxes: true,
      softMode: false,
      autoApplyCorrections: true,
      pickupRadiusKm: 8,
      failedDeliveryCostUsd: 12,
    }),
  });
  if (!res.ok) throw new Error("Failed to set settings: " + res.status);
}

async function ensurePickups() {
  const list = await fetch(`${APP_URL}/api/pickups`, { headers: headers() }).then(r => r.json());
  if (Array.isArray(list) && list.length >= 3) return;

  const seed = [
    { name: "Midtown Store", lat: 33.7838, lng: -84.3838 },
    { name: "Brooklyn Locker A", lat: 40.695, lng: -73.989 },
    { name: "LA Downtown Pickup", lat: 34.0537, lng: -118.2428 },
  ];
  for (const p of seed) {
    const res = await fetch(`${APP_URL}/api/pickups`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(p),
    });
    if (!res.ok) console.warn("pickup seed failed", await res.text());
    await sleep(50);
  }
}

function buildAddressFor(action) {
  const base = rand(LOCS);
  switch (action) {
    case ACTION.BLOCK_PO_BOX:
      return { address1: "PO Box 123", address2: "", city: base.city, province: base.province, zip: base.zip, country: "US" };
    case ACTION.BLOCK_MISSING_UNIT:
      return { address1: "123 Main St", address2: "", city: base.city, province: base.province, zip: base.zip, country: "US" };
    case ACTION.CORRECTED:
      return { address1: "1600 Amphitheatre Pkwy", address2: "", city: "Mountain View", province: "CA", zip: "94043", country: "US" };
    case ACTION.SUGGEST_PICKUP:
    case ACTION.BLOCK_UNDELIVERABLE:
      return { address1: "999 Nowhere Rd", address2: "", city: base.city, province: base.province, zip: base.zip, country: "US" };
    default:
      return { address1: "1 Apple Park Way", address2: "", city: "Cupertino", province: "CA", zip: "95014", country: "US" };
  }
}

async function seedOne(ts) {
  const action = weighted(ACTION_WEIGHTS);
  const segment = weighted([
    ["checkout", 70],
    ["thank_you", 20],
    ["customer_account", 10],
  ]);
  const addr = buildAddressFor(action);
  const payload = {
    context: { source: segment, shopDomain: SHOP_DOMAIN, checkoutToken: "demo-" + Math.random().toString(36).slice(2) },
    address: addr,
    options: {},
    // ts is only for the log layer; API may ignore it
  };

  // We call the real validation API so logs/analytics populate naturally.
  const res = await fetch(`${APP_URL}/api/validate-address`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  // Even if the pipeline decides a different action, that’s fine (more realistic).
  if (!res.ok) {
    console.warn("validate failed", res.status);
    return;
  }
  await sleep(20);
}

(async function main() {
  console.log("Seeding Address Validator++ demo data...");
  console.log({ APP_URL, SHOP_DOMAIN, TOTAL_LOGS, DAYS });

  // sanity
  if (process.env.SESSION_TOKEN_ALLOW_DEV_STUB === "false") {
    console.error("SESSION_TOKEN_ALLOW_DEV_STUB=false — seed script will likely be unauthorized.");
  }

  // seed settings & pickups
  await putSettings();
  await ensurePickups();

  // spread logs across recent DAYS
  for (let i = 0; i < TOTAL_LOGS; i++) {
    await seedOne(randomDateWithinDays(DAYS));
  }

  console.log("✅ Seed complete.");
})().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
