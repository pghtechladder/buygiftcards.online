"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function PlatformApiDocsPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "node" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const sandboxKey = "bgc_test_platform_2026";

  const codeSnippets = {
    curl: `curl -X POST https://buygiftcards.online/api/v1/giftcards/issue \\
  -H "Authorization: Bearer ${sandboxKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brandSlug": "amazon",
    "amount": 50,
    "recipientEmail": "jane.smith@example.com",
    "recipientName": "Jane Smith",
    "senderName": "Acme Rewards",
    "giftMessage": "Thank you for being an exceptional team member!"
  }'`,
    node: `// Node.js (Fetch)
const response = await fetch("https://buygiftcards.online/api/v1/giftcards/issue", {
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
    giftMessage: "Great job this quarter!"
  })
});

const data = await response.json();
console.log("Voucher Code:", data.voucher.code);
console.log("Claim URL:", data.voucher.claimUrl);`,
    python: `# Python (requests)
import requests

url = "https://buygiftcards.online/api/v1/giftcards/issue"
headers = {
    "Authorization": "Bearer ${sandboxKey}",
    "Content-Type": "application/json"
}
payload = {
    "brandSlug": "amazon",
    "amount": 50,
    "recipientEmail": "jane.smith@example.com",
    "recipientName": "Jane Smith",
    "senderName": "Acme Rewards",
    "giftMessage": "Great job this quarter!"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Voucher Code:", data["voucher"]["code"])
print("Claim URL:", data["voucher"]["claimUrl"])`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-ink-500 font-semibold">
            <Link href="/platform" className="hover:text-brand-600">Platform</Link>
            <span>/</span>
            <span className="text-ink-900 font-bold">Gift Card API Documentation</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-ink-950">
                Gift Card REST API &amp; Developer Guide
              </h1>
              <p className="text-sm sm:text-base text-ink-600 mt-1 max-w-2xl">
                Automate digital rewards, incentive delivery, and prepaid cards in real time across 165+ top global brands.
              </p>
            </div>
            <Link
              href="/platform#book-demo"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition"
            >
              Request Production API Key &rarr;
            </Link>
          </div>
        </div>

        {/* Sandbox Key Callout */}
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-brand-900">
                Public Developer Sandbox Key
              </span>
            </div>
            <p className="text-xs text-brand-700">
              Use this instant sandbox key to test API requests without charging real funds or signing a contract:
            </p>
            <div className="font-mono text-xs font-bold text-ink-950 bg-white/80 px-2.5 py-1 rounded-md border border-brand-200 inline-block">
              {sandboxKey}
            </div>
          </div>
          <Link
            href="/platform#book-demo"
            className="text-xs font-extrabold text-brand-700 hover:underline flex-shrink-0"
          >
            Upgrade to Live Key &rarr;
          </Link>
        </div>

        {/* Interactive Quickstart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink-950">Quickstart: Issue a Gift Card</h2>
            <div className="flex rounded-xl bg-ink-100 p-1">
              {(["curl", "node", "python"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold capitalize transition ${
                    activeTab === tab
                      ? "bg-white text-ink-950 shadow-xs"
                      : "text-ink-600 hover:text-ink-950"
                  }`}
                >
                  {tab === "node" ? "Node.js" : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl bg-ink-950 text-white overflow-hidden shadow-xl border border-ink-800">
            <div className="flex items-center justify-between px-4 py-2.5 bg-ink-900 border-b border-ink-800 text-xs font-mono text-ink-400">
              <span>POST /api/v1/giftcards/issue</span>
              <button
                type="button"
                onClick={copyCode}
                className="text-xs font-sans font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed text-emerald-300">
              {codeSnippets[activeTab]}
            </pre>
          </div>
        </div>

        {/* Live Response Example */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-500">
            Sample Successful Response (201 Created)
          </h3>
          <div className="rounded-2xl bg-ink-900 text-white p-4 sm:p-5 text-xs font-mono overflow-x-auto leading-relaxed border border-ink-800 text-amber-200">
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
          </div>
        </div>

        {/* API Endpoints Directory */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-extrabold text-ink-950">Available REST Endpoints</h2>
          <div className="border border-ink-200 rounded-2xl overflow-hidden divide-y divide-ink-100 text-sm">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-black">
                    GET
                  </span>
                  <span className="font-mono font-bold text-ink-950">/api/v1/catalog</span>
                </div>
                <p className="text-xs text-ink-600">
                  Returns live catalog of 165+ brands, denominations, discount percentages, and availability.
                </p>
              </div>
              <span className="text-xs font-bold text-ink-400">Public or Authenticated</span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                    POST
                  </span>
                  <span className="font-mono font-bold text-ink-950">/api/v1/giftcards/issue</span>
                </div>
                <p className="text-xs text-ink-600">
                  Issues a single digital gift card in real-time. Returns voucher codes and claim URLs immediately.
                </p>
              </div>
              <span className="text-xs font-bold text-brand-700">Bearer Auth Required</span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                    POST
                  </span>
                  <span className="font-mono font-bold text-ink-950">/api/v1/orders/bulk</span>
                </div>
                <p className="text-xs text-ink-600">
                  Batch issue up to 200 gift cards in a single API call for bulk payroll or holiday incentives.
                </p>
              </div>
              <span className="text-xs font-bold text-brand-700">Bearer Auth Required</span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-black">
                    GET
                  </span>
                  <span className="font-mono font-bold text-ink-950">/api/v1/orders/[orderNumber]</span>
                </div>
                <p className="text-xs text-ink-600">
                  Look up order status, fulfillment timestamps, and retrieve voucher credentials.
                </p>
              </div>
              <span className="text-xs font-bold text-brand-700">Bearer Auth Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

