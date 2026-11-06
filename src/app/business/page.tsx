import type { Metadata } from "next";
import { BusinessQuoteForm } from "@/components/BusinessQuoteForm";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Corporate Gift Cards & Bulk Employee Rewards Online — Instant B2B Delivery",
  description:
    "Buy corporate gift cards in bulk for employee rewards, client appreciation, and marketing incentives across 165+ top brands. Instant digital delivery and flexible ACH or card billing at buygiftcards.online.",
  keywords: [
    "corporate gift cards",
    "buy gift cards in bulk online",
    "employee reward gift cards",
    "b2b digital gift cards",
    "bulk egift cards for business",
  ],
  alternates: { canonical: "/business" },
};

const BENEFITS = [
  {
    icon: "zap" as const,
    title: "Instant Bulk Digital Delivery",
    body: "Deliver 10 to 10,000+ eGift claim links or One4all choice cards in a single batch with zero manual handling.",
  },
  {
    icon: "wallet" as const,
    title: "Flexible Invoice & ACH Billing",
    body: "Pay by corporate card, ACH bank transfer, or Net-15 invoice terms through Stripe Invoicing.",
  },
  {
    icon: "gift" as const,
    title: "75% Unclaimed Breakage Credit",
    body: "Powered by Giftbit: set a 1-year claim window and receive 75% of any unclaimed gift value back to your balance.",
  },
];

export default function BusinessPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-brand-900 to-[#5c0f14] text-white p-8 sm:p-12 mb-10 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-3">
            🏢 Corporate &amp; Holiday Bulk Rewards
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Gift Cards for Business &amp; Teams</h1>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed">
            Reward employees, thank clients for the holidays, or power marketing incentives across 165+ top brands.
            Build your bulk order below and receive a formal invoice within one business day.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-10">
        {BENEFITS.map((b) => (
          <div key={b.title} className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <Icon name={b.icon} size={18} />
            </div>
            <h3 className="font-extrabold text-sm mb-1.5">{b.title}</h3>
            <p className="text-xs text-ink-500 leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>

      <BusinessQuoteForm />
    </div>
  );
}
