import type { Metadata } from "next";
import Link from "next/link";
import { getBrandsForCountry, chargeAmountCents } from "@/lib/brands";
import { getServerCountry } from "@/lib/server-country";
import { formatCurrency, getCurrencySymbol } from "@/lib/country-config";
import { BrandGrid } from "@/components/BrandGrid";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Discounted Gift Cards & Instant eGift Deals",
  description:
    "Buy discounted gift cards online and save up to 15% at checkout. Get 100% full face value on dining, gaming, and retail eGift cards with instant delivery.",
  keywords: [
    "buy discounted gift cards online",
    "gift card deals online",
    "discounted egift cards",
    "cheap gift cards online instant delivery",
    "buy gift cards on sale",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/deals" },
  openGraph: {
    title: "BuyGiftCards.online | Discounted Gift Cards & Instant eGift Deals",
    description:
      "Buy discounted gift cards online and save up to 15% at checkout. Get 100% full face value on dining, gaming, and retail eGift cards with instant delivery.",
    url: "https://buygiftcards.online/deals",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
  },
};

export default async function DealsPage() {
  const country = await getServerCountry();
  const activeBrands = getBrandsForCountry(country);
  const currencySym = getCurrencySymbol(country);
  const fmt = (n: number) => formatCurrency(n, country);

  const discountedBrands = activeBrands.filter((b) => b.discountPercent).sort(
    (a, b) => (b.discountPercent || 0) - (a.discountPercent || 0)
  );
  const multiBrandCards = activeBrands.filter((b) => b.category === "Multi-Brand");
  const maxDiscount = Math.max(...activeBrands.map((b) => b.discountPercent || 0), 5);
  const topBrand1 = discountedBrands.find((b) => b.category !== "Multi-Brand") ?? discountedBrands[0];
  const topBrand2 =
    discountedBrands.find((b) => b.category !== "Multi-Brand" && b.slug !== topBrand1?.slug) ?? discountedBrands[1];
  const sampleDenom = 50;
  const samplePrice = topBrand1 ? chargeAmountCents(topBrand1, sampleDenom) / 100 : 47.5;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Holiday Deals Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#5c0f14] via-ink-950 to-[#0a4738] text-white p-8 sm:p-14 mb-8 shadow-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(circle, #fbbf24 1.5px, transparent 1.5px)", backgroundSize: "36px 36px" }}
        />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-3">
            🏷️ Holiday Deals &amp; Promotions
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Buy Discounted Gift Cards Online — Save Instantly
          </h1>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-6">
            Buy discounted gift cards online and save up to {maxDiscount}% instantly at checkout on top dining, fashion, gaming,
            and multi-brand eGift cards. No promo code required — the discount is automatically applied in your cart
            while your recipient receives 100% of the full card amount.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalog?deals=1"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-ink-950 font-extrabold text-sm hover:bg-amber-300 transition"
            >
              Browse All Sale Cards ({discountedBrands.length})
              <Icon name="chevronRight" size={14} />
            </Link>
            <Link
              href="/business"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition"
            >
              Corporate Volume Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Promo Highlight Cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-extrabold uppercase text-red-700 bg-red-50 inline-block px-2.5 py-1 rounded-full mb-3">
            Up to {topBrand1?.discountPercent ?? maxDiscount}% Off
          </div>
          <h3 className="text-lg font-extrabold mb-1">
            {topBrand1?.name ?? "Krispy Kreme"} &amp; {topBrand2?.name ?? "Belk"}
          </h3>
          <p className="text-xs text-ink-500 leading-relaxed mb-4">
            Buy a {currencySym}{sampleDenom} gift card for just {fmt(samplePrice)}. Instant eGift claim link delivered immediately after checkout.
          </p>
          <div className="flex gap-3">
            {topBrand1 && (
              <Link href={`/product/${topBrand1.slug}`} className="text-xs font-extrabold text-brand-600 hover:underline">
                Shop {topBrand1.name} ({topBrand1.discountPercent}% Off) &rarr;
              </Link>
            )}
            {topBrand2 && (
              <Link href={`/product/${topBrand2.slug}`} className="text-xs font-extrabold text-brand-600 hover:underline">
                Shop {topBrand2.name} ({topBrand2.discountPercent}% Off) &rarr;
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-extrabold uppercase text-brand-700 bg-brand-50 inline-block px-2.5 py-1 rounded-full mb-3">
            5% Off Multi-Brand
          </div>
          <h3 className="text-lg font-extrabold mb-1">One4all &amp; Holiday Favorites</h3>
          <p className="text-xs text-ink-500 leading-relaxed mb-4">
            Not sure what they like? Give a Multi-Brand choice link at 5% off and let them choose from top brands.
          </p>
          <Link href="/product/one4all" className="text-xs font-extrabold text-brand-600 hover:underline">
            Shop One4all Multi-Brand &rarr;
          </Link>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-extrabold uppercase text-amber-800 bg-amber-100 inline-block px-2.5 py-1 rounded-full mb-3">
            {currencySym}0 Purchase Fees
          </div>
          <h3 className="text-lg font-extrabold mb-1">Custom Photo Choice Cards</h3>
          <p className="text-xs text-ink-500 leading-relaxed mb-4">
            Upload your own holiday family photo or company logo onto a virtual card with zero custom design fee.
          </p>
          <Link href="/product/buygiftcards" className="text-xs font-extrabold text-brand-600 hover:underline">
            Personalize Gift Card &rarr;
          </Link>
        </div>
      </div>

      <BrandGrid items={discountedBrands} title="All discounted gift cards" country={country} />
      <BrandGrid items={multiBrandCards} title="Multi-Brand choice gift cards" country={country} />
    </div>
  );
}

