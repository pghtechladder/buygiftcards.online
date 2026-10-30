import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Load .env.local so tests have ZENDIT_API_KEY and ZENDIT_USERNAME
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const API_KEY = process.env.ZENDIT_API_KEY;
const BASE_URL = (process.env.ZENDIT_API_BASE_URL || "https://api.zendit.io/v1").replace(/\/+$/, "");
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function zenditPurchaseAndPoll({ offerId, fields = [], value }) {
  const transactionId = `bgc-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = { transactionId, offerId, fields };
  if (value) payload.value = value;

  const createRes = await fetch(`${BASE_URL}/vouchers/purchases`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  assert.equal(createRes.status, 200, `Expected 200 on POST /vouchers/purchases for ${offerId}`);
  const created = await createRes.json();
  assert.equal(created.transactionId, transactionId);

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 700));
    const pollRes = await fetch(`${BASE_URL}/vouchers/purchases/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
    });
    assert.equal(pollRes.status, 200);
    const tx = await pollRes.json();
    if (tx.status === "DONE") return tx;
    if (tx.status === "FAILED") {
      assert.fail(`Transaction ${transactionId} (${offerId}) failed: ${JSON.stringify(tx.error)}`);
    }
  }
  assert.fail(`Transaction ${transactionId} (${offerId}) timed out`);
}

