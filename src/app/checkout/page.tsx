"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { getBrand, chargeAmountCents } from "@/lib/brands";
import { CountryCode, formatCurrency, resolveCountryFromHostOrEnv } from "@/lib/country-config";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { parseDeviceFromUserAgent, DeviceInfo } from "@/lib/device";

export default function DedicatedCheckoutPage() {
  const { data: session } = useSession();
  const { open: openAuthModal } = useAuthModal();
  const { items, updateQty, remove, total, faceTotal, savingsTotal } = useCart();

  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [country, setCountry] = useState<CountryCode>(() => resolveCountryFromHostOrEnv());

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCountry(resolveCountryFromHostOrEnv(window.location.host));
    const check = () => {
      const info = parseDeviceFromUserAgent(navigator.userAgent);
      setDevice(info);
      setIsMobileView(info.isMobile || window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fmt = (n: number) => formatCurrency(n, country);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-ink-100 rounded-3xl p-8 sm:p-12 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Icon name="cart" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-950">Your Checkout Cart is Empty</h1>
          <p className="text-sm text-ink-500">
            Browse our gift card catalog to add eGift or physical cards before checking out.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-600 text-white font-extrabold text-sm hover:bg-brand-700 transition"
          >
            Shop Gift Cards &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-10 pb-28">
      {/* Device-Aware Checkout Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-1.5">
            <Icon name="lock" size={12} />
            {isMobileView
              ? `Mobile Express Checkout${
                  device?.os && device.os !== "other" ? ` · ${device.os.toUpperCase()}` : ""
                }`
              : "Secure Checkout"}
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-ink-950">
            Complete Your Gift Card Purchase
          </h1>
        </div>
        <Link
          href="/catalog"
          className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700"
        >
          &larr; Continue Shopping
        </Link>
      </div>

      {/* Responsive Layout: Stacked on Mobile, 12-Col Split on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Order Summary Column */}
        <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
          <div className="bg-white border border-ink-100 rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 mb-3.5">
              <h2 className="text-base sm:text-lg font-extrabold text-ink-950">
                Order Summary ({items.reduce((s, i) => s + i.qty, 0)})
              </h2>
              <span className="text-sm font-extrabold text-brand-700">{fmt(total)}</span>
            </div>

            <div className="divide-y divide-ink-100 space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {items.map((item) => {
                const brand = getBrand(item.brandSlug, country);
                const chargePerCard = brand
                  ? chargeAmountCents(brand, item.amount) / 100
                  : item.amount;
                const hasDiscount = chargePerCard < item.amount;
                const lineTotal = chargePerCard * item.qty;

                return (
                  <div key={item.key} className="pt-3 first:pt-0 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <BrandLogo domain={item.domain} name={item.brandName} size={40} radius={10} />
                        {hasDiscount && (
                          <span className="absolute -top-1.5 -right-1.5 bg-accent-500 text-ink-950 text-[8px] font-extrabold px-1 py-0.5 rounded-full shadow leading-none">
                            -{brand?.discountPercent}%
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-ink-950 truncate">
                            {item.brandName}
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(item.key)}
                            className="text-ink-400 hover:text-red-500"
                            aria-label={`Remove ${item.brandName}`}
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </div>
                        <div className="text-xs text-ink-500">
                          {fmt(item.amount)} {item.deliveryType === "egift" ? "eGift" : "Physical"}
                          {hasDiscount && (
                            <span className="ml-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-accent-500 text-ink-950">
                              {brand?.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-13">
                      <div className="inline-flex border border-ink-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQty(item.key, item.qty - 1)}
                          className="w-8 h-7 bg-ink-50 font-bold text-sm"
                        >
                          −
                        </button>
                        <span className="w-8 flex items-center justify-center text-xs font-extrabold">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.key, item.qty + 1)}
                          className="w-8 h-7 bg-ink-50 font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-ink-950">
                          {fmt(lineTotal)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-ink-400 line-through ml-1.5">
                            {fmt(item.amount * item.qty)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3.5 border-t border-ink-100 space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Gift Card Face Value</span>
                <span>{fmt(faceTotal)}</span>
              </div>
              {savingsTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Instant Savings</span>
                  <span>−{fmt(savingsTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold text-ink-950 pt-2 border-t border-ink-100">
                <span>Total Due</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Account Column */}
        <div className="lg:col-span-7 order-2 lg:order-1 space-y-4">
          {/* Compact Account Bar */}
          {!session?.user ? (
            <div className="bg-white border border-ink-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <Icon name="lock" size={16} />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-ink-950">
                    Guest or Member Checkout
                  </div>
                  <p className="text-xs text-ink-500">
                    Sign in now, or complete payment below and claim your order afterward.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openAuthModal("signin")}
                  className="py-2 px-3.5 rounded-xl border border-ink-200 hover:bg-ink-50 text-ink-800 font-bold text-xs transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="py-2 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-emerald-950">
                <Icon name="checkCircle" size={16} className="text-emerald-600 flex-shrink-0" />
                <span>
                  Signed in as <strong>{session.user.email}</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">Verified</span>
            </div>
          )}

          {/* Unified Progressive Payment Method Selector Card */}
          <div className="bg-white border border-ink-100 rounded-3xl p-4 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-ink-950">
                  Choose How You Want to Pay
                </h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  Pay with PayPal, Debit/Credit Card, Apple Pay, Google Pay, or Cryptocurrency.
                </p>
              </div>
            </div>

            <PaymentMethodSelector compact={false} />

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 text-[11px] text-ink-400 border-t border-ink-100">
              <span className="flex items-center gap-1">
                <Icon name="lock" size={12} className="text-brand-600" />
                256-Bit SSL
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="zap" size={12} className="text-brand-600" />
                Instant eGift Delivery
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="shield" size={12} className="text-brand-600" />
                100% Purchase Protection
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
