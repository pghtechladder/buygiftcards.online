import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./Icon";

const HOLIDAY_COLLECTIONS = [
  {
    id: "stocking-stuffers",
    tag: "Under $25",
    title: "Stocking Stuffers",
    subtitle: "Coffee, music, gaming & treats under $25",
    href: "/occasions?occasion=holidays#stocking-stuffers",
    gradient: "from-red-900 via-red-800 to-rose-700",
    brands: ["starbucks", "spotify", "xbox", "chipotle"],
  },
  {
    id: "crowd-pleasers",
    tag: "Most Gifted",
    title: "Holiday Crowd-Pleasers",
    subtitle: "The universal favorites everyone has on their list",
    href: "/occasions?occasion=holidays#crowd-pleasers",
    gradient: "from-emerald-950 via-brand-800 to-emerald-700",
    brands: ["visa", "amazon", "apple", "target"],
  },
  {
    id: "cozy-nights",
    tag: "Winter Favorites",
    title: "Cozy Winter Nights In",
    subtitle: "Delivery, streaming & home comforts for chilly evenings",
    href: "/occasions?occasion=holidays#cozy-nights",
    gradient: "from-amber-900 via-amber-800 to-yellow-700",
    brands: ["doordash", "netflix", "ubereats", "panera"],
  },
  {
    id: "holiday-travel",
    tag: "For Travelers",
    title: "Holiday Getaways",
    subtitle: "Flights, stays & rides home for the holidays",
    href: "/catalog?category=Travel",
    gradient: "from-slate-900 via-indigo-950 to-slate-800",
    brands: ["airbnb", "southwest", "marriott", "uber"],
  },
];

export function HolidayGiftGuide() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#5c0f14] via-[#7f1d1d] to-[#0a4738] text-white p-8 sm:p-12 shadow-xl">
        {/* Decorative festive snow/sparkle pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 25%, #fff 1.5px, transparent 1.5px), radial-gradient(circle at 80% 65%, #ffd700 1.5px, transparent 1.5px), radial-gradient(circle at 50% 40%, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #fbbf24, transparent 70%)" }}
        />

        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-3">
              <span>🎄</span> Holiday Gift Guide · Season&apos;s Greetings
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Wrap up your holiday shopping in minutes
            </h2>
            <p className="text-white/85 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Skip the shipping cutoffs. Personalize festive eGift cards or custom-photo Visa® &amp; Mastercard® cards,
              add a holiday message, and deliver instantly to anyone on your list.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link
              href="/occasions?occasion=holidays"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-ink-950 font-extrabold text-sm transition shadow-lg"
            >
              Explore Holiday Shop
              <Icon name="chevronRight" size={15} />
            </Link>
            <Link
              href="/deals"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition"
            >
              Holiday Deals (Up to 10% Off)
            </Link>
          </div>
        </div>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOLIDAY_COLLECTIONS.map((col) => {
            const resolvedBrands = col.brands
              .map((slug) => BRANDS.find((b) => b.slug === slug))
              .filter(Boolean);
            return (
              <Link
                key={col.id}
                href={col.href}
                className={`group rounded-2xl bg-gradient-to-br ${col.gradient} border border-white/15 p-5 flex flex-col justify-between hover:-translate-y-1 hover:border-amber-300/60 hover:shadow-2xl transition`}
              >
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-black/30 text-amber-300 px-2.5 py-1 rounded-full mb-3">
                    {col.tag}
                  </span>
                  <h3 className="text-lg font-extrabold text-white mb-1 group-hover:text-amber-200 transition">
                    {col.title}
                  </h3>
                  <p className="text-xs text-white/85 leading-relaxed mb-5">{col.subtitle}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {resolvedBrands.map((b) =>
                      b ? (
                        <div
                          key={b.slug}
                          className="w-10 h-10 rounded-xl bg-white/95 p-1 flex items-center justify-center shadow"
                          title={b.name}
                        >
                          <BrandLogo domain={b.domain} name={b.name} size={32} radius={8} />
                        </div>
                      ) : null
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-extrabold text-amber-300">
                    Shop collection <Icon name="chevronRight" size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

