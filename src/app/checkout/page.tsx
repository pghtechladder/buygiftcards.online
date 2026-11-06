"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { getBrand, chargeAmountCents } from "@/lib/brands";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";
import { trackRetailEvent } from "@/lib/analytics";
import { parseDeviceFromUserAgent, DeviceInfo, safeRandomId } from "@/lib/device";

const fmt = (n: number) => `$${n.toFixed(2)}`;

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "BAAvF_aLV7jrJ7SZG0qB5WSUEoJH8GqF88uriChuLdsgV6-XWKmbVZnexjrv8-d7VM8K_QwTIqeQqo6ZOg";

export default function DedicatedCheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { open: openAuthModal } = useAuthModal();
  const { items, updateQty, remove, total, faceTotal, savingsTotal, clear } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      const info = parseDeviceFromUserAgent(navigator.userAgent);
      setDevice(info);
      setIsMobileView(info.isMobile || window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const idempotencyKey = useMemo(
    () => safeRandomId(),
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
    if (items.length === 0) return;

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
    script.onerror = () => setSdkReady(false);
    document.body.appendChild(script);
  }, [items.length]);

  useEffect(() => {
    if (!sdkReady || !window.paypal?.Buttons || !paypalButtonsRef.current || items.length === 0) {
      return;
    }

    const container = paypalButtonsRef.current;
    container.innerHTML = "";

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "paypal",
        height: isMobileView ? 48 : 46,
      },
      createOrder: async () => {
        setError(null);
        trackRetailEvent("begin_checkout", {
          currency: "USD",
          value: total,
          payment_type: "checkout_page_smart_buttons",
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
          throw new Error(data.error || "Failed to initialize order");
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
            throw new Error(captured.error || "Failed to capture payment");
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
        console.error("[Checkout Page PayPal Error]", err);
        setError("Checkout encountered an error. Please use the Debit/Credit Card or PayPal redirect button above.");
        setLoading(false);
      },
    });

    buttons.render(container).catch((err) => {
      console.warn("[Checkout Page render error]", err);
    });
  }, [sdkReady, serializedItems, idempotencyKey, clear, router, total, items, isMobileView]);

  const startRedirectCheckout = async (landingPage: "LOGIN" | "GUEST_CHECKOUT") => {
    setLoading(true);
    setError(null);
    trackRetailEvent("begin_checkout", {
      currency: "USD",
      value: total,
      payment_type: landingPage === "GUEST_CHECKOUT" ? "card_redirect" : "paypal_redirect",
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
        throw new Error(data.error || "Failed to initialize checkout");
      }
      const approveUrl =
        data.approveUrl ||
        data.url ||
        (data.links &&
          data.links.find((l: { rel: string; href: string }) => l.rel === "payer-action" || l.rel === "approve")?.href);

      if (!approveUrl) {
        throw new Error("Approval redirect link is missing");
      }
      window.location.href = approveUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout error");
      setLoading(false);
    }
  };

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28">
      {/* Device-Aware Checkout Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-2">
            <Icon name="lock" size={12} />
            {isMobileView
              ? `Mobile Checkout${device?.os && device.os !== "other" ? ` · ${device.os.toUpperCase()}` : ""}${device?.browser && device.browser !== "other" ? ` (${device.browser})` : ""}`
              : "Secure Desktop Checkout"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-950">
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

      {/* Responsive Layout: Stacked on Mobile for full-width Credit Card entry, 12-Col Split on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Order Summary Column (Left on Desktop, Top Compact Card on Mobile) */}
        <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
          <div className="bg-white border border-ink-100 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3.5 mb-4">
              <h2 className="text-base sm:text-lg font-extrabold text-ink-950">
                Order Summary ({items.reduce((s, i) => s + i.qty, 0)})
              </h2>
              <span className="text-sm font-extrabold text-brand-700">{fmt(total)}</span>
            </div>

            <div className="divide-y divide-ink-100 space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {items.map((item) => {
                const brand = getBrand(item.brandSlug);
                const chargePerCard = brand ? chargeAmountCents(brand, item.amount) / 100 : item.amount;
                const hasDiscount = chargePerCard < item.amount;
                const lineTotal = chargePerCard * item.qty;

                return (
                  <div key={item.key} className="pt-3 first:pt-0 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <BrandLogo domain={item.domain} name={item.brandName} size={42} radius={10} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-ink-950 truncate">{item.brandName}</span>
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
                        <span className="font-extrabold text-sm text-ink-950">{fmt(lineTotal)}</span>
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

            <div className="mt-4 pt-4 border-t border-ink-100 space-y-1.5 text-sm">
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

        {/* Payment & Credit Card Entry Column (Full-Width on Mobile so Keyboard & Inputs Never Clip) */}
        <div className="lg:col-span-7 order-2 lg:order-1 space-y-5">
          {/* Step 1: Account Option */}
          {!session?.user ? (
            <div className="bg-white border border-ink-100 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <Icon name="lock" size={18} />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-extrabold text-ink-950">
                    1. Account Setup (Before or After Payment)
                  </h2>
                  <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">
                    You can create an account or sign in right now, <strong>or</strong> complete your Credit Card / PayPal payment below and create your account with your same checkout email immediately after payment.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <button
                      type="button"
                      onClick={() => openAuthModal("register")}
                      className="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition"
                    >
                      Create Account First
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal("signin")}
                      className="py-2.5 px-3 rounded-xl border border-ink-200 hover:bg-ink-50 text-ink-800 font-bold text-xs transition"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-emerald-950">
                <Icon name="checkCircle" size={16} className="text-emerald-600 flex-shrink-0" />
                <span>
                  Signed in as <strong>{session.user.email}</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">Verified</span>
            </div>
          )}

          {/* Step 2: Credit/Debit Card & PayPal Payment Box */}
          <div className="bg-white border border-ink-100 rounded-3xl p-5 sm:p-8 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-ink-950">
                2. Enter Credit / Debit Card or Pay with PayPal
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                {isMobileView
                  ? "Optimized for mobile browsers — tap Debit/Credit Card below to enter your card details on a full-screen mobile form or inline."
                  : "Pay securely using any major Debit or Credit Card (Visa, Mastercard, Amex, Discover) or your PayPal account."}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Direct Full-Screen Mobile-Friendly Credit/Debit Card & PayPal Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => startRedirectCheckout("GUEST_CHECKOUT")}
                disabled={loading}
                className="w-full py-4 px-4 rounded-2xl bg-ink-950 hover:bg-ink-800 text-white font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Icon name="wallet" size={18} className="text-amber-300" />
                <span>
                  {loading ? "Opening Card Checkout…" : `Debit / Credit Card · ${fmt(total)}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => startRedirectCheckout("LOGIN")}
                disabled={loading}
                className="w-full py-4 px-4 rounded-2xl bg-[#FFC439] hover:bg-[#f2b829] text-[#003087] font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
                </svg>
                <span>
                  {loading ? "Opening PayPal…" : `PayPal Express · ${fmt(total)}`}
                </span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-ink-100" />
              <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Or Enter Card / Pay Inline Below
              </span>
              <div className="flex-grow border-t border-ink-100" />
            </div>

            {/* Inline PayPal + Debit/Credit Card Accordion Container (Full Unclipped Height) */}
            <div className="w-full rounded-2xl bg-ink-50/50 border border-ink-100 p-3 sm:p-5">
              <div
                ref={paypalButtonsRef}
                className="w-full min-h-[150px] overflow-visible"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-ink-400">
              <span className="flex items-center gap-1.5">
                <Icon name="lock" size={13} className="text-brand-600" />
                256-Bit SSL Encryption
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Icon name="zap" size={13} className="text-brand-600" />
                Instant Digital Delivery
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Icon name="shield" size={13} className="text-brand-600" />
                100% Purchase Protection
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
