import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { BrandGrid } from "@/components/BrandGrid";
import { Icon } from "@/components/Icon";

export default function DealsPage() {
  const discountedBrands = BRANDS.filter((b) => b.discountPercent);
  const multiBrandCards = BRANDS.filter((b) => b.category === "Multi-Brand");

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
            Pay less, gift the full face value.
          </h1>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-6">
            Save up to 10% instantly at checkout on top dining, fashion, gaming, and multi-brand gift cards. No promo
            code required — the discount is automatically applied in your cart while your recipient receives 100% of
            the full card amount.
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
            Instant 10% Off
          </div>
          <h3 className="text-lg font-extrabold mb-1">Panera Bread &amp; Adidas</h3>
          <p className="text-xs text-ink-500 leading-relaxed mb-4">
            Buy a $50 gift card for just $45.00. Instant eGift claim link delivered immediately after checkout.
          </p>
          <div className="flex gap-3">
            <Link href="/product/panera" className="text-xs font-extrabold text-brand-600 hover:underline">
              Shop Panera &rarr;
            </Link>
            <Link href="/product/adidas" className="text-xs font-extrabold text-brand-600 hover:underline">
              Shop Adidas &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-extrabold uppercase text-brand-700 bg-brand-50 inline-block px-2.5 py-1 rounded-full mb-3">
            5% Off Multi-Brand
          </div>
          <h3 className="text-lg font-extrabold mb-1">One4all &amp; Holiday Favorites</h3>
          <p className="text-xs text-ink-500 leading-relaxed mb-4">
            Not sure what they like? Give a Multi-Brand choice link at 5% off and let them choose from 100+ top brands.
          </p>
          <Link href="/product/one4all" className="text-xs font-extrabold text-brand-600 hover:underline">
            Shop One4all Multi-Brand &rarr;
          </Link>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-extrabold uppercase text-amber-800 bg-amber-100 inline-block px-2.5 py-1 rounded-full mb-3">
            $0 Purchase Fees
          </div>
          <h3 className="text-lg font-extrabold mb-1">Custom Photo Visa® &amp; Mastercard®</h3>
          <p className="text-xs text-ink-500 leading-relaxed mb-4">
            Upload your own holiday family photo or company logo onto a virtual or physical card with zero custom design fee.
          </p>
          <Link href="/product/visa" className="text-xs font-extrabold text-brand-600 hover:underline">
            Personalize Visa® Card &rarr;
          </Link>
        </div>
      </div>

      <BrandGrid items={discountedBrands} title="All discounted gift cards" />
      <BrandGrid items={multiBrandCards} title="Multi-Brand choice gift cards" />
    </div>
  );
}

