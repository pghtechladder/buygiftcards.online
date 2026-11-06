import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { BrandGrid } from "@/components/BrandGrid";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Gift Cards by Occasion — Birthday & Holidays",
  description:
    "Buy gift cards online for every occasion—Holidays, Birthdays, Thank You, and Weddings. Personalize with custom photos and send via instant email delivery.",
  keywords: [
    "birthday gift cards online",
    "holiday egift cards",
    "last minute birthday gift card email delivery",
    "thank you gift cards",
    "wedding gift cards online",
    "graduation gift cards",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/occasions" },
  openGraph: {
    title: "BuyGiftCards.online | Gift Cards by Occasion — Birthday & Holidays",
    description:
      "Buy gift cards online for every occasion—Holidays, Birthdays, Thank You, and Weddings. Personalize with custom photos and send via instant email delivery.",
    url: "https://buygiftcards.online/occasions",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
  },
};

const OCCASIONS = [
  {
    id: "holidays",
    emoji: "🎄",
    title: "Holidays & Christmas",
    subtitle: "Festive eGift cards, custom-photo Visa® cards, and stocking stuffers delivered in minutes.",
    bannerClass: "from-[#5c0f14] via-[#7f1d1d] to-[#0a4738]",
    slugs: ["holidayfavorites", "one4all", "visa", "amazon", "starbucks", "target", "apple", "nike", "sephora", "xbox"],
  },
  {
    id: "birthday",
    emoji: "🎂",
    title: "Birthday Gift Cards",
    subtitle: "Let them pick exactly what they want on their big day with top retail, dining & gaming brands.",
    bannerClass: "from-purple-950 via-purple-800 to-pink-700",
    slugs: ["one4all", "visa", "amazon", "sephora", "ultabeauty", "nike", "spotify", "steam", "cheesecakefactory", "doordash"],
  },
  {
    id: "thank-you",
    emoji: "✨",
    title: "Thank You & Appreciation",
    subtitle: "Thoughtful coffee, dining, and flexible choice cards for teachers, hosts, coworkers, and friends.",
    bannerClass: "from-emerald-950 via-brand-700 to-teal-700",
    slugs: ["starbucks", "panera", "one4all", "amazon", "target", "wholefoods", "bathbodyworks", "olivegarden", "ubereats", "darden"],
  },
  {
    id: "wedding",
    emoji: "🥂",
    title: "Wedding, Housewarming & Anniversary",
    subtitle: "Help the happy couple feather their nest, book a honeymoon stay, or enjoy a celebratory dinner.",
    bannerClass: "from-slate-900 via-indigo-950 to-amber-800",
    slugs: ["airbnb", "crateandbarrel", "wayfair", "homedepot", "lowes", "ikea", "williams-sonoma", "totalwine", "marriott", "southwest"],
  },
  {
    id: "graduation",
    emoji: "🎓",
    title: "Graduation & New Job",
    subtitle: "Fuel their next chapter with everyday essentials, tech, travel, and wardrobe upgrades.",
    bannerClass: "from-blue-950 via-blue-800 to-brand-700",
    slugs: ["visa", "mastercard", "apple", "amazon", "ikea", "target", "uber", "starbucks", "bestbuy", "southwest"],
  },
];

export default async function OccasionsPage({
  searchParams,
}: {
  searchParams: Promise<{ occasion?: string }>;
}) {
  const { occasion } = await searchParams;
  const active = OCCASIONS.find((o) => o.id === occasion) ?? OCCASIONS[0];

  const featuredBrands = active.slugs
    .map((s) => BRANDS.find((b) => b.slug === s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  const stockingStuffers = BRANDS.filter((b) => b.min <= 15).slice(0, 10);
  const crowdPleasers = BRANDS.slice(0, 10);
  const cozyNights = BRANDS.filter((b) => ["Food & Drink", "Entertainment"].includes(b.category)).slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Occasion Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-none">
        {OCCASIONS.map((o) => {
          const isCurrent = o.id === active.id;
          return (
            <Link
              key={o.id}
              href={`/occasions?occasion=${o.id}`}
              className={`px-5 py-3 rounded-2xl text-sm font-extrabold whitespace-nowrap border transition flex items-center gap-2 ${
                isCurrent
                  ? "bg-ink-950 text-white border-ink-950 shadow-md"
                  : "bg-white text-ink-700 border-ink-100 hover:border-brand-300"
              }`}
            >
              <span>{o.emoji}</span>
              <span>{o.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Hero Banner */}
      <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${active.bannerClass} text-white p-8 sm:p-14 mt-2 mb-8 shadow-xl`}>
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "32px 32px" }}
        />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-3">
            {active.emoji} Occasion Collection
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">{active.title}</h1>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-6">{active.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/product/visa"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-ink-950 font-extrabold text-sm hover:bg-amber-300 transition"
            >
              Design a Custom Photo Card <Icon name="chevronRight" size={14} />
            </Link>
            <Link
              href="/group-gifts"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 border border-white/25 text-white font-bold text-sm hover:bg-white/25 transition"
            >
              Start a Group Gift
            </Link>
          </div>
        </div>
      </div>

      <BrandGrid items={featuredBrands} title={`Top picks for ${active.title}`} />

      {active.id === "holidays" && (
        <>
          <div id="stocking-stuffers">
            <BrandGrid items={stockingStuffers} title="🎄 Stocking stuffers ($10 – $15+)" />
          </div>
          <div id="crowd-pleasers">
            <BrandGrid items={crowdPleasers} title="🎁 Holiday crowd-pleasers" />
          </div>
          <div id="cozy-nights">
            <BrandGrid items={cozyNights} title="❄️ Cozy winter nights in (Dining & Streaming)" />
          </div>
        </>
      )}
    </div>
  );
}

