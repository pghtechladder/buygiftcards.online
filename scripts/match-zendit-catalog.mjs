import fs from "fs";
import path from "path";

// Load .env.local if ZENDIT_API_KEY is not already in env
if (!process.env.ZENDIT_API_KEY) {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const API_KEY = process.env.ZENDIT_API_KEY;
const BASE_URL = (process.env.ZENDIT_API_BASE_URL || "https://api.zendit.io/v1").replace(/\/+$/, "");

if (!API_KEY) {
  console.error("ZENDIT_API_KEY is not set in environment or .env.local");
  process.exit(1);
}

async function run() {
  console.log(`Checking Zendit Wallet Balance at ${BASE_URL}/balance...`);
  const balRes = await fetch(`${BASE_URL}/balance`, {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!balRes.ok) {
    throw new Error(`Balance check failed (${balRes.status}): ${await balRes.text()}`);
  }
  const bal = await balRes.json();
  console.log(
    `Wallet Balance: ${(bal.availableBalance / (bal.currencyDivisor || 100)).toFixed(2)} ${bal.currency}`
  );

  console.log(`\nFetching US Digital Gift Card / Voucher Offers...`);
  const res = await fetch(`${BASE_URL}/vouchers/offers?country=US&_limit=1000&_offset=0`, {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Offers fetch failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const enabled = (data.list || []).filter((o) => o.enabled);
  console.log(`Total US Enabled Voucher Offers: ${enabled.length}\n`);

  const byBrand = new Map();
  for (const o of enabled) {
    if (!byBrand.has(o.brand)) byBrand.set(o.brand, []);
    byBrand.get(o.brand).push(o);
  }

  for (const [brand, offers] of byBrand.entries()) {
    const first = offers[0];
    if (first.priceType === "RANGE") {
      console.log(
        `- ${brand} (${first.brandName}): RANGE $${first.send.min / 100}–$${first.send.max / 100} -> offerId="${first.offerId}"`
      );
    } else {
      const denoms = offers
        .map((o) => `$${o.send.fixed / 100}: "${o.offerId}"`)
        .join(", ");
      console.log(`- ${brand} (${first.brandName}): FIXED { ${denoms} }`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

