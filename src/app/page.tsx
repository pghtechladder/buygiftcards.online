import { headers } from "next/headers";
import { PromoBanner } from "@/components/PromoBanner";
import { Hero } from "@/components/Hero";
import { CategoryStrip } from "@/components/CategoryStrip";
import { HolidayGiftGuide } from "@/components/HolidayGiftGuide";
import { BrandGrid } from "@/components/BrandGrid";
import { BrandLogoStrip } from "@/components/BrandLogoStrip";
import { PromoTiles } from "@/components/PromoTiles";
import { ResponsiveHomeSwitcher } from "@/components/ResponsiveHomeSwitcher";
import { parseDeviceFromUserAgent } from "@/lib/device";
import { BRANDS } from "@/lib/brands";
import Link from "next/link";
import { Icon } from "@/components/Icon";

const discountBrands = BRANDS.filter((b) => b.discountPercent).slice(0, 10);
const dining = BRANDS.filter((b) => b.category === "Food & Drink").slice(0, 10);
const travel = BRANDS.filter((b) => b.category === "Travel");
const bestBrands = BRANDS.slice(0, 16);
const featured = BRANDS.slice(20, 30);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const reqHeaders = await headers();
  const ua = reqHeaders.get("user-agent") || "";
  const chMobile = reqHeaders.get("sec-ch-ua-mobile");
  const deviceInfo = parseDeviceFromUserAgent(ua);
  if (chMobile === "?1") {
    deviceInfo.isMobile = true;
    deviceInfo.deviceType = "mobile";
  }

  const forceView =
    view === "mobile" ? "mobile" : view === "desktop" ? "desktop" : undefined;

  const desktopHomeContent = (
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
      <BrandLogoStrip items={bestBrands} title="Shop top gift card brands" />
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

      {/* SEO Authority & FAQ Section for "Buy Gift Cards Online" */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white border border-ink-100 rounded-3xl p-8 sm:p-10 shadow-sm">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600">
              Instant Digital Delivery • {BRANDS.length}+ Official Brands
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-2">
              The fastest &amp; safest place to buy gift cards online
            </h2>
            <p className="text-sm text-ink-600 leading-relaxed">
              Whether you need a last-minute birthday gift, corporate employee rewards, or everyday savings at your
              favorite stores, <strong>buygiftcards.online</strong> lets you buy digital gift cards (eGift cards) and
              prepaid Visa® virtual accounts with $0 purchase fees on brand cards and instant email fulfillment.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Where can I buy gift cards online with instant email delivery?",
                a: "At buygiftcards.online, you can buy digital gift cards from popular retail, dining, gaming, and travel brands—including Amazon, Visa, Starbucks, DoorDash, Uber, Disney, Xbox, and Multi-Brand Choice Cards—delivered to your inbox within minutes of checkout.",
              },
              {
                q: "Can I buy gift cards online with a credit card, debit card, or PayPal?",
                a: "Yes! Our checkout supports direct Credit & Debit Card payments (Visa, Mastercard, Amex, Discover) on both mobile and desktop browsers, alongside PayPal, Venmo, and Pay Later.",
              },
              {
                q: "Can I buy discounted gift cards for less than face value?",
                a: "Yes. Dozens of brands in our Instant Deals catalog feature automatic reseller discounts at checkout while your recipient still receives 100% of the full face value.",
              },
              {
                q: "What is the BuyGiftCards.online All-in-One Choice Gift Card?",
                a: "Our signature Multi-Brand and One4all gift cards allow recipients to redeem their card at buygiftcards.online/redeem and swap or split their balance across our entire brand catalog.",
              },
            ].map((faq) => (
              <div key={faq.q} className="p-5 rounded-2xl bg-ink-50/70 border border-ink-100">
                <h3 className="font-extrabold text-sm sm:text-base text-ink-950 mb-1.5">{faq.q}</h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  return (
    <ResponsiveHomeSwitcher
      initialDevice={deviceInfo}
      forceView={forceView}
      desktopView={desktopHomeContent}
    />
  );
}
