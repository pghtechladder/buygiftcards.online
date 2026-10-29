import { PromoBanner } from "@/components/PromoBanner";
import { Hero } from "@/components/Hero";
import { CategoryStrip } from "@/components/CategoryStrip";
import { HolidayGiftGuide } from "@/components/HolidayGiftGuide";
import { BrandGrid } from "@/components/BrandGrid";
import { BrandLogoStrip } from "@/components/BrandLogoStrip";
import { PromoTiles } from "@/components/PromoTiles";
import { BRANDS } from "@/lib/brands";
import Link from "next/link";
import { Icon } from "@/components/Icon";

const discountBrands = BRANDS.filter((b) => b.discountPercent).slice(0, 10);
const dining = BRANDS.filter((b) => b.category === "Food & Drink").slice(0, 10);
const travel = BRANDS.filter((b) => b.category === "Travel");
const bestBrands = BRANDS.slice(0, 16);
const featured = BRANDS.slice(20, 30);

export default function HomePage() {
  return (
    <>
      <PromoBanner />
      <Hero />
      <CategoryStrip />
      <HolidayGiftGuide />
      <BrandGrid items={BRANDS.slice(0, 10)} title="Most popular gift cards" />
      <PromoTiles />
      <BrandGrid items={discountBrands} title="Holiday deals & instant savings" />
      <BrandGrid items={dining} title="Dining & restaurant gift cards" />
      <BrandGrid items={travel} title="Travel & experience gift cards" />
      <BrandLogoStrip items={bestBrands} title="Shop 165+ top brands" />
      <BrandGrid items={featured} title="Featured gift cards" />

      {/* Giftcards.com-style Self-Service Quick Bar */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-white border border-ink-100 rounded-3xl p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm">
          {[
            {
              icon: "wallet" as const,
              title: "Check Card Balance",
              desc: "Verify remaining funds on your order or merchant gift card.",
              href: "/balance",
              cta: "Check Balance",
            },
            {
              icon: "checkCircle" as const,
              title: "Activate a Card",
              desc: "Activate a newly arrived physical Visa®, Mastercard®, or gift card.",
              href: "/activate",
              cta: "Activate Now",
            },
            {
              icon: "gift" as const,
              title: "Group Gifting",
              desc: "Pool contributions with friends or coworkers for one big gift.",
              href: "/group-gifts",
              cta: "Start a Group Gift",
            },
            {
              icon: "package" as const,
              title: "Track Your Order",
              desc: "Look up instant claim links or check physical shipping status.",
              href: "/track-order",
              cta: "Find Order",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group p-4 rounded-2xl hover:bg-ink-50 transition flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3.5 group-hover:bg-brand-600 group-hover:text-white transition">
                  <Icon name={item.icon} size={20} />
                </div>
                <h3 className="font-extrabold text-base mb-1">{item.title}</h3>
                <p className="text-xs text-ink-500 leading-relaxed mb-3">{item.desc}</p>
              </div>
              <span className="text-xs font-extrabold text-brand-600 inline-flex items-center gap-1">
                {item.cta} <Icon name="chevronRight" size={12} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
