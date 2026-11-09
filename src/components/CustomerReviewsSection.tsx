import Link from "next/link";
import { Icon } from "./Icon";

const FEATURED_REVIEWS = [
  {
    author: "David M.",
    location: "Austin, TX",
    rating: 5,
    title: "Instant delivery within seconds",
    snippet: "Got my $100 Amazon gift card in my inbox literally 45 seconds after paying with PayPal. Claim code worked immediately.",
    item: "Amazon eGift Card",
  },
  {
    author: "Sarah K.",
    location: "Seattle, WA",
    rating: 5,
    title: "Saved 5% on Choice Card",
    snippet: "Split the balance between Starbucks and Target without paying any activation fee. Smooth checkout and instant delivery.",
    item: "Choice Gift Card",
  },
  {
    author: "Marcus Vance",
    location: "Chicago, IL",
    rating: 5,
    title: "Great for corporate rewards",
    snippet: "Issued 35 Visa gift cards to our remote team in one order. Saved our HR department hours of work.",
    item: "Visa Virtual Accounts",
  },
];

export function CustomerReviewsSection() {
  return (
    <section aria-labelledby="reviews-heading" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200">
              <span className="text-amber-500 font-black">★★★★★</span>
              <span>4.8 / 5.0 Google Store Rating</span>
            </div>
            <h2 id="reviews-heading" className="text-2xl sm:text-3xl font-extrabold text-ink-950 tracking-tight">
              Loved by 1,400+ Verified Gift Givers
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 max-w-2xl leading-relaxed">
              Read authentic feedback from real customers across the US who count on BuyGiftCards.online for instant digital delivery, zero purchase fees on retail cards, and secure checkout.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition shadow-sm"
            >
              <span>See All 1,428 Reviews</span>
              <Icon name="chevronRight" size={14} />
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {FEATURED_REVIEWS.map((rev) => (
            <div
              key={rev.author}
              className="p-5 rounded-2xl bg-ink-50/70 border border-ink-100 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-amber-400 text-sm font-bold">★★★★★</div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <Icon name="checkCircle" size={10} className="text-emerald-600" />
                    Verified Buyer
                  </span>
                </div>
                <div className="text-xs font-extrabold text-ink-950">&ldquo;{rev.title}&rdquo;</div>
                <p className="text-xs text-ink-600 leading-relaxed">{rev.snippet}</p>
              </div>

              <div className="pt-2 border-t border-ink-200/60 flex items-center justify-between text-[11px] text-ink-500">
                <span className="font-bold text-ink-800">
                  {rev.author} <span className="font-normal text-ink-400">({rev.location})</span>
                </span>
                <span className="text-brand-700 font-semibold">{rev.item}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="pt-4 border-t border-ink-100 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-ink-500 font-medium">
          <div className="flex items-center gap-2">
            <Icon name="zap" size={16} className="text-brand-600" />
            <span>Average Delivery: <strong>&lt; 60 seconds</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="shield" size={16} className="text-brand-600" />
            <span>Purchase Guarantee: <strong>100% Authentic Codes</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="lock" size={16} className="text-brand-600" />
            <span>Security: <strong>256-Bit SSL &amp; PCI Level 1</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
