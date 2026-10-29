"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { Icon } from "./Icon";

const TOP_UTILITY_LINKS = [
  { label: "Redeem Gift Card", href: "/redeem" },
  { label: "Track Order", href: "/track-order" },
  { label: "Activate Card", href: "/activate" },
  { label: "Check Balance", href: "/balance" },
  { label: "Corporate & Bulk", href: "/business" },
  { label: "Support & FAQ", href: "/support" },
];

const NAV_LINKS = [
  { label: "🎄 Holiday Shop", href: "/occasions?occasion=holidays", highlight: true },
  { label: "All Brands", href: "/catalog" },
  { label: "BuyGiftCards Card", href: "/product/buygiftcards" },
  { label: "Redeem Card", href: "/redeem" },
  { label: "Visa®", href: "/product/visa" },
  { label: "Mastercard®", href: "/product/mastercard" },
  { label: "Multi-Brand", href: "/catalog?category=Multi-Brand" },
  { label: "eGift Cards", href: "/catalog?type=egift" },
  { label: "Physical Cards", href: "/catalog?type=physical" },
  { label: "Occasions", href: "/occasions" },
  { label: "Deals & Promos", href: "/deals" },
  { label: "Group Gifting", href: "/group-gifts" },
];

function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");
  const currentCategory = searchParams.get("category");
  const currentOccasion = searchParams.get("occasion");

  return (
    <>
      {NAV_LINKS.map((l) => {
        const [linkPath, linkQuery] = l.href.split("?");
        const qs = new URLSearchParams(linkQuery || "");
        const linkType = qs.get("type");
        const linkCategory = qs.get("category");
        const linkOccasion = qs.get("occasion");

        const active =
          pathname === linkPath &&
          (linkType ? linkType === currentType : !currentType) &&
          (linkCategory ? linkCategory === currentCategory : !currentCategory) &&
          (linkOccasion ? linkOccasion === currentOccasion : !currentOccasion);

        return (
          <Link
            key={l.label}
            href={l.href}
            className={`px-3 sm:px-3.5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
              active
                ? "text-brand-600 border-brand-500"
                : l.highlight
                ? "text-red-700 border-transparent hover:text-red-800 hover:border-red-300"
                : "text-ink-600 border-transparent hover:text-brand-600 hover:border-brand-200"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}

export function Nav() {
  const { count, setOpen } = useCart();
  const { data: authSession, status } = useSession();
  const { open: openAuthModal } = useAuthModal();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ink-100 shadow-sm">
      {/* Top Utility Bar (Giftcards.com style) */}
      <div className="bg-ink-950 text-white/80 text-xs border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="text-amber-400 font-bold">★ Holiday Gifting Guarantee:</span>
            <span className="hidden sm:inline text-white/75">Instant email delivery on 165+ top brands · $0 fees on brand cards</span>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none flex-shrink-0">
            {TOP_UTILITY_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-white transition whitespace-nowrap font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo-mark-512.png" alt="" width={36} height={36} priority className="rounded-[9px]" />
            <span className="hidden sm:inline text-lg font-extrabold tracking-tight text-ink-900">
              buygiftcards<span className="text-brand-600">.online</span>
            </span>
          </Link>

          <form onSubmit={submitSearch} className="flex-1 min-w-0 max-w-lg relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search 165+ gift card brands, Visa, Amazon, Starbucks…"
              className="w-full rounded-full border border-ink-100 bg-ink-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
            <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          </form>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href="/orders"
              className="hidden md:block px-3 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900 rounded-lg hover:bg-ink-50 transition"
            >
              My Orders
            </Link>
            {status === "loading" ? null : authSession ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  className="hidden md:block px-3 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900 rounded-lg hover:bg-ink-50 transition"
                >
                  Hi, {authSession.user.firstName ?? authSession.user.email}
                </button>
                {accountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAccountMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-ink-100 rounded-xl shadow-lg py-1.5 z-20">
                      <Link
                        href="/account"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50"
                      >
                        My Account &amp; Orders
                      </Link>
                      <Link
                        href="/balance"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50"
                      >
                        Check Balance
                      </Link>
                      <Link
                        href="/activate"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50"
                      >
                        Activate Card
                      </Link>
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          signOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal("signin")}
                className="hidden md:block px-3 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900 rounded-lg hover:bg-ink-50 transition"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open cart"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                count > 0 ? "bg-brand-600 text-white hover:bg-brand-700" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              <Icon name="cart" size={18} />
              <span className="hidden sm:inline">{count > 0 ? `Cart (${count})` : "Cart"}</span>
              {count > 0 && <span className="sm:hidden">{count}</span>}
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto -mt-px pb-px scrollbar-none">
          <Suspense
            fallback={NAV_LINKS.map((l) => (
              <span
                key={l.label}
                className="px-3 sm:px-3.5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 border-transparent text-ink-600"
              >
                {l.label}
              </span>
            ))}
          >
            <NavLinks />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
