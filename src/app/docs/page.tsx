"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

type NavSection =
  | "intro"
  | "urls"
  | "auth"
  | "idempotency"
  | "catalog"
  | "issue"
  | "bulk"
  | "get-order"
  | "choice-cards"
  | "webhooks"
  | "errors";

export default function ApiDocumentationPage() {
  const [activeSection, setActiveSection] = useState<NavSection>("intro");
  const [selectedLang, setSelectedLang] = useState<"curl" | "node" | "python" | "go">("curl");
  const [copiedKey, setCopiedKey] = useState(false);

  const sandboxKey = "bgc_test_platform_2026";

  const copySandboxKey = () => {
    navigator.clipboard.writeText(sandboxKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="bg-ink-50/50 min-h-screen text-ink-900">
      {/* Top Docs Header */}
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
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-ink-100 text-ink-700">
            API v1 Docs
          </span>
          <span className="hidden sm:inline text-xs font-mono text-ink-400">
            api.buygiftcards.online/docs
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-ink-50 px-2.5 py-1 rounded-lg border border-ink-200 text-xs font-mono">
            <span className="text-ink-500">Test Key:</span>
            <span className="font-bold text-ink-900">{sandboxKey}</span>
            <button
              onClick={copySandboxKey}
              className="text-brand-600 hover:text-brand-700 font-sans font-bold text-[11px]"
            >
              {copiedKey ? "Copied" : "Copy"}
            </button>
          </div>
          <Link
            href="/platform#book-demo"
            className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition"
          >
            Get Production Key
          </Link>
        </div>
      </header>

      {/* Docs Body: 2-Column Sidebar + Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Sidebar Nav */}
        <aside className="lg:col-span-3 sticky top-20 bg-white border border-ink-200/80 rounded-2xl p-4 shadow-xs space-y-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-ink-400 mb-2 px-2">
              Getting Started
            </div>
            <nav className="space-y-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSection("intro")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                  activeSection === "intro" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                Introduction &amp; Pricing
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("urls")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                  activeSection === "urls" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                Environments &amp; Base URLs
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("auth")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                  activeSection === "auth" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                Authentication
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("idempotency")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                  activeSection === "idempotency" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                Idempotency &amp; Rate Limits
              </button>
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-ink-400 mb-2 px-2">
              Catalog API
            </div>
            <nav className="space-y-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSection("catalog")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                  activeSection === "catalog" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                <span>List Available Brands</span>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-black">GET</span>
              </button>
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-ink-400 mb-2 px-2">
              Orders &amp; Issuance
            </div>
            <nav className="space-y-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSection("issue")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                  activeSection === "issue" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                <span>Issue Gift Card</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">POST</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("bulk")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                  activeSection === "bulk" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                <span>Bulk Batch Orders</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">POST</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("get-order")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                  activeSection === "get-order" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                <span>Get Order Status</span>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-black">GET</span>
              </button>
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-ink-400 mb-2 px-2">
              Choice Cards &amp; Webhooks
            </div>
            <nav className="space-y-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSection("choice-cards")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                  activeSection === "choice-cards" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                Multi-Brand Choice Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("webhooks")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                  activeSection === "webhooks" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                Webhooks &amp; Signatures
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("errors")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                  activeSection === "errors" ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                Error Codes &amp; Handling
              </button>
            </nav>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="lg:col-span-9 space-y-10">
          {/* Section: Introduction */}
          {activeSection === "intro" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                <span>BuyGiftCards API Platform</span>
              </div>
              <h1 className="text-3xl font-black text-ink-950">Introduction</h1>
              <p className="text-ink-600 text-sm sm:text-base leading-relaxed">
                The BuyGiftCards REST API allows platforms, HR systems, customer loyalty applications,
                and enterprise portals to programmatically browse, purchase, and distribute digital gift
                cards across <strong>165+ top global brands</strong> (Amazon, Starbucks, Target, Uber, Nike, Apple, and open-loop Visa &amp; Mastercard).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200/80">
                  <div className="text-emerald-600 font-extrabold text-lg">$0 Platform Fee</div>
                  <div className="text-xs text-ink-500 mt-1">No monthly subscription or software licenses.</div>
                </div>
                <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200/80">
                  <div className="text-emerald-600 font-extrabold text-lg">$0 Per-Card Fee</div>
                  <div className="text-xs text-ink-500 mt-1">Pay face value on retail cards; keep wholesale margins.</div>
                </div>
                <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200/80">
                  <div className="text-emerald-600 font-extrabold text-lg">&lt; 500ms</div>
                  <div className="text-xs text-ink-500 mt-1">Synchronous digital card code &amp; PIN issuance.</div>
                </div>
              </div>

              <div className="pt-4 border-t border-ink-100 flex items-center justify-between">
                <span className="text-xs text-ink-400">Ready to start?</span>
                <button
                  onClick={() => setActiveSection("urls")}
                  className="text-xs font-extrabold text-brand-600 hover:text-brand-700"
                >
                  Environments &amp; Base URLs &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Section: Base URLs & Environments */}
          {activeSection === "urls" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <h2 className="text-2xl font-black text-ink-950">Environments &amp; Base URLs</h2>
              <p className="text-sm text-ink-600 leading-relaxed">
                Like Stripe and Giftronaut, your API environment is determined automatically by the API key prefix.
                You can target either the direct API subdomain or the primary domain:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-ink-950 text-white space-y-1.5">
                  <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    Recommended Base URL
                  </div>
                  <div className="text-sm">https://api.buygiftcards.online/api/v1</div>
                </div>
                <div className="p-4 rounded-2xl bg-ink-100 text-ink-800 space-y-1.5">
                  <div className="text-ink-500 font-bold uppercase tracking-wider text-[10px]">
                    Alternative Endpoint
                  </div>
                  <div className="text-sm">https://buygiftcards.online/api/v1</div>
                </div>
              </div>

              <div className="border border-brand-200 bg-brand-50/50 rounded-2xl p-4 text-xs text-brand-900 space-y-1.5">
                <div className="font-extrabold">Dynamic Environment Routing:</div>
                <ul className="list-disc pl-5 space-y-1 text-brand-800">
                  <li>Keys starting with <code className="font-mono bg-white px-1 rounded">bgc_test_</code> run in <strong>Sandbox Mode</strong> (mock codes, $0 cost).</li>
                  <li>Keys starting with <code className="font-mono bg-white px-1 rounded">bgc_live_</code> route to <strong>Live Production Providers</strong> (real vouchers delivered).</li>
                </ul>
              </div>
            </div>
          )}

          {/* Section: Authentication */}
          {activeSection === "auth" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <h2 className="text-2xl font-black text-ink-950">Authentication</h2>
              <p className="text-sm text-ink-600 leading-relaxed">
                Authenticate all API requests by providing your key in the standard <code className="font-mono text-xs bg-ink-100 px-1 py-0.5 rounded">Authorization</code> header:
              </p>

              <div className="p-4 rounded-2xl bg-ink-950 text-white font-mono text-xs leading-relaxed">
                <span className="text-ink-400">Authorization:</span> Bearer {sandboxKey}
              </div>

              <p className="text-xs text-ink-500">
                You may also pass <code className="font-mono bg-ink-100 px-1 py-0.5 rounded">x-api-key: {sandboxKey}</code> if your client framework does not support the Bearer scheme.
              </p>
            </div>
          )}

          {/* Section: Idempotency */}
          {activeSection === "idempotency" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <h2 className="text-2xl font-black text-ink-950">Idempotency &amp; Rate Limits</h2>
              <p className="text-sm text-ink-600 leading-relaxed">
                To prevent accidental duplicate orders or double-charging during network retries, provide an
                <code className="font-mono text-xs bg-ink-100 px-1 py-0.5 rounded ml-1">idempotencyKey</code> in your JSON body or request headers.
              </p>
              <p className="text-sm text-ink-600 leading-relaxed">
                If an order with the same idempotency key was already created, the API will return the existing order
                and voucher credentials rather than issuing a second card.
              </p>
              <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200 text-xs text-ink-700">
                <strong>Rate Limits:</strong> Sandbox accounts allow up to 120 requests/minute. Production accounts allow up to 1,200 requests/minute.
              </div>
            </div>
          )}

          {/* Section: Catalog */}
          {activeSection === "catalog" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">GET Endpoint</span>
                  <h2 className="text-2xl font-black text-ink-950">List Available Catalog</h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-black">
                  GET /api/v1/catalog
                </span>
              </div>

              <p className="text-sm text-ink-600 leading-relaxed">
                Returns the list of active gift card brands, supported denominations, min/max values, and available reseller discounts.
              </p>

              <div className="p-4 rounded-2xl bg-ink-950 text-white font-mono text-xs overflow-x-auto">
                <span className="text-ink-400">curl</span> https://api.buygiftcards.online/api/v1/catalog?country=US \<br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer {sandboxKey}&quot;
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-ink-500 uppercase">Response Example (200 OK)</div>
                <pre className="p-4 rounded-2xl bg-ink-900 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`{
  "status": "success",
  "country": "US",
  "currency": "USD",
  "itemCount": 76,
  "testMode": true,
  "catalog": [
    {
      "id": "amazon",
      "name": "Amazon",
      "category": "Shopping",
      "minAmount": 15,
      "maxAmount": 500,
      "fixedDenominationsOnly": false,
      "supportedDenominations": [25, 50, 100, 200, 500],
      "deliveryTypes": ["egift", "physical"],
      "currency": "USD",
      "discountPercent": 0
    },
    {
      "id": "buygiftcards",
      "name": "BuyGiftCards.online Choice Card",
      "category": "Multi-Brand",
      "minAmount": 10,
      "maxAmount": 500,
      "supportedDenominations": [25, 50, 75, 100, 150, 250, 500],
      "discountPercent": 5
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {/* Section: Issue Single Gift Card */}
          {activeSection === "issue" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">POST Endpoint</span>
                  <h2 className="text-2xl font-black text-ink-950">Issue a Gift Card</h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-black">
                  POST /api/v1/giftcards/issue
                </span>
              </div>

              <p className="text-sm text-ink-600 leading-relaxed">
                Synchronously orders and issues a digital gift card code. The API returns the voucher code, PIN, and claim URL in real time.
              </p>

              {/* Language Switcher */}
              <div className="flex rounded-xl bg-ink-100 p-1 w-fit">
                {(["curl", "node", "python", "go"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                      selectedLang === lang ? "bg-white text-ink-950 shadow-xs" : "text-ink-600 hover:text-ink-950"
                    }`}
                  >
                    {lang === "node" ? "Node.js" : lang}
                  </button>
                ))}
              </div>

              <pre className="p-4 rounded-2xl bg-ink-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
                {selectedLang === "curl" &&
`curl -X POST https://api.buygiftcards.online/api/v1/giftcards/issue \\
  -H "Authorization: Bearer ${sandboxKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brandSlug": "amazon",
    "amount": 50,
    "recipientEmail": "jane.smith@example.com",
    "recipientName": "Jane Smith",
    "senderName": "Acme Rewards",
    "giftMessage": "Congratulations on your performance this quarter!",
    "idempotencyKey": "order_req_99281a"
  }'`}
                {selectedLang === "node" &&
`const res = await fetch("https://api.buygiftcards.online/api/v1/giftcards/issue", {
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
    giftMessage: "Great job!"
  })
});
const order = await res.json();
console.log(order.voucher.code, order.voucher.claimUrl);`}
                {selectedLang === "python" &&
`import requests

url = "https://api.buygiftcards.online/api/v1/giftcards/issue"
headers = {"Authorization": "Bearer ${sandboxKey}"}
data = {
    "brandSlug": "amazon",
    "amount": 50,
    "recipientEmail": "jane.smith@example.com",
    "recipientName": "Jane Smith",
    "giftMessage": "Great job!"
}
res = requests.post(url, json=data, headers=headers).json()
print("Card Code:", res["voucher"]["code"])`}
                {selectedLang === "go" &&
`// Go (1.20+)
req, _ := http.NewRequest("POST", "https://api.buygiftcards.online/api/v1/giftcards/issue", payload)
req.Header.Set("Authorization", "Bearer ${sandboxKey}")
req.Header.Set("Content-Type", "application/json")`}
              </pre>

              <div className="space-y-2">
                <div className="text-xs font-bold text-ink-500 uppercase">Response (201 Created)</div>
                <pre className="p-4 rounded-2xl bg-ink-900 text-amber-200 font-mono text-xs overflow-x-auto leading-relaxed">
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
    "deliveryType": "egift"
  },
  "issuedAt": "2026-11-09T16:00:00.000Z"
}`}
                </pre>
              </div>
            </div>
          )}

          {/* Section: Bulk Orders */}
          {activeSection === "bulk" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">POST Endpoint</span>
                  <h2 className="text-2xl font-black text-ink-950">Bulk Batch Order API</h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-black">
                  POST /api/v1/orders/bulk
                </span>
              </div>

              <p className="text-sm text-ink-600 leading-relaxed">
                Send to up to 200 recipients simultaneously in a single API request. Ideal for quarterly bonuses, marketing giveaways, and automated payroll bonuses.
              </p>

              <pre className="p-4 rounded-2xl bg-ink-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`curl -X POST https://api.buygiftcards.online/api/v1/orders/bulk \\
  -H "Authorization: Bearer ${sandboxKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "batchReference": "Q4-Bonus-Batch-101",
    "senderName": "Acme Leadership",
    "items": [
      { "brandSlug": "amazon", "amount": 50, "recipientEmail": "alice@company.com", "recipientName": "Alice" },
      { "brandSlug": "starbucks", "amount": 25, "recipientEmail": "bob@company.com", "recipientName": "Bob" },
      { "brandSlug": "buygiftcards", "amount": 100, "recipientEmail": "carol@company.com", "recipientName": "Carol" }
    ]
  }'`}
              </pre>
            </div>
          )}

          {/* Section: Choice Cards */}
          {activeSection === "choice-cards" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <h2 className="text-2xl font-black text-ink-950">Multi-Brand Choice Cards</h2>
              <p className="text-sm text-ink-600 leading-relaxed">
                When you do not know which specific store a recipient prefers, issue a <code className="font-mono bg-ink-100 px-1 py-0.5 rounded">buygiftcards</code> Choice Card.
              </p>
              <div className="space-y-3 text-sm text-ink-700">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  <span>Issue card via API with <code className="font-mono text-xs bg-ink-100 px-1 rounded">&quot;brandSlug&quot;: &quot;buygiftcards&quot;</code>.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  <span>Recipient visits <Link href="/redeem" className="text-brand-600 font-bold underline">buygiftcards.online/redeem</Link> and enters their card number.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  <span>Recipient swaps or splits their balance into any of the 165+ retail brands with instant code issuance.</span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Webhooks */}
          {activeSection === "webhooks" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <h2 className="text-2xl font-black text-ink-950">Webhooks &amp; Signatures</h2>
              <p className="text-sm text-ink-600 leading-relaxed">
                Subscribe to asynchronous webhook notifications when physical cards ship or when recipients claim their digital vouchers.
              </p>
              <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200 text-xs font-mono text-ink-800 space-y-1">
                <div>Headers passed on webhook events:</div>
                <div className="text-brand-700 font-bold">X-BGC-Signature: t=1794240000,v1=9f82ab...</div>
                <div className="text-ink-500">Event types: order.fulfilled, voucher.claimed, voucher.redeemed</div>
              </div>
            </div>
          )}

          {/* Section: Errors */}
          {activeSection === "errors" && (
            <div className="bg-white border border-ink-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <h2 className="text-2xl font-black text-ink-950">Error Codes</h2>
              <div className="border border-ink-200 rounded-2xl overflow-hidden divide-y divide-ink-100 text-xs">
                <div className="p-3 bg-ink-50 font-bold flex justify-between">
                  <span>HTTP Code</span>
                  <span>Meaning</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="font-mono font-bold text-red-600">401 Unauthorized</span>
                  <span className="text-ink-600">Missing or invalid Bearer API key.</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="font-mono font-bold text-red-600">404 Not Found</span>
                  <span className="text-ink-600">Brand slug does not exist in the active country catalog.</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="font-mono font-bold text-amber-600">422 Validation Error</span>
                  <span className="text-ink-600">Invalid amount (outside min/max or not a supported denomination).</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="font-mono font-bold text-amber-600">429 Rate Limited</span>
                  <span className="text-ink-600">Exceeded requests per minute; check Retry-After header.</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
