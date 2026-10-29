import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      <div className="rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-ink-950 text-white p-8 sm:p-12 shadow-xl">
        <div className="text-xs font-extrabold uppercase tracking-widest text-amber-300 mb-3">About buygiftcards.online</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Instant digital &amp; physical gifting, simplified.</h1>
        <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-2xl">
          buygiftcards.online combines a curated catalog of 165+ leading retail, dining, travel, and entertainment
          brands with enterprise-grade Stripe Checkout, real-time Giftbit reward fulfillment, and Zoho SMTP
          transactional delivery.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <Icon name="zap" size={18} />
          </div>
          <h3 className="font-extrabold text-sm mb-1.5">Giftbit API Fulfillment</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            Integrated with Giftbit&apos;s REST API v1 (`/papi/v1/direct_links`) to generate instant, single-use reward
            claim URLs and Multi-Brand choice links upon checkout.
          </p>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <Icon name="lock" size={18} />
          </div>
          <h3 className="font-extrabold text-sm mb-1.5">Stripe Payments &amp; Tax</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            Every cart item is re-validated against server-side pricing rules before creating a Stripe Checkout
            Session or corporate Stripe Invoice.
          </p>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <Icon name="mail" size={18} />
          </div>
          <h3 className="font-extrabold text-sm mb-1.5">Zoho Mail Delivery</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            Order confirmations, recipient gift notifications, password resets, and support tickets are delivered
            reliably via authenticated Zoho SMTP.
          </p>
        </div>
      </div>

      <div className="bg-white border border-ink-100 rounded-3xl p-8 shadow-sm space-y-4 text-sm text-ink-700 leading-relaxed">
        <h2 className="text-lg font-extrabold text-ink-900">Trademark &amp; Brand Notice</h2>
        <p>
          All merchant names, logos, and trademarks displayed on buygiftcards.online remain the sole property of their
          respective owners and are used strictly to identify the gift card products available for purchase.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/catalog" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 transition">
            Browse All 165+ Brands
          </Link>
          <Link href="/support" className="px-5 py-2.5 rounded-xl border border-ink-200 text-ink-700 text-xs font-bold hover:bg-ink-50 transition">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
