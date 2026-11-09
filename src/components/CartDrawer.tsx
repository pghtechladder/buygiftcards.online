"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { getBrand, chargeAmountCents, activationFeeCents } from "@/lib/brands";
import { CountryCode, formatCurrency, getCurrencyCode, resolveCountryFromHostOrEnv } from "@/lib/country-config";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./Icon";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { trackRetailEvent } from "@/lib/analytics";
import { parseDeviceFromUserAgent, DeviceInfo } from "@/lib/device";

declare global {
  interface Window {
    paypal?: {
      FUNDING?: {
        PAYPAL?: string;
        CARD?: string;
        VENMO?: string;
        PAYLATER?: string;
      };
      Buttons: (config: {
        fundingSource?: string;
        style?: Record<string, unknown>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: unknown) => void;
      }) => {
        isEligible?: () => boolean;
        render: (el: HTMLElement) => Promise<void>;
      };
    };
  }
}

export function CartDrawer() {
  const { data: session } = useSession();
  const { open: openAuthModal } = useAuthModal();
  const { items, isOpen, setOpen, updateQty, remove, total, faceTotal, savingsTotal } = useCart();
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [country, setCountry] = useState<CountryCode>(() => resolveCountryFromHostOrEnv());

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCountry(resolveCountryFromHostOrEnv(window.location.host));
    }
  }, [isOpen]);

  const fmt = (n: number) => formatCurrency(n, country);
  const currencyCode = getCurrencyCode(country);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") {
      const info = parseDeviceFromUserAgent(navigator.userAgent);
      setDevice(info);
      setIsMobileScreen(info.isMobile || window.innerWidth <= 767);
      return;
    }
    const mql = window.matchMedia("(max-width: 767px)");
    const updateDevice = (e: MediaQueryListEvent | MediaQueryList) => {
      const info = parseDeviceFromUserAgent(navigator.userAgent);
      setDevice(info);
      setIsMobileScreen(info.isMobile || e.matches);
    };
    updateDevice(mql);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", updateDevice);
      return () => mql.removeEventListener("change", updateDevice);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(updateDevice);
      return () => mql.removeListener(updateDevice);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    trackRetailEvent("view_cart", {
      currency: currencyCode,
      value: total,
      items: items.map((i) => ({
        item_id: i.brandSlug,
        item_name: i.brandName,
        item_variant: i.deliveryType,
        price: i.amount,
        quantity: i.qty,
      })),
    });
  }, [isOpen, items, total, currencyCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500]">
      <div
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
      />

      {/* Responsive Drawer Container */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-full sm:max-w-[460px] bg-white shadow-2xl flex flex-col animate-slide-in overflow-hidden">
        {/* Sticky Top Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-ink-100 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-ink-950">
              Checkout ({items.reduce((s, i) => s + i.qty, 0)})
            </h3>
            {device && (
              <p className="text-[11px] text-ink-500">
                {isMobileScreen
                  ? "Mobile Express · PayPal, Card, Apple/Google Pay & Crypto"
                  : "Instant Digital Delivery · Multiple Payment Options"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-xs hover:bg-brand-100 transition"
              >
                Full Page
              </Link>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close cart"
              className="p-2 rounded-full bg-ink-50 text-ink-500 hover:text-ink-900 transition"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4 pb-24 sm:pb-8">
          {items.length === 0 ? (
            <div className="text-center py-16 text-ink-400">
              <Icon name="cart" size={44} className="mx-auto mb-4 text-ink-200" strokeWidth={1.5} />
              <div className="font-medium">Your cart is empty</div>
            </div>
          ) : (
            <>
              {/* Cart Line Items */}
              <div className="divide-y divide-ink-100 border border-ink-100 rounded-2xl bg-white px-3.5 sm:px-4">
                {items.map((item) => {
                  const brand = getBrand(item.brandSlug, country);
                  const chargePerCard = brand
                    ? chargeAmountCents(brand, item.amount) / 100
                    : item.amount;
                  const actFeePerCard = brand ? activationFeeCents(brand, item.amount) / 100 : 0;
                  const hasDiscount = chargePerCard < item.amount;
                  const lineTotal = chargePerCard * item.qty;

                  return (
                    <div key={item.key} className="py-3 flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                        {item.customPhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.customPhotoUrl}
                            alt=""
                            className="w-10 h-10 rounded-[10px] object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="relative flex-shrink-0">
                            <BrandLogo
                              domain={item.domain}
                              name={item.brandName}
                              size={40}
                              radius={10}
                            />
                            {hasDiscount && (
                              <span className="absolute -top-1.5 -right-1.5 bg-accent-500 text-ink-950 text-[8px] font-extrabold px-1 py-0.5 rounded-full shadow leading-none">
                                -{brand?.discountPercent}%
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-ink-950 truncate">
                              {item.brandName}
                            </span>
                            <button
                              onClick={() => remove(item.key)}
                              aria-label={`Remove ${item.brandName}`}
                              className="text-ink-400 hover:text-red-500 transition flex-shrink-0"
                            >
                              <Icon name="x" size={15} />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500 mt-0.5">
                            <span>
                              {fmt(item.amount)}{" "}
                              {item.deliveryType === "egift" ? "eGift" : "Physical"}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-accent-500 text-ink-950">
                                {brand?.discountPercent}% OFF
                              </span>
                            )}
                            {actFeePerCard > 0 && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-ink-100 text-ink-700">
                                +{fmt(actFeePerCard)} Fee
                              </span>
                            )}
                          </div>
                          {item.recipientEmail && (
                            <div className="text-[11px] text-brand-700 font-medium truncate mt-0.5">
                              To:{" "}
                              {item.recipientName
                                ? `${item.recipientName} (${item.recipientEmail})`
                                : item.recipientEmail}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pl-13">
                        <div className="inline-flex border border-ink-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQty(item.key, item.qty - 1)}
                            className="w-8 h-7 bg-ink-50 font-bold text-sm active:bg-ink-100"
                          >
                            −
                          </button>
                          <span className="w-8 flex items-center justify-center text-xs font-extrabold">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.key, item.qty + 1)}
                            className="w-8 h-7 bg-ink-50 font-bold text-sm active:bg-ink-100"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-ink-950">
                            {fmt(lineTotal)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-ink-400 line-through ml-1.5">
                              {fmt(item.amount * item.qty)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary Totals */}
              <div className="p-3.5 rounded-2xl bg-ink-50 border border-ink-100 space-y-1 text-sm">
                <div className="flex justify-between text-ink-600 text-xs">
                  <span>Gift Card Value</span>
                  <span>{fmt(faceTotal)}</span>
                </div>
                {savingsTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold text-xs">
                    <span>Instant Discount Savings</span>
                    <span>−{fmt(savingsTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-ink-950 pt-1.5 border-t border-ink-200/70">
                  <span>Total to Pay</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              {/* Compact Account Option */}
              {!session?.user && (
                <div className="px-3.5 py-2.5 rounded-2xl bg-brand-50/70 border border-brand-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-ink-700">
                    <span className="font-bold text-ink-950">Guest Checkout</span> or Sign In
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openAuthModal("signin")}
                      className="py-1.5 px-2.5 rounded-lg border border-brand-200 bg-white text-brand-900 font-bold text-[11px] hover:bg-brand-50 transition"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal("register")}
                      className="py-1.5 px-2.5 rounded-lg bg-brand-600 text-white font-bold text-[11px] hover:bg-brand-700 transition"
                    >
                      Register
                    </button>
                  </div>
                </div>
              )}

              {/* Progressive Payment Method Selector */}
              <PaymentMethodSelector
                compact={true}
                onSuccessComplete={() => setOpen(false)}
              />

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-ink-400">
                <Icon name="lock" size={12} />
                256-Bit Encrypted Checkout · Instant eGift Delivery
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
