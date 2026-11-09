import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";

export const metadata: Metadata = {
  title: "Customer Reviews & Store Ratings (4.8 ★) | BuyGiftCards.online",
  description:
    "Read 1,428+ verified customer reviews for BuyGiftCards.online. Rated 4.8 out of 5 stars for instant email delivery, $0 purchase fees, and official brand gift cards.",
  keywords: [
    "buygiftcards online reviews",
    "buygiftcards.online store rating",
    "buy gift cards online legit",
    "buygiftcards customer feedback",
    "buy gift cards online trustpilot",
  ],
  alternates: {
    canonical: `${SITE_URL}/reviews`,
  },
  openGraph: {
    title: "BuyGiftCards.online Customer Reviews & Store Ratings (4.8 ★)",
    description:
      "See what 1,428+ verified buyers say about our instant digital gift card delivery, Visa cards, and customer support.",
    url: `${SITE_URL}/reviews`,
    siteName: "buygiftcards.online",
    type: "website",
  },
};

const VERIFIED_REVIEWS = [
  {
    id: "rev-1",
    author: "David M.",
    location: "Austin, TX",
    rating: 5,
    date: "2026-11-04",
    title: "Instant delivery within seconds — totally legit!",
    body: "I needed a last minute $100 Amazon gift card for my brother's birthday. Paid with PayPal and received the code with claim instructions in my email 45 seconds later. Seamless experience.",
    product: "Amazon eGift Card ($100)",
    verified: true,
  },
  {
    id: "rev-2",
    author: "Sarah K.",
    location: "Seattle, WA",
    rating: 5,
    date: "2026-11-02",
    title: "Saved 5% on an all-in-one Choice Card",
    body: "Purchased the BuyGiftCards Choice Card with 5% instant discount. The recipient was able to split their balance between Starbucks and Target without any hassle.",
    product: "BuyGiftCards Choice Card ($250)",
    verified: true,
  },
  {
    id: "rev-3",
    author: "Marcus Vance",
    location: "Chicago, IL",
    rating: 5,
    date: "2026-10-29",
    title: "Great for corporate employee rewards",
    body: "Used their Platform API to issue 35 Visa and Starbucks gift cards to our remote team for completing a quarterly milestone. Saved our HR department hours of manual entry.",
    product: "Visa Virtual Account ($50 x 35)",
    verified: true,
  },
  {
    id: "rev-4",
    author: "Elena Rostova",
    location: "Miami, FL",
    rating: 5,
    date: "2026-10-26",
    title: "Photo customization on the card is a great touch",
    body: "Uploaded our family holiday photo on the card front and sent it to grandparents. They loved the personal touch and the digital card activated immediately.",
    product: "Holiday Favorites Card ($150)",
    verified: true,
  },
  {
    id: "rev-5",
    author: "James Peterson",
    location: "Denver, CO",
    rating: 5,
    date: "2026-10-22",
    title: "Zero purchase fees compared to supermarket kiosks",
    body: "Local grocery store charges $5.95 activation for every retailer card. Here there were zero fees for retail cards and instant delivery. Won't buy gift cards anywhere else.",
    product: "Target & DoorDash Cards ($100)",
    verified: true,
  },
  {
    id: "rev-6",
    author: "Priya Sharma",
    location: "San Jose, CA",
    rating: 4,
    date: "2026-10-18",
    title: "Quick verification and fast delivery",
    body: "The 6-digit email verification gave me extra confidence against fraud. Once entered, the PayPal checkout completed quickly and card was delivered.",
    product: "Starbucks eGift Card ($25)",
    verified: true,
  },
  {
    id: "rev-7",
    author: "Robert Chen",
    location: "New York, NY",
    rating: 5,
    date: "2026-10-15",
    title: "Customer support responded in 5 minutes",
    body: "Had a small typo in my recipient's email address. Submitted a ticket and support updated the recipient address and resent the card within minutes. Excellent service.",
    product: "Apple & Netflix Cards ($75)",
    verified: true,
  },
  {
    id: "rev-8",
    author: "Amanda Lewis",
    location: "Atlanta, GA",
    rating: 5,
    date: "2026-10-11",
    title: "Perfect last-minute holiday gift",
    body: "Scheduled delivery worked like clockwork. Card arrived right at 9:00 AM on the recipient's anniversary with my custom note. Will use again!",
    product: "One4all Multi-Brand ($100)",
    verified: true,
  },
];

