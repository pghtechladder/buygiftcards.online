"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { getBrand, chargeAmountCents } from "@/lib/brands";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./Icon";
import { trackRetailEvent } from "@/lib/analytics";
import { parseDeviceFromUserAgent, DeviceInfo } from "@/lib/device";

const fmt = (n: number) => `$${n.toFixed(2)}`;

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "BAAvF_aLV7jrJ7SZG0qB5WSUEoJH8GqF88uriChuLdsgV6-XWKmbVZnexjrv8-d7VM8K_QwTIqeQqo6ZOg";

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
  const router = useRouter();
  const { data: session } = useSession();
  const { open: openAuthModal } = useAuthModal();
  const { items, isOpen, setOpen, updateQty, remove, total, faceTotal, savingsTotal, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    const updateDevice = (e: MediaQueryListEvent | MediaQueryList) => {
      const info = parseDeviceFromUserAgent(navigator.userAgent);
      setDevice(info);
      setIsMobileScreen(info.isMobile || e.matches);
    };
    updateDevice(mql);
    mql.addEventListener("change", updateDevice);
    return () => mql.removeEventListener("change", updateDevice);
  }, []);

  const idempotencyKey = useMemo(
    () => crypto.randomUUID(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(items.map((i) => [i.key, i.qty]))]
  );

  const serializedItems = useMemo(
    () =>
      items.map((i) => ({
        brandSlug: i.brandSlug,
        amount: i.amount,
        qty: i.qty,
        deliveryType: i.deliveryType,
        customPhotoUrl: i.customPhotoUrl,
        recipientName: i.recipientName,
        recipientEmail: i.recipientEmail,
        senderName: i.senderName,
        giftMessage: i.giftMessage,
        occasion: i.occasion,
        deliveryDate: i.deliveryDate,
      })),
    [items]
  );

  // Load PayPal JS SDK with Debit/Credit Card (`enable-funding=card,venmo,paylater`) enabled
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    trackRetailEvent("view_cart", {
      currency: "USD",
      value: total,
      items: items.map((i) => ({
        item_id: i.brandSlug,
        item_name: i.brandName,
        item_variant: i.deliveryType,
        price: i.amount,
        quantity: i.qty,
      })),
    });

    if (window.paypal?.Buttons) {
      setSdkReady(true);
      return;
    }

    const existingScript = document.getElementById("paypal-js-sdk") as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => setSdkReady(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-js-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      PAYPAL_CLIENT_ID
    )}&currency=USD&intent=capture&components=buttons,funding-eligibility&enable-funding=card,venmo,paylater`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => {
      setSdkReady(false);
    };
    document.body.appendChild(script);
  }, [isOpen, items.length]);

  // Render PayPal Smart Buttons (including inline Debit or Credit Card accordion)
  useEffect(() => {
    if (!isOpen || !sdkReady || !window.paypal?.Buttons || !paypalContainerRef.current || items.length === 0) {
      return;
    }

    const container = paypalContainerRef.current;
    container.innerHTML = "";

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "paypal",
        height: isMobileScreen ? 46 : 45,
      },
      createOrder: async () => {
        setError(null);
        trackRetailEvent("begin_checkout", {
          currency: "USD",
          value: total,
          payment_type: "paypal_or_card_smart_buttons",
          items: items.map((i) => ({
            item_id: i.brandSlug,
            item_name: i.brandName,
            price: i.amount,
            quantity: i.qty,
          })),
        });
        const res = await fetch("/api/checkout/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            idempotencyKey,
            items: serializedItems,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.paypalOrderId) {
          throw new Error(data.error || "Failed to initialize PayPal order");
        }
        return data.paypalOrderId;
      },
      onApprove: async (data) => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/checkout/paypal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "capture",
              paypalOrderId: data.orderID,
            }),
          });
          const captured = await res.json();
          if (!res.ok || !captured.order) {
            throw new Error(captured.error || "Failed to capture PayPal payment");
          }
          trackRetailEvent("purchase", {
            transaction_id: captured.order.orderNumber,
            paypal_order_id: data.orderID,
            currency: "USD",
            value: total,
            items: items.map((i) => ({
              item_id: i.brandSlug,
              item_name: i.brandName,
              price: i.amount,
              quantity: i.qty,
            })),
          });
          clear();
          setOpen(false);
          const emailParam = captured.order.customerEmail
            ? `?email=${encodeURIComponent(captured.order.customerEmail)}`
            : "";
          router.push(`/orders/${captured.order.orderNumber}${emailParam}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Payment capture failed");
          setLoading(false);
        }
      },
      onError: (err) => {
        console.error("[PayPal Buttons error]", err);
        setError("Checkout encountered an error. You can also use the Full-Screen Mobile Checkout page below.");
        setLoading(false);
      },
    });

    buttons.render(container).catch((err) => {
      console.warn("[PayPal Buttons render error]", err);
    });
  }, [isOpen, sdkReady, serializedItems, idempotencyKey, clear, setOpen, router, session?.user, isMobileScreen]);

  if (!isOpen) return null;

  const checkoutWithPayPalRedirect = async (landingPage: "LOGIN" | "GUEST_CHECKOUT" = "LOGIN") => {
    setLoading(true);
    setError(null);
    trackRetailEvent("begin_checkout", {
      currency: "USD",
      value: total,
      payment_type: landingPage === "GUEST_CHECKOUT" ? "debit_credit_card_redirect" : "paypal_redirect",
      items: items.map((i) => ({
        item_id: i.brandSlug,
        item_name: i.brandName,
        price: i.amount,
        quantity: i.qty,
      })),
    });
    try {
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          idempotencyKey,
          landingPage,
          items: serializedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout order");
      }

      const approveUrl =
        data.approveUrl ||
        data.url ||
        (data.links &&
          data.links.find((l: { rel: string; href: string }) => l.rel === "payer-action" || l.rel === "approve")?.href);

      if (!approveUrl) {
        throw new Error("Approval redirect link is missing from response");
      }

      window.location.href = approveUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout error");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500]">
      <div onClick={() => setOpen(false)} className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />

      {/* Responsive Drawer Container: Full-height scrollable sheet on mobile so Credit Card fields expand cleanly */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-full sm:max-w-[460px] bg-white shadow-2xl flex flex-col animate-slide-in overflow-hidden">
        {/* Sticky Top Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-ink-100 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-ink-950">
              Checkout ({items.reduce((s, i) => s + i.qty, 0)})
            </h3>
            {device && (
              <p className="text-[11px] text-ink-500">
                {isMobileScreen ? "Mobile-Optimized Checkout · Credit Card & PayPal" : "Secure Desktop Checkout · Instant Delivery"}
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

        {/* Single Unified Scrollable Body so expanding Credit Card iframe never gets cut off on Mobile */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-5 pb-24 sm:pb-8">
          {items.length === 0 ? (
            <div className="text-center py-16 text-ink-400">
              <Icon name="cart" size={44} className="mx-auto mb-4 text-ink-200" strokeWidth={1.5} />
              <div className="font-medium">Your cart is empty</div>
            </div>
          ) : (
            <>
              {/* Cart Line Items (Responsive Mobile & Desktop Alignment) */}
              <div className="divide-y divide-ink-100 border border-ink-100 rounded-2xl bg-white px-3.5 sm:px-4">
                {items.map((item) => {
                  const brand = getBrand(item.brandSlug);
                  const chargePerCard = brand ? chargeAmountCents(brand, item.amount) / 100 : item.amount;
                  const hasDiscount = chargePerCard < item.amount;
                  const lineTotal = chargePerCard * item.qty;

                  return (
                    <div key={item.key} className="py-3.5 flex flex-col gap-2.5">
                      <div className="flex items-start gap-3">
                        {item.customPhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.customPhotoUrl}
                            alt=""
                            className="w-11 h-11 rounded-[10px] object-cover flex-shrink-0"
                          />
                        ) : (
                          <BrandLogo domain={item.domain} name={item.brandName} size={44} radius={10} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-ink-950 truncate">{item.brandName}</span>
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
                              {fmt(item.amount)} {item.deliveryType === "egift" ? "eGift" : "Physical"}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-accent-500 text-ink-950">
                                {brand?.discountPercent}% OFF
                              </span>
                            )}
                          </div>
                          {item.recipientEmail && (
                            <div className="text-[11px] text-brand-700 font-medium truncate mt-0.5">
                              To: {item.recipientName ? `${item.recipientName} (${item.recipientEmail})` : item.recipientEmail}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pl-14">
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
                          <span className="font-extrabold text-sm text-ink-950">{fmt(lineTotal)}</span>
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
              <div className="p-4 rounded-2xl bg-ink-50 border border-ink-100 space-y-1.5 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>Gift Card Value</span>
                  <span>{fmt(faceTotal)}</span>
                </div>
                {savingsTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Instant Discount Savings</span>
                    <span>−{fmt(savingsTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base sm:text-lg font-extrabold text-ink-950 pt-2 border-t border-ink-200/70">
                  <span>Total to Pay</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Account Option (Before or After Payment) */}
              {!session?.user && (
                <div className="p-3.5 rounded-2xl bg-brand-50/80 border border-brand-100 text-center space-y-2">
                  <div className="text-xs font-bold text-brand-950 flex items-center justify-center gap-1.5">
                    <Icon name="lock" size={14} className="text-brand-700" />
                    Create Account Before or After Checkout
                  </div>
                  <p className="text-[11px] text-ink-600 leading-relaxed">
                    Sign in now, <strong>or</strong> pay with Credit/Debit Card or PayPal below and create your account with your same email right after payment.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openAuthModal("register")}
                      className="py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition"
                    >
                      Create Account First
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal("signin")}
                      className="py-2 px-3 rounded-xl border border-brand-300 hover:bg-white text-brand-900 font-bold text-xs transition bg-white/90"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Methods Section (Responsive for Mobile & Desktop) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ink-500">
                    Choose Payment Method
                  </span>
                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    className="text-xs font-extrabold text-brand-600 hover:underline"
                  >
                    Open Full-Screen Checkout &rarr;
                  </Link>
                </div>

                {/* 1. Direct Credit / Debit Card Guest Checkout Redirect (Best for Mobile Keyboards & Browsers) */}
                <button
                  type="button"
                  onClick={() => checkoutWithPayPalRedirect("GUEST_CHECKOUT")}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-ink-950 hover:bg-ink-800 text-white font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Icon name="wallet" size={18} className="text-amber-300" />
                  <span>
                    {loading ? "Opening Secure Card Form…" : `Pay with Debit or Credit Card · ${fmt(total)}`}
                  </span>
                </button>

                {/* 2. Direct PayPal Express Redirect Button */}
                <button
                  type="button"
                  onClick={() => checkoutWithPayPalRedirect("LOGIN")}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#FFC439] hover:bg-[#f2b829] text-[#003087] font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
                  </svg>
                  <span>
                    {loading ? "Processing PayPal Checkout…" : `Pay with PayPal · ${fmt(total)}`}
                  </span>
                </button>

                {/* 3. Interactive PayPal + Inline Debit/Credit Card Smart Buttons */}
                <div className="pt-1">
                  <div className="text-[11px] text-ink-400 text-center mb-2">
                    Or use inline checkout below (scroll down when entering card details):
                  </div>
                  <div
                    ref={paypalContainerRef}
                    className="w-full min-h-[110px] rounded-xl overflow-visible"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-ink-400">
                <Icon name="lock" size={13} />
                256-Bit Encrypted Checkout · Instant eGift Delivery
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
