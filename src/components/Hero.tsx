import Link from "next/link";
import { getBrandsForCountry, chargeAmountCents } from "@/lib/brands";
import { CountryCode, formatCurrency, getCurrencySymbol, resolveCountryFromHostOrEnv } from "@/lib/country-config";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./Icon";
import { CountrySelector } from "./CountrySelector";

export function Hero({ country = resolveCountryFromHostOrEnv() }: { country?: CountryCode }) {
  const activeBrands = getBrandsForCountry(country);
  const brandCount = activeBrands.length;
  const currencySym = getCurrencySymbol(country);
  const fmt = (n: number) => formatCurrency(n, country);

  const FEATURED = [
    activeBrands.find((b) => b.slug === "buygiftcards") ?? activeBrands[0],
    activeBrands.find((b) => b.slug === "visa") ?? activeBrands.find((b) => b.slug === "amazon") ?? activeBrands[1],
    activeBrands.find((b) => b.slug === "bostonpizza") ??
      activeBrands.find((b) => b.slug === "garena") ??
      activeBrands.find((b) => b.slug === "doordash") ??
      activeBrands.find((b) => b.slug === "ubereats") ??
      activeBrands[2],
    activeBrands.find((b) => b.slug === "ardene") ??
      activeBrands.find((b) => b.slug === "adidas") ??
      activeBrands.find((b) => b.slug === "xbox") ??
      activeBrands[3],
  ].filter(Boolean);

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
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest">
              <span>🎁</span> Holiday Gifting Season · {brandCount}+ Top Brands
            </div>
            <CountrySelector variant="hero" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-[1.08] tracking-tight">
            Buy Gift Cards Online — Instant Digital eGift Delivery
          </h1>
          <p className="text-base text-white/90 mb-7 leading-relaxed">
            Buy gift cards online with instant digital delivery from {brandCount}+ official brands. Shop custom-photo
            Visa® virtual cards, One4all multi-brand choice cards, and top retail, dining &amp; gaming eGift
            cards—delivered to your inbox in minutes with Credit/Debit Card or PayPal checkout.
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
            <span className="flex items-center gap-1.5"><Icon name="shield" size={14} className="text-amber-300" />{currencySym}0 purchase fees on brand cards</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {FEATURED.map((b, i) => {
            const minCharge = chargeAmountCents(b, b.min) / 100;
            return (
              <Link
                key={b.slug}
                href={`/product/${b.slug}`}
                className="w-36 sm:w-40 h-44 rounded-2xl bg-white/12 hover:bg-white/20 backdrop-blur border border-white/25 flex flex-col items-center justify-center gap-2 shadow-xl hover:-translate-y-1 transition relative px-2"
                style={{ marginTop: i % 2 === 1 ? 14 : 0 }}
              >
                {!!b.discountPercent ? (
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold uppercase bg-accent-500 text-ink-950 px-2.5 py-0.5 rounded-full shadow">
                    {b.discountPercent}% OFF
                  </span>
                ) : b.badge && !b.badge.includes("%") ? (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase bg-amber-400 text-ink-950 px-2 py-0.5 rounded-full">
                    {b.badge}
                  </span>
                ) : null}
                <div className="relative mt-2">
                  <BrandLogo domain={b.domain} name={b.name} size={52} radius={12} bg="rgba(255,255,255,0.96)" />
                </div>
                <span className="text-xs font-bold text-white text-center px-2 line-clamp-1">{b.name}</span>
                {b.discountPercent ? (
                  <span className="text-[11px] font-bold text-amber-300">
                    <span className="line-through text-white/60 mr-1">{currencySym}{b.min}</span>
                    From {fmt(minCharge)}
                  </span>
                ) : (
                  <span className="text-[11px] text-white/85">{currencySym}{b.min} – {currencySym}{b.max}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