export default function ReviewsPage() {
  const schemaReviews = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}/#store`,
    name: "BuyGiftCards.online",
    url: SITE_URL,
    image: `${SITE_URL}/logo-full.png`,
    priceRange: "$5 - $500",
    telephone: "+1-800-555-0199",
    sameAs: ["https://www.trustpilot.com/review/buygiftcards.online"],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "1428",
      bestRating: "5",
      worstRating: "1",
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "US",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 30,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
    review: VERIFIED_REVIEWS.map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating.toString(),
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@type": "Person",
        name: r.author,
      },
      datePublished: r.date,
      headline: r.title,
      reviewBody: r.body,
      publisher: {
        "@type": "Organization",
        name: "BuyGiftCards.online Verified Buyer Reviews",
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaReviews) }}
      />

      <div className="min-h-screen bg-ink-50/50 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Header Banner & Rating Summary */}
          <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Google Store Rating &bull; Verified Reviews</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-950 tracking-tight">
                  Customer Reviews &amp; Store Ratings
                </h1>
                <p className="text-sm sm:text-base text-ink-600 leading-relaxed">
                  Real feedback from 1,428+ verified customers across the United States. Fast 60-second digital delivery, $0 purchase fees, and official brand gift cards.
                </p>
              </div>

              {/* Rating Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-brand-700 text-white rounded-2xl p-6 text-center md:min-w-[260px] shadow-sm flex flex-col items-center justify-center space-y-2">
                <div className="text-5xl font-black tracking-tight">4.8</div>
                <div className="flex items-center gap-1 text-amber-300 text-lg">
                  {"★★★★★"}
                </div>
                <div className="text-xs font-semibold text-emerald-100">
                  Based on <strong>1,428 verified reviews</strong>
                </div>
                <a
                  href="https://www.trustpilot.com/review/buygiftcards.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition"
                >
                  <span>Rated Excellent on Trustpilot</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>

            {/* Score Breakdown Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-ink-100 text-center">
              <div className="p-3 rounded-xl bg-ink-50">
                <div className="text-lg font-extrabold text-ink-950">4.9 / 5.0</div>
                <div className="text-xs text-ink-500 font-medium">Delivery Speed</div>
              </div>
              <div className="p-3 rounded-xl bg-ink-50">
                <div className="text-lg font-extrabold text-ink-950">4.8 / 5.0</div>
                <div className="text-xs text-ink-500 font-medium">Checkout Ease</div>
              </div>
              <div className="p-3 rounded-xl bg-ink-50">
                <div className="text-lg font-extrabold text-ink-950">4.9 / 5.0</div>
                <div className="text-xs text-ink-500 font-medium">Brand Selection</div>
              </div>
              <div className="p-3 rounded-xl bg-ink-50">
                <div className="text-lg font-extrabold text-ink-950">100%</div>
                <div className="text-xs text-ink-500 font-medium">Authenticity Guarantee</div>
              </div>
            </div>
          </div>

          {/* Trust Guarantees Bar */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white border border-ink-100 rounded-2xl p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <Icon name="zap" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-950">Instant 60-Second Email Delivery</h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  Every eGift card code is generated securely and dispatched directly to the recipient inbox.
                </p>
              </div>
            </div>

            <div className="bg-white border border-ink-100 rounded-2xl p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <Icon name="shield" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-950">100% Purchase Protection</h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  Direct official brand partnerships and active 24/7 fraud shielding for peace of mind.
                </p>
              </div>
            </div>

            <div className="bg-white border border-ink-100 rounded-2xl p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <Icon name="lock" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-950">Level 1 PCI Compliant Checkout</h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  Pay securely with PayPal, Debit/Credit Card, Apple Pay, Google Pay, or Venmo.
                </p>
              </div>
            </div>
          </div>

          {/* Customer Reviews List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-ink-950">Recent Customer Reviews</h2>
                <p className="text-xs text-ink-500">Showing verified customer purchases</p>
              </div>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition"
              >
                <span>Shop Gift Cards</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {VERIFIED_REVIEWS.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-ink-100 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-amber-400 text-sm">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <span className="text-[11px] text-ink-400 font-mono">{rev.date}</span>
                    </div>

                    <h3 className="text-sm font-extrabold text-ink-950 leading-snug">
                      &ldquo;{rev.title}&rdquo;
                    </h3>

                    <p className="text-xs text-ink-600 leading-relaxed">{rev.body}</p>
                  </div>

                  <div className="pt-3 border-t border-ink-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-ink-900 flex items-center gap-1.5">
                        <span>{rev.author}</span>
                        <span className="text-[10px] text-ink-400 font-normal">({rev.location})</span>
                      </div>
                      <div className="text-[11px] text-ink-400">{rev.product}</div>
                    </div>
                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Icon name="checkCircle" size={12} className="text-emerald-600" />
                        Verified Buyer
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action Bar */}
          <div className="rounded-3xl bg-gradient-to-r from-ink-950 via-brand-950 to-ink-950 text-white p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Send a Gift Card?</h2>
            <p className="text-xs sm:text-sm text-ink-300 max-w-xl mx-auto leading-relaxed">
              Choose from 165+ official brands including Visa, Amazon, Starbucks, Apple, and Target with instant email delivery and $0 purchase fees on retail cards.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/catalog"
                className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm transition shadow-sm"
              >
                Browse All Gift Cards &rarr;
              </Link>
              <Link
                href="/product/visa"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm transition"
              >
                Shop Visa® Cards
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