test("1. Zendit API Authentication & Wallet Balance (/v1/balance)", async () => {
  assert.ok(API_KEY, "ZENDIT_API_KEY must be configured in .env.local");
  assert.ok(API_KEY.startsWith("sand_"), "Expected Zendit sandbox API secret");
  assert.equal(process.env.ZENDIT_USERNAME, "sri@techladder.io");

  const res = await fetch(`${BASE_URL}/balance`, {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.currency, "USD");
  assert.ok(data.availableBalance > 0, `Wallet balance should be > 0, got ${data.availableBalance}`);
});

test("2. Zendit US Voucher Catalog Verification (/v1/vouchers/offers?country=US)", async () => {
  const res = await fetch(`${BASE_URL}/vouchers/offers?country=US&_limit=1000&_offset=0`, {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  const enabledOffers = (data.list || []).filter((o) => o.enabled);
  assert.ok(enabledOffers.length >= 100, `Expected at least 100 US offers, found ${enabledOffers.length}`);

  const offerIds = new Set(enabledOffers.map((o) => o.offerId));
  // Verify key mapped offers across FIXED and RANGE brands exist in live Zendit catalog
  for (const expectedOfferId of [
    "ULTA_US_OPEN",
    "UNDERARMOUR_US_OPEN",
    "DISNEY_US_OPEN",
    "GOOGLEPLAY_US_001",
    "SEPHORA_US_002_EGIFT",
    "PLAYSTATION_US_002",
    "XBOX_US_25_EGIFT_WHS",
    "GAMESTOP_US_25_WHS",
    "SHELL_US_25_WHS",
    "AUTOZONE_US_20_EGIFT",
    "GT_CHEVRONTEXACO_US_25_EGIFT",
    "ALBERTSONS_US_25_EGIFT",
    "BURLINGTON_US_001_EGIFT",
    "DUNKIN_US_25_WHS",
    "EAPLAY_US_001",
    "FORTNITE_US_25_WHS",
    "FREEFIRE_US_10_EGIFT",
    "GATORADE_US_25_WHS",
    "GT_CONOCO_US_25_EGIFT",
    "INTEGRALCARE_US_139_WHS",
    "MINECRAFTJAVABEDROCK_US_WHS",
    "MOBILELEGENDS_US_1167D_WHS",
    "OLDNAVY_US_001",
    "PUBG_US_1800UC_WHS",
    "RAZERGOLD_US_25",
    "ZWILLING_US_25",
  ]) {
    assert.ok(offerIds.has(expectedOfferId), `Offer ID ${expectedOfferId} should exist in Zendit US catalog`);
  }
});

test("3. Zendit Live Purchase — FIXED Offer without requiredFields (Sephora $25)", async () => {
  const tx = await zenditPurchaseAndPoll({
    offerId: "SEPHORA_US_002_EGIFT",
    fields: [],
  });
  assert.equal(tx.status, "DONE");
  assert.equal(tx.send, 2500);
  const credential = tx.receipt?.redemptionUrl || tx.receipt?.voucherId || tx.receipt?.epin;
  assert.ok(credential, "Receipt must contain redemptionUrl or voucherId");
});

test("4. Zendit Live Purchase — FIXED Offer with requiredFields (Burlington $25)", async () => {
  const tx = await zenditPurchaseAndPoll({
    offerId: "BURLINGTON_US_001_EGIFT",
    fields: [
      { key: "recipient.firstName", value: "Valued" },
      { key: "recipient.lastName", value: "Customer" },
    ],
  });
  assert.equal(tx.status, "DONE");
  assert.equal(tx.send, 2500);
  const credential = tx.receipt?.redemptionUrl || tx.receipt?.voucherId || tx.receipt?.epin;
  assert.ok(credential, "Receipt must contain redemptionUrl or voucherId");
});

test("5. Zendit Live Purchase — RANGE Offer (Disney $30 Open Range)", async () => {
  const tx = await zenditPurchaseAndPoll({
    offerId: "DISNEY_US_OPEN",
    value: { type: "ZEND", value: 3000 },
    fields: [],
  });
  assert.equal(tx.status, "DONE");
  assert.equal(tx.send, 3000);
  const credential = tx.receipt?.redemptionUrl || tx.receipt?.voucherId || tx.receipt?.epin;
  assert.ok(credential, "Receipt must contain redemptionUrl or voucherId");
});

test("6. Application Storefront & Redemption End-to-End via Zendit (/api/redeem/lookup & /api/redeem/exchange)", async () => {
  // 6a. Verify new Zendit brand pages render with HTTP 200
  for (const slug of ["disney", "dunkin", "oldnavy", "burlington", "fortnite", "razergold", "sephora", "ultabeauty"]) {
    const pageRes = await fetch(`${APP_URL}/product/${slug}`);
    assert.equal(pageRes.status, 200, `Product page /product/${slug} should return 200`);
  }

  // 6b. Lookup the $100 BuyGiftCards.online house card
  const lookupRes = await fetch(`${APP_URL}/api/redeem/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "8888 2026 1225 0100",
      pin: "20261225",
    }),
  });
  assert.equal(lookupRes.status, 200);
  const lookupData = await lookupRes.json();
  assert.equal(lookupData.card.balanceCents, 10000);

  // 6c. Swap $50 of the $100 card into $25 Sephora (FIXED) + $25 Ulta Beauty (RANGE) via ZenditProvider
  const exchangeRes = await fetch(`${APP_URL}/api/redeem/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cardId: lookupData.card.id,
      code: lookupData.card.code,
      pin: "20261225",
      email: "sri@techladder.io",
      selections: [
        { brandSlug: "sephora", amountDollars: 25, quantity: 1 },
        { brandSlug: "ultabeauty", amountDollars: 25, quantity: 1 },
      ],
    }),
  });
  assert.equal(exchangeRes.status, 200);
  const exchangeData = await exchangeRes.json();
  assert.equal(exchangeData.success, true);
  assert.equal(exchangeData.redeemedItems.length, 2);

  for (const item of exchangeData.redeemedItems) {
    assert.equal(item.isDemo, false, `Expected live Zendit credential (isDemo=false) for ${item.brandSlug}`);
    assert.ok(item.code.length > 5, `Expected non-empty voucher/claim code for ${item.brandSlug}`);
  }
  assert.equal(exchangeData.remainingCard.amountCents, 5000);

  // 6d. Reset sample card so it remains ready for interactive browser testing
  await fetch(`${APP_URL}/api/redeem/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "8888 2026 1225 0100",
      pin: "20261225",
    }),
  });
});

