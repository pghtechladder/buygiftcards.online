import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./Icon";

const FEATURED = [
  BRANDS.find((b) => b.slug === "buygiftcards")!,
  BRANDS.find((b) => b.slug === "visa")!,
  BRANDS.find((b) => b.slug === "amazon")!,
  BRANDS.find((b) => b.slug === "starbucks")!,
];
const brandCount = BRANDS.length;

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0a4738] via-brand-700 to-[#7f1d1d]">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #fbbf24, transparent 70%)" }}
      />
      <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-20 flex flex-wrap items-center gap-12 justify-between">
        <div className="flex-1 min-w-[300px] max-w-xl text-white">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-4">
            <span>🎁</span> Holiday Gifting Season · {brandCount}+ Top Brands
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-[1.08] tracking-tight">
            The #1 destination for every gift on your list.
          </h1>
          <p className="text-base text-white/90 mb-7 leading-relaxed">
            Shop custom-photo Visa® &amp; Mastercard® cards, One4all multi-brand choice cards, and {brandCount}+ top
            retail &amp; dining brands. Delivered instantly by email or shipped to their door.
          </p>
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-brand-800 font-extrabold hover:bg-amber-50 transition shadow-lg shadow-black/15"
            >
              Shop All Brands
              <Icon name="chevronRight" size={16} />
            </Link>
            <Link
              href="/occasions?occasion=holidays"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-amber-400 text-ink-950 font-extrabold hover:bg-amber-300 transition shadow-lg shadow-black/15"
            >
              🎄 Holiday Gift Guide
            </Link>
            <Link
              href="/deals"
              className="inline-block px-6 py-3.5 rounded-full border-2 border-white/50 text-white font-bold hover:bg-white/10 transition text-sm"
            >
              Deals &amp; Promos
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-xs sm:text-sm text-white/85 font-medium">
            <span className="flex items-center gap-1.5"><Icon name="zap" size={14} className="text-amber-300" />Instant eGift claim links</span>
            <span className="flex items-center gap-1.5"><Icon name="lock" size={14} className="text-amber-300" />Secure Stripe checkout</span>
            <span className="flex items-center gap-1.5"><Icon name="shield" size={14} className="text-amber-300" />$0 purchase fees on brand cards</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {FEATURED.map((b, i) => (
            <Link
              key={b.slug}
              href={`/product/${b.slug}`}
              className="w-36 sm:w-40 h-40 rounded-2xl bg-white/12 hover:bg-white/20 backdrop-blur border border-white/25 flex flex-col items-center justify-center gap-2.5 shadow-xl hover:-translate-y-1 transition relative"
              style={{ marginTop: i % 2 === 1 ? 14 : 0 }}
            >
              {b.badge && (
                <span className="absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase bg-amber-400 text-ink-950 px-2 py-0.5 rounded-full">
                  {b.badge}
                </span>
              )}
              <BrandLogo domain={b.domain} name={b.name} size={50} radius={12} bg="rgba(255,255,255,0.96)" />
              <span className="text-xs font-bold text-white text-center px-3 line-clamp-1">{b.name}</span>
              <span className="text-[11px] text-white/75">${b.min} – ${b.max}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
