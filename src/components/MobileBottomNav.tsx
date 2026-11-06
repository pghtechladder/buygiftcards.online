"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { Icon } from "./Icon";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count, setOpen: setCartOpen } = useCart();
  const { data: session } = useSession();
  const { open: openAuthModal } = useAuthModal();

  const isHome = pathname === "/" || pathname === "/m";
  const isCatalog = pathname.startsWith("/catalog") || pathname.startsWith("/product");
  const isCheckout = pathname.startsWith("/checkout");
  const isRedeem = pathname.startsWith("/redeem");
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/orders");

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[450] bg-white/95 backdrop-blur border-t border-ink-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 items-center">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold transition ${
            isHome ? "text-brand-600" : "text-ink-500"
          }`}
        >
          <Icon name="gift" size={19} />
          <span>Home</span>
        </Link>

        <Link
          href="/catalog"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold transition ${
            isCatalog ? "text-brand-600" : "text-ink-500"
          }`}
        >
          <Icon name="search" size={19} />
          <span>Brands</span>
        </Link>

        <Link
          href="/checkout"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-extrabold relative ${
            isCheckout ? "text-brand-600" : "text-brand-700"
          }`}
        >
          <div className="w-10 h-10 -mt-4 rounded-2xl bg-brand-600 text-white shadow-md flex items-center justify-center relative">
            <Icon name="cart" size={19} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-ink-950 text-[10px] font-extrabold flex items-center justify-center">
                {count}
              </span>
            )}
          </div>
          <span>Checkout</span>
        </Link>

        <Link
          href="/redeem"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold transition ${
            isRedeem ? "text-brand-600" : "text-ink-500"
          }`}
        >
          <Icon name="checkCircle" size={19} />
          <span>Redeem</span>
        </Link>

        {session?.user ? (
          <Link
            href="/account"
            className={`flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold transition ${
              isAccount ? "text-brand-600" : "text-ink-500"
            }`}
          >
            <Icon name="wallet" size={19} />
            <span>Account</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("signin")}
            className="flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-ink-500"
          >
            <Icon name="lock" size={19} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}

