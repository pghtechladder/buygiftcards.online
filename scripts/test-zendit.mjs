#!/usr/bin/env node
import fs from "fs";
import path from "path";

// 1. Load .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  const p = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const idx = line.indexOf("=");
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
        p[k] = v;
      }
    }
  }
  return p;
}

const env = loadEnv();
const API_KEY = process.env.ZENDIT_API_KEY || env.ZENDIT_API_KEY;
const BASE_URL = (process.env.ZENDIT_API_BASE_URL || env.ZENDIT_API_BASE_URL || "https://api.zendit.io/v1").replace(/\/+$/, "");

console.log("==================================================");
console.log("             ZENDIT TEST SUITE                   ");
console.log("==================================================");
console.log(`Endpoint: ${BASE_URL}`);
console.log(`API Key:  ${API_KEY ? API_KEY.slice(0, 10) + "..." : "MISSING"}`);
console.log(`Mode:     ${API_KEY?.startsWith("prod_") ? "PRODUCTION (LIVE)" : "SANDBOX / TEST"}\n`);

if (!API_KEY) {
  console.error("❌ ZENDIT_API_KEY is not set.");
  process.exit(1);
}

async function run() {
  // Step 1: Check balance
  console.log("1. Checking Wallet Balance...");
  const balRes = await fetch(`${BASE_URL}/balance`, {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!balRes.ok) {
    throw new Error(`Balance check failed (${balRes.status}): ${await balRes.text()}`);
  }
  const bal = await balRes.json();
  const dollars = (bal.availableBalance / (bal.currencyDivisor || 100)).toFixed(2);
  console.log(`   ✅ Success! Available Balance: $${dollars} ${bal.currency}\n`);

  // Step 2: Fetch US Voucher catalog
  console.log("2. Fetching US Digital Voucher Offers...");
  const res = await fetch(`${BASE_URL}/vouchers/offers?country=US&_limit=1000&_offset=0`, {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Offers fetch failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const enabled = (data.list || []).filter((o) => o.enabled);
  console.log(`   ✅ Found ${enabled.length} active US voucher offers.\n`);

  // Step 3: Verify core popular brands & denominations
  console.log("3. Verifying Key Brands & Denominations in Zendit:");
  const testBrands = ["Amazon", "Target", "Starbucks", "Uber", "DoorDash", "Disney", "Nike", "Netflix", "Chipotle"];

  for (const bName of testBrands) {
    const brandOffers = enabled.filter(
      (o) => (o.brand || "").toLowerCase().replace(/[^a-z]/g, "") === bName.toLowerCase().replace(/[^a-z]/g, "")
    );
    if (brandOffers.length === 0) {
      console.log(`   ⚠️  ${bName}: No active offers found in live catalog.`);
      continue;
    }

    const rangeOffers = brandOffers.filter((o) => (o.price?.min && o.price?.max) || (o.send?.min && o.send?.max));
    const fixedOffers = brandOffers.filter((o) => (o.price?.value || o.send?.value) && !o.price?.min);

    if (rangeOffers.length > 0) {
      const r = rangeOffers[0];
      const min = r.send?.min || r.price?.min;
      const max = r.send?.max || r.price?.max;
      console.log(`   ✅ ${bName}: Variable Range $${min} - $${max} (Offer ID: ${r.offerId})`);
    }

    if (fixedOffers.length > 0) {
      const denoms = fixedOffers
        .map((o) => o.send?.value || o.price?.value)
        .filter(Boolean)
        .sort((a, b) => a - b);
      console.log(`   ✅ ${bName}: Fixed Denominations: [${[...new Set(denoms)].map((d) => `$${d}`).join(", ")}]`);
    }
  }

  console.log("\n==================================================");
  console.log("  Zendit API is healthy and verified!             ");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("\n❌ Zendit Test Error:", err.message);
  process.exit(1);
});
