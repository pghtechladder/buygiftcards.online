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
const platformName = process.env.TANGO_PLATFORM_NAME || env.TANGO_PLATFORM_NAME;
const platformKey = process.env.TANGO_PLATFORM_KEY || env.TANGO_PLATFORM_KEY;
const accountId = process.env.TANGO_ACCOUNT_IDENTIFIER || env.TANGO_ACCOUNT_IDENTIFIER;
const customerId = process.env.TANGO_CUSTOMER_IDENTIFIER || env.TANGO_CUSTOMER_IDENTIFIER;
const baseUrl = (process.env.TANGO_API_BASE_URL || env.TANGO_API_BASE_URL || "https://api.tangocard.com/raas/v2").replace(/\/+$/, "");

console.log("==================================================");
console.log("             TANGO TEST SUITE                    ");
console.log("==================================================");
console.log(`Endpoint:    ${baseUrl}`);
console.log(`Platform:    ${platformName || "MISSING"}`);
console.log(`Account ID:  ${accountId || "MISSING"}`);
console.log(`Customer ID: ${customerId || "MISSING"}`);
console.log(`Mode:        ${baseUrl.includes("integration-api") ? "SANDBOX / TEST" : "PRODUCTION (LIVE)"}\n`);

if (!platformName || !platformKey) {
  console.error("❌ TANGO_PLATFORM_NAME or TANGO_PLATFORM_KEY is not set.");
  process.exit(1);
}

const auth = Buffer.from(`${platformName}:${platformKey}`).toString("base64");

async function run() {
  // 1. Check account details / balance
  if (customerId && accountId) {
    console.log(`1. Checking Tango Account Balance (${customerId}/${accountId})...`);
    try {
      const accRes = await fetch(`${baseUrl}/accounts/${customerId}/${accountId}`, {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
      });
      if (accRes.ok) {
        const acc = await accRes.json();
        console.log(`   ✅ Account Status: ${acc.status || "ACTIVE"}, Balance: $${acc.currentBalance} ${acc.currencyCode}`);
      } else {
        console.log(`   ℹ️  Account balance inquiry returned HTTP ${accRes.status}: ${await accRes.text()}`);
      }
    } catch (e) {
      console.log(`   ⚠️  Account balance check failed: ${e.message}`);
    }
  }

  // 2. Query Catalogs
  console.log("\n2. Fetching Tango Catalog...");
  const catRes = await fetch(`${baseUrl}/catalogs`, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });

  if (!catRes.ok) {
    const errText = await catRes.text();
    console.log(`   ❌ Catalog fetch failed (${catRes.status}): ${errText}`);
    console.log("\n💡 Note for Tango:");
    console.log("   If you are testing Sandbox, set TANGO_API_BASE_URL=\"https://integration-api.tangocard.com/raas/v2\"");
    console.log("   If you are testing Production, ensure your platform name and key are activated for live production by devsupport@tangocard.com.");
    return;
  }

  const catData = await catRes.json();
  const brands = catData.brands || [];
  console.log(`   ✅ Successfully retrieved catalog: "${catData.catalogName}" (${brands.length} brands)\n`);

  // 3. Inspect some key brands in Tango catalog
  console.log("3. Sample Brands in Catalog:");
  const samples = brands.slice(0, 10);
  for (const b of samples) {
    const utids = (b.items || []).map((i) => `${i.valueType === "VARIABLE_VALUE" ? `$${i.minVal}-$${i.maxVal}` : `$${i.faceValue}`} (${i.utid})`).join(", ");
    console.log(`   • ${b.brandName}: ${utids}`);
  }

  console.log("\n==================================================");
  console.log("  Tango API connection verified!                  ");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("\n❌ Tango Test Error:", err.message);
  process.exit(1);
});

