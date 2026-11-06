import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use & Digital Gift Card Terms",
  description:
    "Read the Terms of Use, digital eGift card fulfillment terms, refund policy, and non-expiration rules for purchases on buygiftcards.online.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/terms" },
  openGraph: {
    title: "BuyGiftCards.online | Terms of Use & Gift Card Terms",
    description:
      "Read the Terms of Use, digital eGift card fulfillment terms, refund policy, and non-expiration rules for purchases on buygiftcards.online.",
    url: "https://buygiftcards.online/terms",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="bg-white border border-ink-100 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6 text-sm text-ink-700 leading-relaxed">
        <div>
          <div className="text-xs font-bold uppercase text-brand-600 mb-1">Legal &amp; Policies</div>
          <h1 className="text-3xl font-extrabold text-ink-900">Terms of Use &amp; Gift Card Terms</h1>
          <p className="text-xs text-ink-400 mt-1">Last updated: October 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-ink-900">1. Overview &amp; Acceptance</h2>
          <p>
            By accessing or purchasing from buygiftcards.online, you agree to these Terms of Use. We provide digital
            eGift cards, multi-brand choice links, and physical gift cards fulfilled through licensed distribution
            partners including Giftbit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-ink-900">2. Pricing, Discounts &amp; Payment</h2>
          <p>
            All prices are denominated in US Dollars (USD). Any promotional discount shown on a product page reduces the
            purchase price you pay at checkout while the issued gift card retains its full face value. Payments are
            processed securely via Stripe.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-ink-900">3. Digital Delivery, Claim Windows &amp; Expiration</h2>
          <p>
            Underlying merchant gift card funds do not expire and carry no dormancy fees. For digital reward links
            issued via Giftbit, the recipient must click and claim the reward link within the stated claim period (up to
            360 days from issuance), after which unclaimed links expire in accordance with promotional reward terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-ink-900">4. Refunds &amp; Lost Cards</h2>
          <p>
            Because digital gift card codes and claim links are immediately redeemable upon issuance, all sales of
            revealed codes or claimed links are final. Please safeguard your claim URLs and PINs as you would cash.
          </p>
        </section>
      </div>
    </div>
  );
}
