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
const APP_URL = process.env.TEST_APP_URL || "http://localhost:3000";

const LOG_DIR = path.join(process.cwd(), "logs");
const TRANSACTION_LOG_PATH = path.join(LOG_DIR, "transactions.log");
const TRANSACTION_JSONL_PATH = path.join(LOG_DIR, "transactions.jsonl");

function maskSecret(val) {
  if (!val) return "";
  if (val.length <= 12) return "***";
  return `${val.slice(0, 9)}...${val.slice(-4)}`;
}

function sanitizeHeaders(headers) {
  if (!headers) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (/authorization|key|secret|token|pass/i.test(k)) {
      const parts = String(v).split(" ");
      out[k] = parts.length === 2 ? `${parts[0]} ${maskSecret(parts[1])}` : maskSecret(String(v));
    } else {
      out[k] = v;
    }
  }
  return out;
}

function writeTestLog(entry) {
  const ts = entry.timestamp || new Date().toISOString();
  const fullEntry = { timestamp: ts, ...entry };
  const divider = "─".repeat(92);
  const lines = [
    divider,
    `[${ts}] [${fullEntry.phase}] [${fullEntry.process}]` +
      (fullEntry.transactionId ? ` [txId=${fullEntry.transactionId}]` : "") +
      (fullEntry.orderNumber ? ` [order=${fullEntry.orderNumber}]` : ""),
  ];
  if (fullEntry.apiUrl) lines.push(`  API URL        : ${fullEntry.method || "GET"} ${fullEntry.apiUrl}`);
  if (fullEntry.requestHeaders) lines.push(`  Headers        : ${JSON.stringify(sanitizeHeaders(fullEntry.requestHeaders))}`);
  if (fullEntry.requestPayload !== undefined) lines.push(`  Request Body   : ${JSON.stringify(fullEntry.requestPayload)}`);
  if (fullEntry.statusCode !== undefined) {
    lines.push(`  HTTP Status    : ${fullEntry.statusCode}${fullEntry.durationMs !== undefined ? ` (${fullEntry.durationMs} ms)` : ""}`);
  } else if (fullEntry.durationMs !== undefined) {
    lines.push(`  Duration       : ${fullEntry.durationMs} ms`);
  }
  if (fullEntry.responseBody !== undefined) lines.push(`  Response Body  : ${JSON.stringify(fullEntry.responseBody)}`);
  if (fullEntry.details !== undefined) lines.push(`  Details        : ${JSON.stringify(fullEntry.details)}`);
  if (fullEntry.error) lines.push(`  ERROR          : ${fullEntry.error}`);

  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(TRANSACTION_LOG_PATH, lines.join("\n") + "\n", "utf8");
  fs.appendFileSync(TRANSACTION_JSONL_PATH, JSON.stringify(fullEntry) + "\n", "utf8");
}

async function loggedFetch({ process: procName, transactionId, url, method = "GET", headers = {}, bodyObj, summarizeBody }) {
  writeTestLog({
    phase: "BEFORE_API_HIT",
    process: procName,
    transactionId,
    method,
    apiUrl: url,
    requestHeaders: headers,
    requestPayload: bodyObj,
  });
  const start = Date.now();
  const res = await fetch(url, {
    method,
    headers,
    body: bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined,
  });
  const durationMs = Date.now() - start;
  const raw = await res.text();
  let data = raw;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    // keep raw string
  }
  writeTestLog({
    phase: "AFTER_API_HIT",
    process: procName,
    transactionId,
    method,
    apiUrl: url,
    statusCode: res.status,
    durationMs,
    responseBody: summarizeBody ? summarizeBody(data) : data,
  });
  return { res, data, durationMs };
}

async function zenditPurchaseAndPoll({ offerId, fields = [], value }) {
  const transactionId = `bgc-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = { transactionId, offerId, fields };
  if (value) payload.value = value;

  writeTestLog({
    phase: "PROCESS_START",
    process: "TestSuite.ZenditPurchase",
    transactionId,
    details: { offerId, fields, value },
  });

  const { res: createRes, data: created } = await loggedFetch({
    process: "TestSuite.Zendit.CreatePurchase",
    transactionId,
    url: `${BASE_URL}/vouchers/purchases`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    bodyObj: payload,
  });
  assert.equal(createRes.status, 200, `Expected 200 on POST /vouchers/purchases for ${offerId}`);
  assert.equal(created.transactionId, transactionId);

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 700));
    const { res: pollRes, data: tx } = await loggedFetch({
      process: `TestSuite.Zendit.PollPurchase[attempt=${i + 1}]`,
      transactionId,
      url: `${BASE_URL}/vouchers/purchases/${encodeURIComponent(transactionId)}`,
      method: "GET",
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
    });
    assert.equal(pollRes.status, 200);
    if (tx.status === "DONE") {
      writeTestLog({
        phase: "PROCESS_COMPLETE",
        process: "TestSuite.ZenditPurchase",
        transactionId,
        details: { offerId, status: tx.status, send: tx.send, receipt: tx.receipt },
      });
      return tx;
    }
    if (tx.status === "FAILED") {
      assert.fail(`Transaction ${transactionId} (${offerId}) failed: ${JSON.stringify(tx.error)}`);
    }
  }
  assert.fail(`Transaction ${transactionId} (${offerId}) timed out`);
}

test("1. Zendit API Authentication & Wallet Balance (/v1/balance)", async () => {
  assert.ok(API_KEY, "ZENDIT_API_KEY must be configured in .env.local");
  assert.equal(process.env.ZENDIT_USERNAME, "sri@techladder.io");

  const { res, data } = await loggedFetch({
    process: "TestSuite.Zendit.GetBalance",
    url: `${BASE_URL}/balance`,
    method: "GET",
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  assert.equal(res.status, 200);
  assert.equal(data.currency, "USD");
  assert.ok(data.availableBalance > 0, `Wallet balance should be > 0, got ${data.availableBalance}`);
});

test("2. Zendit US Voucher Catalog Verification (/v1/vouchers/offers?country=US)", async () => {
  const { res, data } = await loggedFetch({
    process: "TestSuite.Zendit.GetVoucherOffers",
    url: `${BASE_URL}/vouchers/offers?country=US&_limit=1000&_offset=0`,
    method: "GET",
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
    summarizeBody: (body) => ({
      total: body.total,
      limit: body.limit,
      offset: body.offset,
      returnedOffersCount: Array.isArray(body.list) ? body.list.length : 0,
      sampleOfferIds: Array.isArray(body.list) ? body.list.slice(0, 10).map((o) => o.offerId) : [],
    }),
  });
  assert.equal(res.status, 200);
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

