import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "About Us — Official Digital Gift Card Store",
  description:
    "BuyGiftCards.online is a trusted online gift card store offering 165+ digital eGift and physical cards with instant email delivery and $0 purchase fees.",
  keywords: [
    "about buygiftcards.online",
    "buy gift cards online platform",
    "official digital gift card store",
    "instant egift card delivery",
    "multi-brand choice gift card",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/about" },
  openGraph: {
    title: "BuyGiftCards.online | About Our Official Digital Gift Card Store",
    description:
      "BuyGiftCards.online is a trusted online gift card store offering 165+ digital eGift and physical cards with instant email delivery and $0 purchase fees.",
    url: "https://buygiftcards.online/about",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
  },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://buygiftcards.online/about#webpage",
        url: "https://buygiftcards.online/about",
        name: "About BuyGiftCards.online — Official Digital eGift Card Marketplace",
        description:
          "Learn how BuyGiftCards.online delivers instant digital eGift cards and physical gift cards from 165+ leading retail, dining, gaming, and prepaid brands.",
        isPartOf: { "@id": "https://buygiftcards.online/#website" },
        about: { "@id": "https://buygiftcards.online/#organization" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Buy Gift Cards Online", item: "https://buygiftcards.online" },
          { "@type": "ListItem", position: 2, name: "About BuyGiftCards.online", item: "https://buygiftcards.online/about" },
        ],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <div className="rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-ink-950 text-white p-8 sm:p-12 shadow-xl">
        <div className="text-xs font-extrabold uppercase tracking-widest text-amber-300 mb-3">About buygiftcards.online</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
          Buy Gift Cards Online — Instant Digital &amp; Physical Gifting, Simplified
        </h1>
        <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-2xl">
          <strong>BuyGiftCards.online</strong> is an official online gift card marketplace offering 165+ leading retail,
          dining, travel, gaming, and prepaid Visa®/Mastercard® brands with instant digital email delivery, $0 purchase
          fees on brand cards, and secure Credit/Debit Card or PayPal checkout.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <Icon name="zap" size={18} />
          </div>
          <h2 className="font-extrabold text-sm mb-1.5">Instant Digital eGift Fulfillment</h2>
          <p className="text-xs text-ink-600 leading-relaxed">
            Connected directly to enterprise digital gift card issuers (Tango Card &amp; Zendit) to generate live,
            single-use reward claim links, PINs, and Multi-Brand choice cards immediately upon checkout.
          </p>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <Icon name="lock" size={18} />
          </div>
          <h2 className="font-extrabold text-sm mb-1.5">Credit, Debit &amp; PayPal Checkout</h2>
          <p className="text-xs text-ink-600 leading-relaxed">
            Pay securely on desktop or mobile using Visa, Mastercard, American Express, Discover, PayPal, or Venmo—with
            $0 purchase fees on retail brand gift cards and up to 15% instant savings on featured deals.
          </p>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <Icon name="mail" size={18} />
          </div>
          <h2 className="font-extrabold text-sm mb-1.5">24/7 Email Delivery &amp; Balance Tools</h2>
          <p className="text-xs text-ink-600 leading-relaxed">
            Order confirmations, recipient gift notifications, balance checks, and multi-brand redemptions at{" "}
            <Link href="/redeem" className="text-brand-600 font-bold underline">
              buygiftcards.online/redeem
            </Link>{" "}
            are available 24/7.
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
