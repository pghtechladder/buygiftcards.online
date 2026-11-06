"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRANDS, CATEGORIES, Brand } from "@/lib/brands";
import { useCart } from "@/context/CartContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useSession } from "next-auth/react";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./Icon";
import { DeviceInfo } from "@/lib/device";

const fmt = (n: number) => `$${n.toFixed(2)}`;

const QUICK_AMOUNTS = [10, 25, 50, 100];

export function MobileHomeIndex({ deviceInfo }: { deviceInfo?: DeviceInfo }) {
  const router = useRouter();
  const { add, setOpen: setCartOpen, count, total } = useCart();
  const { data: session } = useSession();
  const { open: openAuthModal } = useAuthModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [quickBuyBrand, setQuickBuyBrand] = useState<Brand | null>(null);
  const [quickBuyAmount, setQuickBuyAmount] = useState<number>(25);
  const [justAddedSlug, setJustAddedSlug] = useState<string | null>(null);

  const popularBrands = BRANDS.slice(0, 12);
  const dealBrands = BRANDS.filter((b) => b.discountPercent).slice(0, 10);

  const filteredBrands = BRANDS.filter((b) => {
    const matchesCategory = selectedCategory === "All" || b.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).slice(0, 24);

  const openQuickBuy = (b: Brand) => {
    const defaultAmt = b.denominations.includes(25)
      ? 25
      : b.denominations[1] ?? b.denominations[0] ?? b.min;
    setQuickBuyBrand(b);
    setQuickBuyAmount(defaultAmt);
  };

  const handleQuickAdd = (b: Brand, amt: number, openCheckoutImmediately = false) => {
    add({
      brandSlug: b.slug,
      brandName: b.name,
      domain: b.domain,
      color: b.color,
      amount: amt,
      qty: 1,
      deliveryType: b.type === "physical" ? "physical" : "egift",
    });
    setJustAddedSlug(b.slug);
    setTimeout(() => setJustAddedSlug(null), 1500);
    setQuickBuyBrand(null);
    if (openCheckoutImmediately) {
      setCartOpen(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="pb-24 bg-ink-50 min-h-screen">
      {/* Mobile Express Hero Header */}
      <div className="bg-gradient-to-br from-[#0a4738] via-brand-700 to-[#7f1d1d] text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Icon name="zap" size={12} />
            Mobile Express Store
            {deviceInfo?.os && deviceInfo.os !== "other" ? ` · ${deviceInfo.os.toUpperCase()}` : ""}
          </div>
          {!session?.user ? (
            <button
              onClick={() => openAuthModal("signin")}
              className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
            >
              Sign In / Join
            </button>
          ) : (
            <Link
              href="/account"
              className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold truncate max-w-[140px]"
            >
              Hi, {session.user.firstName || session.user.email}
            </Link>
          )}
        </div>

        <h1 className="text-2xl font-extrabold leading-tight tracking-tight mb-1.5">
          Tap, Pay &amp; Send Instant eGift Cards
        </h1>
        <p className="text-xs text-white/85 mb-4">
          {BRANDS.length}+ official brands · One-tap PayPal mobile checkout · Instant email delivery
        </p>

        {/* Mobile Instant Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Amazon, Visa, Starbucks, Xbox…"
            className="w-full rounded-2xl bg-white text-ink-950 pl-10 pr-20 py-3.5 text-sm font-semibold shadow-md outline-none focus:ring-2 focus:ring-amber-400"
          />
          <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 bg-ink-100 px-2 py-1 rounded-lg"
            >
              Clear
            </button>
          )}
        </form>

        {/* Quick Action Pills */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "All Brands", icon: "gift" as const, href: "/catalog" },
            { label: "Redeem", icon: "checkCircle" as const, href: "/redeem" },
            { label: "Deals", icon: "zap" as const, href: "/deals" },
            { label: "Track Order", icon: "package" as const, href: "/track-order" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="bg-white/12 active:bg-white/25 backdrop-blur border border-white/15 rounded-xl py-2.5 px-2 flex flex-col items-center justify-center gap-1 text-center transition"
            >
              <Icon name={action.icon} size={16} className="text-amber-300" />
              <span className="text-[11px] font-bold text-white leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sticky Floating Cart Checkout Bar if items in cart */}
      {count > 0 && (
        <div className="px-4 mt-4">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FFC439] text-[#003087] font-extrabold text-sm shadow-md flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Icon name="cart" size={18} />
              <span>
                {count} {count === 1 ? "Card" : "Cards"} Ready ({fmt(total)})
              </span>
            </span>
            <span className="bg-[#003087] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl">
              PayPal Checkout &rarr;
            </span>
          </button>
        </div>
      )}

      {/* Horizontal Category Filter Pills */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-extrabold text-ink-900 uppercase tracking-wide">Browse Categories</h2>
          <Link href="/catalog" className="text-xs font-bold text-brand-600">
            See All ({BRANDS.length}) &rarr;
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          {["All", ...CATEGORIES].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap border transition flex-shrink-0 ${
                  active
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-white text-ink-700 border-ink-100"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Popular Swipe Carousel (when "All" and no search) */}
      {selectedCategory === "All" && !searchQuery && (
        <section className="mt-5">
          <div className="px-4 flex items-center justify-between mb-2.5">
            <h2 className="text-base font-extrabold text-ink-950">🔥 Most Popular — 1-Tap Buy</h2>
            <span className="text-[11px] font-semibold text-ink-400">Swipe &rarr;</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none px-4">
            {popularBrands.map((b) => (
              <div
                key={b.slug}
                className="w-40 flex-shrink-0 bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <Link
                  href={`/product/${b.slug}`}
                  className="h-24 flex items-center justify-center relative"
                  style={{ background: `linear-gradient(145deg, ${b.color}, ${b.color}cc)` }}
                >
                  <BrandLogo domain={b.domain} name={b.name} size={52} radius={12} bg="rgba(255,255,255,0.96)" />
                  {!!b.discountPercent && (
                    <span className="absolute top-2 right-2 bg-accent-500 text-ink-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {b.discountPercent}% OFF
                    </span>
                  )}
                </Link>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/product/${b.slug}`} className="font-extrabold text-xs text-ink-950 line-clamp-1">
                      {b.name}
                    </Link>
                    <div className="text-[11px] text-ink-500 font-semibold mt-0.5">
                      ${b.min} – ${b.max}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openQuickBuy(b)}
                    className={`mt-2.5 w-full py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1 ${
                      justAddedSlug === b.slug
                        ? "bg-green-600 text-white"
                        : "bg-brand-600 active:bg-brand-700 text-white"
                    }`}
                  >
                    {justAddedSlug === b.slug ? (
                      <>
                        <Icon name="checkCircle" size={13} /> Added
                      </>
                    ) : (
                      <>
                        <Icon name="zap" size={13} /> Quick Buy
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instant Savings Deals Strip */}
      {selectedCategory === "All" && !searchQuery && dealBrands.length > 0 && (
        <section className="mt-5">
          <div className="px-4 flex items-center justify-between mb-2.5">
            <h2 className="text-base font-extrabold text-ink-950">🏷️ Instant Discount Deals</h2>
            <Link href="/deals" className="text-xs font-bold text-brand-600">
              All Deals &rarr;
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-4">
            {dealBrands.map((b) => (
              <button
                key={b.slug}
                type="button"
                onClick={() => openQuickBuy(b)}
                className="flex items-center gap-3 bg-white border border-ink-100 rounded-2xl p-3 flex-shrink-0 w-64 text-left shadow-sm active:scale-[0.99] transition"
              >
                <BrandLogo domain={b.domain} name={b.name} size={46} radius={10} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-ink-950 truncate">{b.name}</span>
                    <span className="bg-accent-500 text-ink-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                      {b.discountPercent}% OFF
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-500 mt-0.5">
                    Tap to buy · ${b.min}–${b.max}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main Mobile 2-Column Express Grid */}
      <section className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-ink-950">
            {searchQuery
              ? `Search Results (${filteredBrands.length})`
              : selectedCategory === "All"
                ? "All Gift Cards"
                : `${selectedCategory} Cards`}
          </h2>
          <Link href="/catalog" className="text-xs font-bold text-brand-600">
            Full Catalog &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredBrands.map((b) => (
            <div
              key={b.slug}
              className="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <Link
                href={`/product/${b.slug}`}
                className="h-24 flex items-center justify-center relative"
                style={{ background: `linear-gradient(150deg, ${b.color}, ${b.color}cc)` }}
              >
                <BrandLogo domain={b.domain} name={b.name} size={52} radius={12} bg="rgba(255,255,255,0.96)" />
                {!!b.discountPercent && (
                  <span className="absolute top-2 right-2 bg-accent-500 text-ink-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                    {b.discountPercent}% OFF
                  </span>
                )}
              </Link>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <Link href={`/product/${b.slug}`} className="font-bold text-xs text-ink-950 line-clamp-1">
                    {b.name}
                  </Link>
                  <div className="text-[11px] text-ink-500 font-medium mt-0.5">
                    ${b.min} – ${b.max} · eGift
                  </div>
                </div>

                <div className="mt-2.5 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openQuickBuy(b)}
                    className="flex-1 py-2 rounded-xl bg-brand-600 active:bg-brand-700 text-white text-xs font-extrabold transition flex items-center justify-center gap-1"
                  >
                    <Icon name="zap" size={12} />
                    Buy Now
                  </button>
                  <Link
                    href={`/product/${b.slug}`}
                    aria-label={`Customize ${b.name}`}
                    className="px-2.5 py-2 rounded-xl border border-ink-200 text-ink-700 text-xs font-bold flex items-center justify-center"
                  >
                    Gift
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBrands.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-ink-500 text-sm">
            No matching brands found.{" "}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-brand-600 font-bold underline"
            >
              Reset filters
            </button>
          </div>
        )}

        <div className="mt-5 text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-ink-950 text-white font-extrabold text-sm shadow"
          >
            Browse All {BRANDS.length} Brands &amp; Filters
            <Icon name="chevronRight" size={16} />
          </Link>
        </div>
      </section>

      {/* Mobile Bottom Sheet for 1-Tap Quick Purchase */}
      {quickBuyBrand && (
        <div className="fixed inset-0 z-[550] flex items-end justify-center">
          <div
            onClick={() => setQuickBuyBrand(null)}
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl animate-slide-in space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandLogo domain={quickBuyBrand.domain} name={quickBuyBrand.name} size={48} radius={12} />
                <div>
                  <h3 className="font-extrabold text-base text-ink-950">{quickBuyBrand.name} eGift Card</h3>
                  <p className="text-xs text-ink-500">Instant digital delivery · $0 fees</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickBuyBrand(null)}
                className="p-2 rounded-full bg-ink-50 text-ink-500"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 mb-2">
                Select Amount
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(quickBuyBrand.denominations.length > 0
                  ? quickBuyBrand.denominations.slice(0, 8)
                  : QUICK_AMOUNTS.filter((a) => a >= quickBuyBrand.min && a <= quickBuyBrand.max)
                ).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickBuyAmount(amt)}
                    className={`py-3 rounded-xl font-extrabold text-sm border-2 transition ${
                      quickBuyAmount === amt
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-ink-100 text-ink-800"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleQuickAdd(quickBuyBrand, quickBuyAmount, false)}
                className="py-3.5 rounded-xl border-2 border-brand-600 text-brand-700 font-extrabold text-sm flex items-center justify-center gap-1.5"
              >
                <Icon name="cart" size={16} />
                Add ${quickBuyAmount}
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(quickBuyBrand, quickBuyAmount, true)}
                className="py-3.5 rounded-xl bg-[#FFC439] text-[#003087] font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Icon name="zap" size={16} />
                Buy Now · ${quickBuyAmount}
              </button>
            </div>

            <Link
              href={`/product/${quickBuyBrand.slug}`}
              onClick={() => setQuickBuyBrand(null)}
              className="block text-center text-xs font-bold text-ink-500 hover:text-brand-600 pt-1"
            >
              Want to add a custom photo, gift message, or custom amount? Full options &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
