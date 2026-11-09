"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function PlatformPage() {
  const [calcAmount, setCalcAmount] = useState(50);
  const [calcCards, setCalcCards] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    annualVolume: "$10k - $50k",
    useCase: "Employee Rewards & Recognition",
    notes: "",
  });

  const rewardsTotal = calcAmount * calcCards;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-ink-100 bg-gradient-to-b from-brand-50/40 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-extrabold uppercase tracking-widest">
                <span>⚡ Enterprise Rewards &amp; Platform API</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink-950 tracking-tight leading-[1.08]">
                Simple Gift Card Pricing. <br />
                <span className="text-brand-600">Pay Only for the Rewards You Send.</span>
              </h1>
              <p className="text-base sm:text-lg text-ink-600 leading-relaxed max-w-xl">
                No platform fees, subscriptions, or per-card fees. Every enterprise feature, the full
                165+ brand catalog, and the developer API come free with every account. ACH and wire funding cost nothing.
              </p>

              <div className="flex flex-wrap gap-3.5 pt-2">
                <Link
                  href="/platform/api"
                  className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm transition shadow-md shadow-brand-600/20 flex items-center gap-2"
                >
                  <Icon name="code" size={16} />
                  <span>Explore Gift Card API</span>
                </Link>
                <a
                  href="#book-demo"
                  className="px-6 py-3.5 rounded-xl border-2 border-ink-200 hover:border-ink-900 text-ink-900 font-extrabold text-sm transition bg-white"
                >
                  Book a Demo &amp; Get API Keys
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-ink-500 font-bold">
                <div className="flex items-center gap-1.5 text-ink-700">
                  <span className="text-emerald-600 text-base">✓</span>
                  <span>$0 Platform Fees</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-700">
                  <span className="text-emerald-600 text-base">✓</span>
                  <span>$0 Subscription</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-700">
                  <span className="text-emerald-600 text-base">✓</span>
                  <span>Free ACH &amp; Wire Funding</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-700">
                  <span className="text-emerald-600 text-base">✓</span>
                  <span>165+ Global Brands</span>
                </div>
              </div>
            </div>

            {/* Right Receipt Mockup (Replicating the screenshot's receipt design) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm">
                <div className="relative bg-white border border-ink-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                  {/* Receipt Header */}
                  <div className="text-center border-b border-dashed border-ink-200 pb-4">
                    <div className="text-[10px] uppercase font-black tracking-widest text-brand-600">
                      BUYGIFTCARDS ENTERPRISE
                    </div>
                    <div className="text-xs text-ink-400 font-mono mt-0.5">ESTIMATE RECEIPT</div>
                  </div>

                  {/* Calculator Inputs */}
                  <div className="space-y-3 bg-ink-50 p-3.5 rounded-2xl border border-ink-100">
                    <div className="flex items-center justify-between text-xs font-bold text-ink-700">
                      <span>Reward Value per Card</span>
                      <span className="text-brand-700 font-black">${calcAmount}</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={500}
                      step={5}
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Number(e.target.value))}
                      className="w-full accent-brand-600"
                    />

                    <div className="flex items-center justify-between text-xs font-bold text-ink-700 pt-1">
                      <span>Number of Recipients</span>
                      <span className="text-brand-700 font-black">{calcCards} cards</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={500}
                      step={1}
                      value={calcCards}
                      onChange={(e) => setCalcCards(Number(e.target.value))}
                      className="w-full accent-brand-600"
                    />
                  </div>

                  {/* Itemized Line Items */}
                  <div className="space-y-2.5 text-sm font-mono text-ink-800">
                    <div className="flex justify-between">
                      <span>Gift card rewards ({calcCards}x ${calcAmount}):</span>
                      <span className="font-bold">${rewardsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Platform fee:</span>
                      <span className="font-bold">$0.00</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Subscription fee:</span>
                      <span className="font-bold">$0.00</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Per-card fee:</span>
                      <span className="font-bold">$0.00</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>REST API Access:</span>
                      <span className="font-bold">$0.00</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t-2 border-ink-950 flex justify-between items-baseline font-mono">
                    <span className="text-lg font-black text-ink-950">Total</span>
                    <span className="text-2xl font-black text-ink-950">${rewardsTotal.toFixed(2)}</span>
                  </div>

                  <div className="text-center text-[11px] text-ink-400 font-mono">
                    ACH or wire funding is 100% free · Instant fulfillment
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT YOU PAY TABLE */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-ink-950">What You Pay on BuyGiftCards</h2>
          <p className="text-ink-600 mt-2 text-sm sm:text-base">
            We charge no subscription, platform, setup, or per-card fees. You pay only the face value
            of each reward you send. ACH and wire funding are always free.
          </p>
        </div>

        <div className="border border-ink-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 border-b border-ink-200 text-xs font-black uppercase text-ink-500">
              <tr>
                <th className="py-4 px-6">Cost Category</th>
                <th className="py-4 px-6 text-brand-700">What You Pay with Us</th>
                <th className="py-4 px-6 text-ink-400 hidden sm:table-cell">Traditional Vendors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 font-medium">
              <tr>
                <td className="py-4 px-6 font-bold text-ink-950">Platform access &amp; portal</td>
                <td className="py-4 px-6 text-emerald-600 font-bold">$0. No subscription or per-seat fees.</td>
                <td className="py-4 px-6 text-ink-400 line-through hidden sm:table-cell">$199 - $500 / month</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-ink-950">Gift Card REST API</td>
                <td className="py-4 px-6 text-emerald-600 font-bold">$0. Included free with developer keys.</td>
                <td className="py-4 px-6 text-ink-400 line-through hidden sm:table-cell">$1,500 setup fee</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-ink-950">Per-card issuance fee</td>
                <td className="py-4 px-6 text-emerald-600 font-bold">$0. Pay only face value for retail brands.</td>
                <td className="py-4 px-6 text-ink-400 line-through hidden sm:table-cell">$0.50 - $1.50 per card</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-ink-950">ACH &amp; Wire account funding</td>
                <td className="py-4 px-6 text-emerald-600 font-bold">$0. Free business transfers.</td>
                <td className="py-4 px-6 text-ink-400 hidden sm:table-cell">$15 - $25 per wire</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-ink-950">Credit card funding</td>
                <td className="py-4 px-6 text-ink-700">3% standard interchange (optional)</td>
                <td className="py-4 px-6 text-ink-500 hidden sm:table-cell">3.5% - 4.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. THREE CORE PLATFORM WAYS TO CONNECT */}
      <section className="py-16 bg-ink-50 border-y border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-black uppercase tracking-widest text-brand-600 mb-1">
              FLEXIBLE INTEGRATION
            </div>
            <h2 className="text-3xl font-extrabold text-ink-950">Three Ways to Send Rewards</h2>
            <p className="text-ink-600 mt-2 text-sm sm:text-base">
              Choose the workflow that fits your team: instant API automation, one-click spreadsheet bulk uploads, or white-glove corporate invoicing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. REST API */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ink-100 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon name="code" size={24} />
                </div>
                <h3 className="text-xl font-extrabold text-ink-950">Gift Card REST API</h3>
                <p className="text-sm text-ink-600 leading-relaxed">
                  Embed digital rewards directly into your HR app, customer loyalty workflow, or survey tool. Issue cards synchronously in under 500ms.
                </p>
                <div className="bg-ink-950 text-emerald-400 p-3 rounded-xl font-mono text-xs">
                  POST /api/v1/giftcards/issue
                </div>
              </div>
              <div className="pt-6">
                <Link
                  href="/platform/api"
                  className="inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-600 hover:text-brand-700"
                >
                  <span>View API Docs</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* 2. Bulk CSV Upload */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ink-100 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Icon name="zap" size={24} />
                </div>
                <h3 className="text-xl font-extrabold text-ink-950">Bulk CSV Ordering</h3>
                <p className="text-sm text-ink-600 leading-relaxed">
                  Send to 10 or 10,000 employees at once. Download our spreadsheet template, paste your recipient names and emails, and deliver in one click.
                </p>
                <div className="bg-ink-100 text-ink-800 p-3 rounded-xl font-mono text-xs">
                  CSV: email, name, brand, amount
                </div>
              </div>
              <div className="pt-6">
                <Link
                  href="/business"
                  className="inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-600 hover:text-brand-700"
                >
                  <span>Open Bulk Ordering Tool</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* 3. House Choice Cards */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ink-100 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Icon name="gift" size={24} />
                </div>
                <h3 className="text-xl font-extrabold text-ink-950">BuyGiftCards Choice Card</h3>
                <p className="text-sm text-ink-600 leading-relaxed">
                  Don&apos;t know what brand each person wants? Send the all-in-one Choice Card. Recipients choose their favorite brand at buygiftcards.online/redeem.
                </p>
                <div className="bg-brand-50 text-brand-800 p-3 rounded-xl font-mono text-xs">
                  165+ brands · Zero expiration fees
                </div>
              </div>
              <div className="pt-6">
                <Link
                  href="/product/buygiftcards"
                  className="inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-600 hover:text-brand-700"
                >
                  <span>See Choice Card</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ENTERPRISE LEAD / DEMO REQUEST FORM */}
      <section id="book-demo" className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-ink-950 via-brand-950 to-ink-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
              Book a Demo &amp; Instant Sandbox Keys
            </div>
            <h2 className="text-3xl font-black">Enable Platform Access for Your Company</h2>
            <p className="text-white/80 text-sm mt-2">
              Fill out this quick form to request production API credentials, set up ACH/wire invoicing terms, or schedule a 15-minute platform walkthrough.
            </p>
          </div>

          {formSubmitted ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 p-6 rounded-2xl text-center space-y-3">
              <div className="text-3xl">🎉</div>
              <h3 className="text-xl font-bold text-white">Request Received!</h3>
              <p className="text-sm text-white/85 max-w-md mx-auto">
                Thank you! Our enterprise partnership team will email your sandbox API keys and schedule your demo within 2 business hours.
              </p>
              <div className="pt-2">
                <Link
                  href="/platform/api"
                  className="inline-flex px-5 py-2.5 rounded-xl bg-white text-ink-950 font-extrabold text-xs"
                >
                  Explore API Documentation Now &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-hidden focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-hidden focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corp"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-hidden focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">Estimated Annual Volume</label>
                <select
                  value={formData.annualVolume}
                  onChange={(e) => setFormData({ ...formData, annualVolume: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ink-900 border border-white/20 text-white text-sm focus:outline-hidden focus:border-brand-400"
                >
                  <option value="Under $10k">Under $10,000</option>
                  <option value="$10k - $50k">$10,000 - $50,000</option>
                  <option value="$50k - $250k">$50,000 - $250,000</option>
                  <option value="$250k+">$250,000+</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-white/80 mb-1">Primary Use Case</label>
                <select
                  value={formData.useCase}
                  onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ink-900 border border-white/20 text-white text-sm focus:outline-hidden focus:border-brand-400"
                >
                  <option value="Employee Rewards & Recognition">Employee Rewards &amp; Recognition</option>
                  <option value="Customer Loyalty & Promotions">Customer Loyalty &amp; Promotions</option>
                  <option value="API Integration / In-App Rewards">API Integration / In-App Rewards</option>
                  <option value="Survey Incentives">Survey Incentives</option>
                  <option value="Holiday & Corporate Gifting">Holiday &amp; Corporate Gifting</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-extrabold text-sm transition shadow-lg shadow-brand-500/30"
                >
                  Submit Request &amp; Get API Keys &rarr;
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
