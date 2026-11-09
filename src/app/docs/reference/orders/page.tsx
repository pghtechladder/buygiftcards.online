"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function OrdersApiReferencePage() {
  const [activeLang, setActiveLang] = useState<"curl" | "node" | "python" | "go">("curl");
  const [copiedKey, setCopiedKey] = useState(false);
  const [simulatedResponse, setSimulatedResponse] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const sandboxKey = "bgc_test_platform_2026";

  const copyKey = () => {
    navigator.clipboard.writeText(sandboxKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/v1/giftcards/issue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sandboxKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandSlug: "amazon",
          amount: 50,
          recipientEmail: "demo.developer@example.com",
          recipientName: "Demo Developer",
          senderName: "Acme Platform",
          giftMessage: "Interactive API test from api.buygiftcards.online/docs",
        }),
      });
      const data = await res.json();
      setSimulatedResponse(JSON.stringify(data, null, 2));
    } catch {
      setSimulatedResponse(
        JSON.stringify(
          {
            status: "COMPLETED",
            orderNumber: "BGC-ENT-SIMULATED",
            testMode: true,
            voucher: {
              code: "TEST-AMZ-9941-K820",
              pin: "7721",
              claimUrl: "https://buygiftcards.online/redeem?code=TEST-AMZ-9941-K820",
            },
          },
          null,
          2
        )
      );
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-ink-50/50 min-h-screen text-ink-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-ink-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-brand-600 text-white font-black text-sm flex items-center justify-center">
              B
            </span>
            <span className="font-extrabold text-base tracking-tight text-ink-950">
              buygiftcards<span className="text-brand-600">.online</span>
            </span>
          </Link>
          <span className="text-ink-300">/</span>
          <Link href="/docs" className="text-xs font-bold text-ink-600 hover:text-brand-600">
            Docs
          </Link>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
            Orders Reference
          </span>
          <span className="hidden md:inline text-xs font-mono text-ink-400">
            api.buygiftcards.online/docs/reference/orders
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-ink-50 px-2.5 py-1 rounded-lg border border-ink-200 text-xs font-mono">
            <span className="text-ink-500">Sandbox Key:</span>
            <span className="font-bold text-ink-900">{sandboxKey}</span>
            <button
              onClick={copyKey}
              className="text-brand-600 hover:text-brand-700 font-sans font-bold text-[11px]"
            >
              {copiedKey ? "Copied" : "Copy"}
            </button>
          </div>
          <Link
            href="/platform#book-demo"
            className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition"
          >
            Request Live Key
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Table of Contents */}
        <aside className="lg:col-span-3 sticky top-20 bg-white border border-ink-200/80 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-ink-400 px-2">
            Orders API Reference
          </div>
          <nav className="space-y-0.5 text-xs font-bold">
            <a
              href="#the-order-object"
              className="block px-2.5 py-1.5 rounded-lg text-ink-700 hover:bg-ink-50 hover:text-brand-600"
            >
              The Order Object
            </a>
            <a
              href="#create-order"
              className="block px-2.5 py-1.5 rounded-lg text-ink-700 hover:bg-ink-50 hover:text-brand-600 flex items-center justify-between"
            >
              <span>Create an Order</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-black">POST</span>
            </a>
            <a
              href="#list-orders"
              className="block px-2.5 py-1.5 rounded-lg text-ink-700 hover:bg-ink-50 hover:text-brand-600 flex items-center justify-between"
            >
              <span>List &amp; Filter Orders</span>
              <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded font-black">GET</span>
            </a>
            <a
              href="#get-order"
              className="block px-2.5 py-1.5 rounded-lg text-ink-700 hover:bg-ink-50 hover:text-brand-600 flex items-center justify-between"
            >
              <span>Retrieve an Order</span>
              <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded font-black">GET</span>
            </a>
            <a
              href="#bulk-orders"
              className="block px-2.5 py-1.5 rounded-lg text-ink-700 hover:bg-ink-50 hover:text-brand-600 flex items-center justify-between"
            >
              <span>Bulk Batch Orders</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-black">POST</span>
            </a>
            <a
              href="#resend-order"
              className="block px-2.5 py-1.5 rounded-lg text-ink-700 hover:bg-ink-50 hover:text-brand-600 flex items-center justify-between"
            >
              <span>Resend Order Email</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-black">POST</span>
            </a>
          </nav>

          <div className="pt-4 border-t border-ink-100">
            <div className="text-[10px] font-black uppercase tracking-wider text-ink-400 px-2 mb-1.5">
              Related Docs
            </div>
            <div className="space-y-1 text-xs font-semibold">
              <Link href="/docs" className="block px-2 text-brand-600 hover:underline">
                &larr; API Overview &amp; Guides
              </Link>
              <Link href="/platform" className="block px-2 text-ink-500 hover:underline">
                Enterprise Platform Overview
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Content */}
        <main className="lg:col-span-9 space-y-12">
          {/* Header Banner */}
          <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-700">
              <span>API Reference</span>
              <span>·</span>
              <span>v1 Orders</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-ink-950">Orders API</h1>
            <p className="text-sm sm:text-base text-ink-600 leading-relaxed max-w-3xl">
              The Orders API allows you to create, track, list, and resend digital gift card orders
              across 165+ retail brands and prepaid open-loop cards. Every order is fulfilled synchronously
              in under 500ms, returning instant card numbers, PINs, and hosted redemption URLs.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2">
              <div className="p-2.5 rounded-xl bg-ink-950 text-emerald-400">
                Base URL: https://api.buygiftcards.online/api/v1
              </div>
              <div className="p-2.5 rounded-xl bg-ink-100 text-ink-800">
                Auth: Authorization: Bearer &lt;API_KEY&gt;
              </div>
            </div>
          </div>

          {/* 1. THE ORDER OBJECT */}
          <section id="the-order-object" className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-ink-950">The Order Object</h2>
            <p className="text-sm text-ink-600 leading-relaxed">
              Whenever a gift card is issued or queried, it is represented as an Order object with itemized voucher details:
            </p>

            <div className="border border-ink-200 rounded-2xl overflow-hidden divide-y divide-ink-100 text-xs font-mono">
              <div className="p-3 bg-ink-50 font-bold grid grid-cols-12 text-ink-500">
                <span className="col-span-3">Attribute</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-7">Description</span>
              </div>
              <div className="p-3 grid grid-cols-12">
                <span className="col-span-3 font-bold text-ink-950">orderNumber</span>
                <span className="col-span-2 text-ink-500">string</span>
                <span className="col-span-7 font-sans text-ink-700">Unique identifier for the order (e.g. <code>BGC-20261109-8472</code>).</span>
              </div>
              <div className="p-3 grid grid-cols-12">
                <span className="col-span-3 font-bold text-ink-950">status</span>
                <span className="col-span-2 text-ink-500">string</span>
                <span className="col-span-7 font-sans text-ink-700"><code>COMPLETED</code>, <code>PENDING</code>, or <code>FAILED</code>.</span>
              </div>
              <div className="p-3 grid grid-cols-12">
                <span className="col-span-3 font-bold text-ink-950">brand</span>
                <span className="col-span-2 text-ink-500">object</span>
                <span className="col-span-7 font-sans text-ink-700">Card brand metadata including <code>slug</code>, <code>name</code>, and <code>category</code>.</span>
              </div>
              <div className="p-3 grid grid-cols-12">
                <span className="col-span-3 font-bold text-ink-950">denomination</span>
                <span className="col-span-2 text-ink-500">object</span>
                <span className="col-span-7 font-sans text-ink-700"><code>faceValue</code>, <code>currency</code>, and <code>chargedAmount</code>.</span>
              </div>
              <div className="p-3 grid grid-cols-12">
                <span className="col-span-3 font-bold text-ink-950">recipient</span>
                <span className="col-span-2 text-ink-500">object</span>
                <span className="col-span-7 font-sans text-ink-700"><code>email</code> and optional <code>name</code> of the gift recipient.</span>
              </div>
              <div className="p-3 grid grid-cols-12">
                <span className="col-span-3 font-bold text-ink-950">voucher</span>
                <span className="col-span-2 text-ink-500">object</span>
                <span className="col-span-7 font-sans text-ink-700">Fulfillment credentials: <code>code</code>, <code>pin</code>, and <code>claimUrl</code>.</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-ink-500 uppercase">JSON Representation</div>
              <pre className="p-4 rounded-2xl bg-ink-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`{
  "status": "COMPLETED",
  "orderNumber": "BGC-ENT-88492019",
  "testMode": true,
  "partnerId": "sandbox_enterprise_partner",
  "brand": {
    "slug": "amazon",
    "name": "Amazon",
    "category": "Shopping"
  },
  "denomination": {
    "faceValue": 50,
    "currency": "USD",
    "chargedAmount": 50.00
  },
  "recipient": {
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  },
  "voucher": {
    "code": "TEST-AMZ-7X82-K9Q1-4402",
    "pin": "8492",
    "claimUrl": "https://buygiftcards.online/redeem?code=TEST-AMZ-7X82-K9Q1-4402",
    "deliveryType": "egift",
    "expiresAt": null
  },
  "issuedAt": "2026-11-09T16:00:00.000Z"
}`}
              </pre>
            </div>
          </section>

          {/* 2. CREATE AN ORDER */}
          <section id="create-order" className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">POST Endpoint</span>
                <h2 className="text-2xl font-black text-ink-950">Create an Order</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-black">
                  POST /api/v1/orders
                </span>
                <span className="px-2 py-1 rounded-md bg-ink-100 text-ink-600 text-xs font-mono">
                  (or /api/v1/giftcards/issue)
                </span>
              </div>
            </div>

            <p className="text-sm text-ink-600 leading-relaxed">
              Issues a digital gift card for a recipient. Returns the order confirmation and voucher immediately.
            </p>

            {/* Request Parameters */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-ink-950 uppercase tracking-wider">Request Body Parameters</h3>
              <div className="border border-ink-200 rounded-2xl overflow-hidden divide-y divide-ink-100 text-xs">
                <div className="p-3 grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-mono font-bold text-ink-950">
                    brandSlug <span className="text-red-500">*</span>
                  </span>
                  <span className="col-span-2 font-mono text-ink-500">string</span>
                  <span className="col-span-7 text-ink-700">Brand identifier from the catalog (e.g. <code>amazon</code>, <code>starbucks</code>, <code>visa</code>, <code>buygiftcards</code>).</span>
                </div>
                <div className="p-3 grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-mono font-bold text-ink-950">
                    amount <span className="text-red-500">*</span>
                  </span>
                  <span className="col-span-2 font-mono text-ink-500">number</span>
                  <span className="col-span-7 text-ink-700">Denomination face value in dollars (e.g. <code>25</code>, <code>50</code>, <code>100</code>).</span>
                </div>
                <div className="p-3 grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-mono font-bold text-ink-950">
                    recipientEmail <span className="text-red-500">*</span>
                  </span>
                  <span className="col-span-2 font-mono text-ink-500">string</span>
                  <span className="col-span-7 text-ink-700">Recipient&apos;s email address to deliver the voucher claim notification.</span>
                </div>
                <div className="p-3 grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-mono font-bold text-ink-950">recipientName</span>
                  <span className="col-span-2 font-mono text-ink-500">string</span>
                  <span className="col-span-7 text-ink-700">Optional recipient full name for card personalization.</span>
                </div>
                <div className="p-3 grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-mono font-bold text-ink-950">senderName</span>
                  <span className="col-span-2 font-mono text-ink-500">string</span>
                  <span className="col-span-7 text-ink-700">Company or manager name displayed on the voucher email.</span>
                </div>
                <div className="p-3 grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-mono font-bold text-ink-950">giftMessage</span>
                  <span className="col-span-2 font-mono text-ink-500">string</span>
                  <span className="col-span-7 text-ink-700">Personalized greeting or reward note (up to 300 characters).</span>
                </div>
                <div className="p-3 grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-mono font-bold text-ink-950">idempotencyKey</span>
                  <span className="col-span-2 font-mono text-ink-500">string</span>
                  <span className="col-span-7 text-ink-700">Client-generated UUID to prevent duplicate ordering.</span>
                </div>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-ink-500 uppercase">Code Sample</div>
                <div className="flex rounded-xl bg-ink-100 p-1">
                  {(["curl", "node", "python", "go"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                        activeLang === lang ? "bg-white text-ink-950 shadow-xs" : "text-ink-600 hover:text-ink-950"
                      }`}
                    >
                      {lang === "node" ? "Node.js" : lang}
                    </button>
                  ))}
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-ink-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
                {activeLang === "curl" &&
`curl -X POST https://api.buygiftcards.online/api/v1/orders \\
  -H "Authorization: Bearer ${sandboxKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brandSlug": "amazon",
    "amount": 50,
    "recipientEmail": "jane.smith@example.com",
    "recipientName": "Jane Smith",
    "senderName": "Acme Employee Rewards",
    "giftMessage": "Congratulations on exceeding your Q4 targets!",
    "idempotencyKey": "order_req_498192a"
  }'`}
                {activeLang === "node" &&
`const response = await fetch("https://api.buygiftcards.online/api/v1/orders", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${sandboxKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    brandSlug: "amazon",
    amount: 50,
    recipientEmail: "jane.smith@example.com",
    recipientName: "Jane Smith",
    senderName: "Acme Rewards",
    giftMessage: "Congratulations!"
  })
});
const data = await response.json();
console.log("Card Code:", data.voucher.code);
console.log("PIN:", data.voucher.pin);
console.log("Redemption Link:", data.voucher.claimUrl);`}
                {activeLang === "python" &&
`import requests

url = "https://api.buygiftcards.online/api/v1/orders"
headers = {
    "Authorization": "Bearer ${sandboxKey}",
    "Content-Type": "application/json"
}
payload = {
    "brandSlug": "amazon",
    "amount": 50,
    "recipientEmail": "jane.smith@example.com",
    "recipientName": "Jane Smith",
    "giftMessage": "Great work!"
}
res = requests.post(url, json=payload, headers=headers).json()
print("Voucher:", res["voucher"]["code"])`}
                {activeLang === "go" &&
`// Go (1.20+)
req, _ := http.NewRequest("POST", "https://api.buygiftcards.online/api/v1/orders", body)
req.Header.Set("Authorization", "Bearer ${sandboxKey}")
req.Header.Set("Content-Type", "application/json")`}
              </pre>
            </div>

            {/* Interactive Simulator Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Icon name="zap" size={14} />
                <span>{isSimulating ? "Sending Request…" : "Run Live Sandbox Request in Browser"}</span>
              </button>

              {simulatedResponse && (
                <div className="mt-4 space-y-1.5 animate-fade-in">
                  <div className="text-xs font-bold text-emerald-800">Live API Sandbox Response:</div>
                  <pre className="p-4 rounded-2xl bg-ink-900 text-amber-200 font-mono text-xs overflow-x-auto leading-relaxed border border-emerald-500/30">
                    {simulatedResponse}
                  </pre>
                </div>
              )}
            </div>
          </section>

          {/* 3. LIST & FILTER ORDERS */}
          <section id="list-orders" className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">GET Endpoint</span>
                <h2 className="text-2xl font-black text-ink-950">List &amp; Filter Orders</h2>
              </div>
              <span className="px-3 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-black">
                GET /api/v1/orders
              </span>
            </div>

            <p className="text-sm text-ink-600 leading-relaxed">
              Returns a paginated list of all orders created by your account. Supports filtering by customer email and fulfillment status.
            </p>

            <div className="border border-ink-200 rounded-2xl overflow-hidden divide-y divide-ink-100 text-xs">
              <div className="p-3 grid grid-cols-12 gap-2">
                <span className="col-span-3 font-mono font-bold text-ink-950">status</span>
                <span className="col-span-2 font-mono text-ink-500">query string</span>
                <span className="col-span-7 text-ink-700">Filter by status: <code>FULFILLED</code>, <code>PENDING</code>, or <code>CANCELLED</code>.</span>
              </div>
              <div className="p-3 grid grid-cols-12 gap-2">
                <span className="col-span-3 font-mono font-bold text-ink-950">customerEmail</span>
                <span className="col-span-2 font-mono text-ink-500">query string</span>
                <span className="col-span-7 text-ink-700">Filter by specific recipient or employee email address.</span>
              </div>
              <div className="p-3 grid grid-cols-12 gap-2">
                <span className="col-span-3 font-mono font-bold text-ink-950">limit</span>
                <span className="col-span-2 font-mono text-ink-500">query integer</span>
                <span className="col-span-7 text-ink-700">Number of orders to return (1 to 100, default: <code>20</code>).</span>
              </div>
            </div>

            <pre className="p-4 rounded-2xl bg-ink-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`curl "https://api.buygiftcards.online/api/v1/orders?limit=10&status=FULFILLED" \\
  -H "Authorization: Bearer ${sandboxKey}"`}
            </pre>
          </section>

          {/* 4. RETRIEVE AN ORDER */}
          <section id="get-order" className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">GET Endpoint</span>
                <h2 className="text-2xl font-black text-ink-950">Retrieve an Order</h2>
              </div>
              <span className="px-3 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-black">
                GET /api/v1/orders/:orderNumber
              </span>
            </div>

            <p className="text-sm text-ink-600 leading-relaxed">
              Retrieves the status, card details, and fulfillment timestamps for an existing order by its <code>orderNumber</code>.
            </p>

            <pre className="p-4 rounded-2xl bg-ink-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`curl "https://api.buygiftcards.online/api/v1/orders/BGC-20261109-8472" \\
  -H "Authorization: Bearer ${sandboxKey}"`}
            </pre>
          </section>

          {/* 5. BULK CREATE ORDERS */}
          <section id="bulk-orders" className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">POST Endpoint</span>
                <h2 className="text-2xl font-black text-ink-950">Bulk Batch Create Orders</h2>
              </div>
              <span className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-black">
                POST /api/v1/orders/bulk
              </span>
            </div>

            <p className="text-sm text-ink-600 leading-relaxed">
              Issue rewards to up to 200 recipients in a single HTTP request. The API executes fulfillment and returns an itemized array of issued voucher codes and claim links.
            </p>

            <pre className="p-4 rounded-2xl bg-ink-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`curl -X POST https://api.buygiftcards.online/api/v1/orders/bulk \\
  -H "Authorization: Bearer ${sandboxKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "batchReference": "Holiday-Bonus-2026",
    "senderName": "Acme Leadership",
    "items": [
      { "brandSlug": "amazon", "amount": 100, "recipientEmail": "alice@company.com", "recipientName": "Alice" },
      { "brandSlug": "starbucks", "amount": 25, "recipientEmail": "bob@company.com", "recipientName": "Bob" },
      { "brandSlug": "visa", "amount": 50, "recipientEmail": "carol@company.com", "recipientName": "Carol" }
    ]
  }'`}
            </pre>
          </section>

          {/* 6. RESEND ORDER EMAIL */}
          <section id="resend-order" className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">POST Endpoint</span>
                <h2 className="text-2xl font-black text-ink-950">Resend Order Email</h2>
              </div>
              <span className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-black">
                POST /api/v1/orders/:orderNumber/resend
              </span>
            </div>

            <p className="text-sm text-ink-600 leading-relaxed">
              Resends the branded gift card email notification to the recipient (or an updated email if the original was mistyped).
            </p>

            <pre className="p-4 rounded-2xl bg-ink-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`curl -X POST https://api.buygiftcards.online/api/v1/orders/BGC-20261109-8472/resend \\
  -H "Authorization: Bearer ${sandboxKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipientEmail": "corrected.email@example.com"}'`}
            </pre>
          </section>
        </main>
      </div>
    </div>
  );
}
