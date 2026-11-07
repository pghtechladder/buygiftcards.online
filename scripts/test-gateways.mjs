import fs from "fs";

function getEnv() {
  const env = fs.readFileSync(".env.local", "utf8");
  const p = {};
  for (const line of env.split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
      p[k] = v;
    }
  }
  return p;
}

const env = getEnv();

async function testPayPal() {
  console.log("=== Testing PayPal ===");
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  // Test Production
  try {
    const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    console.log("PayPal Production Token Status:", res.status);
    const data = await res.json();
    console.log("PayPal Production Response:", data.app_id ? `Authenticated as app: ${data.app_id}` : data);
  } catch (err) {
    console.error("PayPal Production Error:", err.message);
  }

  // Test Sandbox
  try {
    const resSb = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    console.log("PayPal Sandbox Token Status:", resSb.status);
    const dataSb = await resSb.json();
    console.log("PayPal Sandbox Response:", dataSb.app_id ? `Authenticated as app: ${dataSb.app_id}` : dataSb);
  } catch (err) {
    console.error("PayPal Sandbox Error:", err.message);
  }
}

async function testTango() {
  console.log("\n=== Testing Tango ===");
  const user = env.TANGO_PLATFORM_NAME;
  const key = env.TANGO_PLATFORM_KEY;
  const auth = Buffer.from(`${user}:${key}`).toString("base64");

  // Test Sandbox
  try {
    const resSb = await fetch("https://integration-api.tangocard.com/raas/v2/catalogs", {
      headers: { Authorization: `Basic ${auth}` },
    });
    console.log("Tango Sandbox Status:", resSb.status);
    if (resSb.ok) {
      const d = await resSb.json();
      console.log("Tango Sandbox Catalog:", d.catalogName, "brands count:", (d.brands || []).length);
    } else {
      console.log("Tango Sandbox Body:", await resSb.text());
    }
  } catch (err) {
    console.error("Tango Sandbox Error:", err.message);
  }

  // Test Production
  try {
    const resPr = await fetch("https://api.tangocard.com/raas/v2/catalogs", {
      headers: { Authorization: `Basic ${auth}` },
    });
    console.log("Tango Production Status:", resPr.status);
    if (resPr.ok) {
      const d = await resPr.json();
      console.log("Tango Production Catalog:", d.catalogName, "brands count:", (d.brands || []).length);
    } else {
      console.log("Tango Production Body:", await resPr.text());
    }
  } catch (err) {
    console.error("Tango Production Error:", err.message);
  }
}

async function testZendit() {
  console.log("\n=== Testing Zendit ===");
  const apiKey = env.ZENDIT_API_KEY;
  const baseUrl = env.ZENDIT_API_BASE_URL || "https://api.zendit.io/v1";
  try {
    const res = await fetch(`${baseUrl}/balance`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    console.log("Zendit Status:", res.status);
    const d = await res.json();
    console.log("Zendit Balance:", d);
  } catch (err) {
    console.error("Zendit Error:", err.message);
  }
}

async function main() {
  await testPayPal();
  await testTango();
  await testZendit();
}

main();
