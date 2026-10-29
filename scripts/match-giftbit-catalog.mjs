#!/usr/bin/env node
/**
 * scripts/match-giftbit-catalog.mjs
 *
 * Fetches the Giftbit brand catalog (`GET /papi/v1/brands`) and brand details
 * (`GET /papi/v1/brands/{brand_code}`) for your account, filters to USD brands
 * (or prints all if requested), and fuzzy-matches each against the brand slugs
 * defined in src/lib/brands.ts to print ready-to-paste entries for
 * BRAND_TO_GIFTBIT_CODE in src/lib/giftcard-provider.ts.
 *
 * Usage:
 *   npm run giftbit:catalog
 *
 * Reads GIFTBIT_API_KEY and GIFTBIT_API_BASE_URL from .env.local automatically.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {}
}
loadEnvLocal();

const API_KEY = process.env.GIFTBIT_API_KEY;
if (!API_KEY) {
  console.error(
    "ERROR: GIFTBIT_API_KEY is not set in .env.local or environment.\n" +
      '    Run: GIFTBIT_API_KEY="..." node scripts/match-giftbit-catalog.mjs'
  );
  process.exit(1);
}

const BASE_URL = (
  process.env.GIFTBIT_API_BASE_URL ||
  (API_KEY.startsWith("PROD-")
    ? "https://api.giftbit.com/papi/v1"
    : "https://api-testbed.giftbit.com/papi/v1")
).replace(/\/+$/, "");

async function fetchCatalog() {
  console.log(`Fetching Giftbit catalog from ${BASE_URL}/brands ...\n`);
  const res = await fetch(`${BASE_URL}/brands?limit=500`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Giftbit catalog fetch failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  const list = data?.brands ?? [];

  const detailed = [];
  for (const b of list) {
    const dRes = await fetch(`${BASE_URL}/brands/${encodeURIComponent(b.brand_code)}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (dRes.ok) {
      const dData = await dRes.json();
      if (dData?.brand) detailed.push(dData.brand);
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  return detailed;
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\.com|\.ca|\.co\.uk|\.au|\.de|\.fr|\.mx|\.it|\.es|\.sg/g, "")
    .replace(/®|™|©/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function loadBrands() {
  const brands = [];
  const brandsPath = resolve(__dirname, "../src/lib/brands.ts");
  const src = readFileSync(brandsPath, "utf-8");
  const re = /slug:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    brands.push({ slug: m[1], name: m[2] });
  }
  return brands;
}

(async () => {
  try {
    const allBrands = await fetchCatalog();
    const usdBrands = allBrands.filter((b) => b.fund_currencyisocode === "USD");
    console.log(
      `Fetched ${allBrands.length} total brands (${usdBrands.length} USD / Region 2 brands).\n`
    );

    const ourBrands = loadBrands();
    const matched = [];
    const unmatchedGiftbit = [];

    for (const gb of usdBrands) {
      const gbNorm = normalizeName(gb.name);
      const gbCodeNorm = normalizeName(gb.brand_code.replace(/us$/, ""));
      const found = ourBrands.find((ours) => {
        const ourNorm = normalizeName(ours.name);
        const slugNorm = normalizeName(ours.slug);
        return (
          gbNorm === ourNorm ||
          gbNorm === slugNorm ||
          gbCodeNorm === slugNorm ||
          (gb.brand_code === "visavirtualus" && ours.slug === "visa")
        );
      });
      if (found) {
        matched.push({ ours: found, gb });
      } else {
        unmatchedGiftbit.push(gb);
      }
    }

    console.log("// --- READY-TO-PASTE for BRAND_TO_GIFTBIT_CODE (USD) ---");
    for (const { ours, gb } of matched) {
      const range = gb.variable_price
        ? `$${gb.min_price_in_cents / 100}–$${gb.max_price_in_cents / 100}`
        : `fixed: ${JSON.stringify(gb.allowed_prices_in_cents)}`;
      console.log(
        `  ${(ours.slug + ":").padEnd(20)} "${gb.brand_code}", // ${gb.name} (${range})`
      );
    }

    if (unmatchedGiftbit.length) {
      console.log("\n// --- OTHER USD BRANDS IN GIFTBIT (not in src/lib/brands.ts) ---");
      for (const gb of unmatchedGiftbit) {
        const range = gb.variable_price
          ? `$${gb.min_price_in_cents / 100}–$${gb.max_price_in_cents / 100}`
          : `fixed: ${JSON.stringify(gb.allowed_prices_in_cents)}`;
        console.log(`  // "${gb.brand_code}" — ${gb.name} (${range})`);
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
