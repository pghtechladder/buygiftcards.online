"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { Icon } from "@/components/Icon";
import { trackRetailEvent } from "@/lib/analytics";
import { getTurnstileToken } from "@/lib/turnstile-client";
import { safeRandomId } from "@/lib/device";
import { CountryCode, formatCurrency, getCurrencyCode, resolveCountryFromHostOrEnv } from "@/lib/country-config";

export type PaymentChoice = "paypal" | "card" | "googlepay" | "applepay" | "crypto";

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "BAAvF_aLV7jrJ7SZG0qB5WSUEoJH8GqF88uriChuLdsgV6-XWKmbVZnexjrv8-d7VM8K_QwTIqeQqo6ZOg";

interface PaymentMethodSelectorProps {
  compact?: boolean;
  onSuccessComplete?: () => void;
}

export function PaymentMethodSelector({
  compact = false,
  onSuccessComplete,
}: PaymentMethodSelectorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, total, clear } = useCart();

  const [country, setCountry] = useState<CountryCode>(() => resolveCountryFromHostOrEnv());
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCountry(resolveCountryFromHostOrEnv(window.location.host));
    }
  }, []);

  const currencyCode = getCurrencyCode(country);
  const fmt = (n: number) => formatCurrency(n, country);

  // Progressive disclosure state:
  // Initially show limited top options (PayPal + Debit/Credit Card) and a neat
  // "+ More Payment Options (Apple Pay · Google Pay · Crypto)" toggle button
  const [selectedMethod, setSelectedMethod] = useState<PaymentChoice>("paypal");
  const [showMoreMethods, setShowMoreMethods] = useState(false);
  const [showInlineCardForm, setShowInlineCardForm] = useState(false);

  // Crypto APM buyer fields per https://developer.paypal.com/platforms/checkout/apm/crypto/orders-api
  const defaultParts = (session?.user?.name || "").trim().split(/\s+/);
  const [cryptoFirstName, setCryptoFirstName] = useState(defaultParts[0] || "");
  const [cryptoLastName, setCryptoLastName] = useState(defaultParts.slice(1).join(" ") || "");
  const [cryptoEmail, setCryptoEmail] = useState(session?.user?.email || "");
  const [selectedCryptoAsset, setSelectedCryptoAsset] = useState<"PYUSD" | "BTC" | "ETH" | "SOL">("PYUSD");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const paypalSmartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (session?.user?.email && !cryptoEmail) {
      setCryptoEmail(session.user.email);
    }
    if (session?.user?.name && !cryptoFirstName) {
      const parts = session.user.name.trim().split(/\s+/);
      setCryptoFirstName(parts[0] || "");
      setCryptoLastName(parts.slice(1).join(" ") || "");
    }
  }, [session?.user, cryptoEmail, cryptoFirstName]);

  const idempotencyKey = useMemo(
    () => safeRandomId(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(items.map((i) => [i.key, i.qty])), selectedMethod]
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

  // Load PayPal JS SDK when inline smart buttons are requested
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
    )}&currency=${encodeURIComponent(currencyCode)}&intent=capture&components=buttons,funding-eligibility&enable-funding=card,venmo,paylater`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setSdkReady(false);
    document.body.appendChild(script);
  }, [items.length, currencyCode]);

  // Render inline PayPal / Card smart buttons only when expanded
  useEffect(() => {
    if (
      !showInlineCardForm ||
      !sdkReady ||
      !window.paypal?.Buttons ||
      !paypalSmartRef.current ||
      items.length === 0
    ) {
      return;
    }

    const container = paypalSmartRef.current;
    container.innerHTML = "";

    const fundingSource =
      selectedMethod === "card" && window.paypal.FUNDING?.CARD
        ? window.paypal.FUNDING.CARD
        : undefined;

    const buttons = window.paypal.Buttons({
      ...(fundingSource ? { fundingSource } : {}),
      style: {
        layout: "vertical",
        color: selectedMethod === "card" ? "black" : "gold",
        shape: "rect",
        label: selectedMethod === "card" ? "pay" : "paypal",
        height: 45,
      },
      createOrder: async () => {
        setError(null);
        trackRetailEvent("begin_checkout", {
          currency: currencyCode,
          value: total,
          payment_type: `inline_${selectedMethod}`,
          items: items.map((i) => ({
            item_id: i.brandSlug,
            item_name: i.brandName,
            price: i.amount,
            quantity: i.qty,
          })),
        });
        const turnstileToken = await getTurnstileToken("checkout");
        const res = await fetch("/api/checkout/paypal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(turnstileToken ? { "x-turnstile-token": turnstileToken } : {}),
          },
          body: JSON.stringify({
            action: "create",
            idempotencyKey,
            paymentMethod: selectedMethod,
            country,
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
              country,
            }),
          });
          const captured = await res.json();
          if (!res.ok || !captured.order) {
            throw new Error(captured.error || "Failed to capture payment");
          }
          trackRetailEvent("purchase", {
            transaction_id: captured.order.orderNumber,
            paypal_order_id: data.orderID,
            currency: currencyCode,
            value: total,
            items: items.map((i) => ({
              item_id: i.brandSlug,
              item_name: i.brandName,
              price: i.amount,
              quantity: i.qty,
            })),
          });
          clear();
          onSuccessComplete?.();
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
        console.error("[Inline Smart Buttons Error]", err);
        setError("Inline form encountered an issue. Please tap the primary checkout button above.");
        setLoading(false);
      },
    });

    buttons.render(container).catch((err) => {
      console.warn("[Smart button render error]", err);
    });
  }, [
    showInlineCardForm,
    sdkReady,
    selectedMethod,
    serializedItems,
    idempotencyKey,
    clear,
    onSuccessComplete,
    router,
    total,
    items,
  ]);

  const startPaymentAction = async (method: PaymentChoice) => {
    setError(null);

    if (method === "crypto") {
      if (!cryptoFirstName.trim() || !cryptoLastName.trim()) {
        setError("Please enter your first and last name for PayPal Crypto Checkout.");
        return;
      }
    }

    setLoading(true);
    const landingPage: "LOGIN" | "GUEST_CHECKOUT" | "NO_PREFERENCE" =
      method === "card" || method === "applepay" || method === "googlepay"
        ? "GUEST_CHECKOUT"
        : method === "paypal"
        ? "LOGIN"
        : "NO_PREFERENCE";

    trackRetailEvent("begin_checkout", {
      currency: currencyCode,
      value: total,
      payment_type: method,
      items: items.map((i) => ({
        item_id: i.brandSlug,
        item_name: i.brandName,
        price: i.amount,
        quantity: i.qty,
      })),
    });

    try {
      const turnstileToken = await getTurnstileToken("checkout");
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(turnstileToken ? { "x-turnstile-token": turnstileToken } : {}),
        },
        body: JSON.stringify({
          action: "create",
          idempotencyKey,
          landingPage,
          paymentMethod: method,
          country,
          payer: {
            givenName: cryptoFirstName.trim() || "Valued",
            surname: cryptoLastName.trim() || "Customer",
            email: cryptoEmail.trim() || undefined,
            countryCode: country === "UK" ? "GB" : country,
          },
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
          data.links.find(
            (l: { rel: string; href: string }) => l.rel === "payer-action" || l.rel === "approve"
          )?.href);

      if (!approveUrl) {
        throw new Error("Payment approval URL is missing from gateway response");
      }

      window.location.href = approveUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout error");
      setLoading(false);
    }
  };

  const selectMethod = (m: PaymentChoice) => {
    setSelectedMethod(m);
    setError(null);
    setShowInlineCardForm(false);
    if (m === "applepay" || m === "googlepay" || m === "crypto") {
      setShowMoreMethods(true);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
          <Icon name="shield" size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* INITIAL COMPACT VIEW: Primary 2 Payment Choices (PayPal + Debit/Credit Card) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-ink-500">
            Select Payment Method
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Instant Delivery
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Option 1: PayPal Express */}
          <button
            type="button"
            onClick={() => selectMethod("paypal")}
            className={`relative text-left p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${
              selectedMethod === "paypal"
                ? "border-[#0070ba] bg-[#0070ba]/[0.05] shadow-sm"
                : "border-ink-200/80 hover:border-ink-300 bg-white"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedMethod === "paypal"
                  ? "bg-[#FFC439] text-[#003087]"
                  : "bg-ink-100 text-ink-700"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-xs sm:text-sm text-ink-950 truncate flex items-center gap-1.5">
                <span>PayPal</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  LOW FEE
                </span>
              </div>
              <div className="text-[11px] text-ink-500 truncate">Balance · Venmo · 0% Fee</div>
            </div>
            {selectedMethod === "paypal" && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#0070ba] flex-shrink-0" />
            )}
          </button>

          {/* Option 2: Debit or Credit Card */}
          <button
            type="button"
            onClick={() => selectMethod("card")}
            className={`relative text-left p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${
              selectedMethod === "card"
                ? "border-ink-950 bg-ink-950/[0.04] shadow-sm"
                : "border-ink-200/80 hover:border-ink-300 bg-white"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedMethod === "card"
                  ? "bg-ink-950 text-amber-300"
                  : "bg-ink-100 text-ink-700"
              }`}
            >
              <Icon name="wallet" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-xs sm:text-sm text-ink-950 truncate">
                Debit / Credit
              </div>
              <div className="text-[11px] text-ink-500 truncate">Durbin Debit &amp; 3DS Safe</div>
            </div>
            {selectedMethod === "card" && (
              <span className="w-2.5 h-2.5 rounded-full bg-ink-950 flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Progressive Disclosure Toggle: Show More Payment Options */}
        {!showMoreMethods ? (
          <button
            type="button"
            onClick={() => setShowMoreMethods(true)}
            className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/40 text-xs font-bold text-ink-700 flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-ink-100 text-ink-800 text-[10px] font-extrabold">
                +3 MORE
              </span>
              <span>More Ways to Pay: Apple Pay, Google Pay &amp; Crypto</span>
            </span>
            <Icon name="chevronDown" size={15} className="text-ink-400" />
          </button>
        ) : (
          <div className="pt-1 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-ink-500">
                Digital Wallets &amp; Cryptocurrency
              </span>
              <button
                type="button"
                onClick={() => {
                  if (
                    selectedMethod === "applepay" ||
                    selectedMethod === "googlepay" ||
                    selectedMethod === "crypto"
                  ) {
                    setSelectedMethod("paypal");
                  }
                  setShowMoreMethods(false);
                }}
                className="text-[11px] font-semibold text-ink-400 hover:text-ink-700"
              >
                Hide extra options
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Option 3: Apple Pay */}
              <button
                type="button"
                onClick={() => selectMethod("applepay")}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center ${
                  selectedMethod === "applepay"
                    ? "border-black bg-black text-white shadow-sm"
                    : "border-ink-200/80 hover:border-ink-300 bg-white text-ink-950"
                }`}
              >
                <div className="flex items-center gap-1 font-extrabold text-xs sm:text-sm">
                  <svg width="14" height="16" viewBox="0 0 170 170" fill="currentColor" aria-hidden="true">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.13-1.9-14.34-6.08-3.69-3.03-7.61-7.83-11.77-14.4-5.03-7.86-9.16-16.92-12.41-27.18-3.25-10.26-4.88-20.16-4.88-29.7 0-10.97 2.74-20.22 8.22-27.75 5.48-7.53 12.58-11.41 21.3-11.63 4.69 0 9.89 1.45 15.6 4.36 5.7 2.91 9.39 4.42 11.07 4.53 1.23 0 5.31-1.79 12.24-5.37 6.93-3.58 12.8-5.14 17.61-4.7 13.08 1.01 22.92 6.15 29.52 15.43-11.74 7.15-17.5 17.16-17.28 30.02.22 10.06 4.02 18.39 11.4 24.99 5.14 4.58 11.18 7.38 18.11 8.39-1.45 4.47-3.08 8.71-4.89 12.7zM119.22 31.01c0 7.84-2.86 15.16-8.58 21.95-6.89 8.05-15.23 12.69-24.28 11.95-.12-.95-.18-1.97-.18-3.05 0-7.53 3.16-15.56 8.79-22.11 2.81-3.27 6.38-5.99 10.71-8.16 4.33-2.16 8.43-3.36 12.31-3.59.15 1.07.23 2.08.23 3.01z" />
                  </svg>
                  <span>Apple Pay</span>
                </div>
                <span
                  className={`text-[10px] ${
                    selectedMethod === "applepay" ? "text-white/80" : "text-ink-400"
                  }`}
                >
                  One-Tap
                </span>
              </button>

              {/* Option 4: Google Pay */}
              <button
                type="button"
                onClick={() => selectMethod("googlepay")}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center ${
                  selectedMethod === "googlepay"
                    ? "border-[#1a73e8] bg-[#1a73e8]/[0.06] text-ink-950 shadow-sm"
                    : "border-ink-200/80 hover:border-ink-300 bg-white text-ink-950"
                }`}
              >
                <div className="flex items-center gap-1 font-extrabold text-xs sm:text-sm">
                  <span className="inline-flex items-center font-black tracking-tight">
                    <span className="text-[#4285F4]">G</span>
                    <span className="text-ink-900 ml-0.5">Pay</span>
                  </span>
                </div>
                <span className="text-[10px] text-ink-400">Google Wallet</span>
              </button>

              {/* Option 5: Pay with Crypto (PayPal Orders V2 APM) */}
              <button
                type="button"
                onClick={() => selectMethod("crypto")}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center ${
                  selectedMethod === "crypto"
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm"
                    : "border-ink-200/80 hover:border-ink-300 bg-white text-ink-950"
                }`}
              >
                <div className="flex items-center gap-1 font-extrabold text-xs sm:text-sm">
                  <span className="text-amber-500 font-black">₿</span>
                  <span>Crypto</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 ml-1">
                    0% FEE
                  </span>
                </div>
                <span className="text-[10px] text-ink-400">PYUSD · BTC · ETH</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTEXTUAL ACTION PANEL BASED ON SELECTED PAYMENT METHOD */}
      <div className="rounded-2xl bg-ink-50/70 border border-ink-200/80 p-4 space-y-3.5">
        {selectedMethod === "paypal" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink-800">PayPal Express Checkout</span>
              <span className="text-ink-500">PayPal Balance, Bank, or Pay in 4</span>
            </div>
            <button
              type="button"
              onClick={() => startPaymentAction("paypal")}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#FFC439] hover:bg-[#f2b829] text-[#003087] font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
              </svg>
              <span>{loading ? "Connecting to PayPal…" : `Continue with PayPal · ${fmt(total)}`}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInlineCardForm((v) => !v)}
              className="w-full text-center text-[11px] font-bold text-ink-500 hover:text-ink-800 pt-0.5"
            >
              {showInlineCardForm
                ? "Hide inline PayPal / Venmo buttons ▲"
                : "Or open inline PayPal / Venmo buttons here ▼"}
            </button>
          </div>
        )}

        {selectedMethod === "card" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink-800">Debit or Credit Card</span>
              <span className="text-ink-500">Visa · Mastercard · Amex · Discover</span>
            </div>
            <button
              type="button"
              onClick={() => startPaymentAction("card")}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-ink-950 hover:bg-ink-800 text-white font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Icon name="wallet" size={18} className="text-amber-300" />
              <span>
                {loading ? "Opening Secure Card Form…" : `Pay with Card · ${fmt(total)}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowInlineCardForm((v) => !v)}
              className="w-full text-center text-[11px] font-bold text-brand-700 hover:text-brand-800 pt-0.5"
            >
              {showInlineCardForm
                ? "Hide inline card entry form ▲"
                : "Prefer typing your card details directly on this page? Tap here ▼"}
            </button>
          </div>
        )}

        {selectedMethod === "applepay" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink-800">Apple Pay Express</span>
              <span className="text-ink-500">Touch ID / Face ID &amp; Apple Wallet</span>
            </div>
            <button
              type="button"
              onClick={() => startPaymentAction("applepay")}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg width="16" height="18" viewBox="0 0 170 170" fill="currentColor" aria-hidden="true">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.13-1.9-14.34-6.08-3.69-3.03-7.61-7.83-11.77-14.4-5.03-7.86-9.16-16.92-12.41-27.18-3.25-10.26-4.88-20.16-4.88-29.7 0-10.97 2.74-20.22 8.22-27.75 5.48-7.53 12.58-11.41 21.3-11.63 4.69 0 9.89 1.45 15.6 4.36 5.7 2.91 9.39 4.42 11.07 4.53 1.23 0 5.31-1.79 12.24-5.37 6.93-3.58 12.8-5.14 17.61-4.7 13.08 1.01 22.92 6.15 29.52 15.43-11.74 7.15-17.5 17.16-17.28 30.02.22 10.06 4.02 18.39 11.4 24.99 5.14 4.58 11.18 7.38 18.11 8.39-1.45 4.47-3.08 8.71-4.89 12.7zM119.22 31.01c0 7.84-2.86 15.16-8.58 21.95-6.89 8.05-15.23 12.69-24.28 11.95-.12-.95-.18-1.97-.18-3.05 0-7.53 3.16-15.56 8.79-22.11 2.81-3.27 6.38-5.99 10.71-8.16 4.33-2.16 8.43-3.36 12.31-3.59.15 1.07.23 2.08.23 3.01z" />
              </svg>
              <span>{loading ? "Opening Apple Pay…" : `Pay with Apple Pay · ${fmt(total)}`}</span>
            </button>
          </div>
        )}

        {selectedMethod === "googlepay" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink-800">Google Pay Express</span>
              <span className="text-ink-500">Fast Mobile &amp; Chrome Wallet</span>
            </div>
            <button
              type="button"
              onClick={() => startPaymentAction("googlepay")}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-ink-50 text-ink-950 border-2 border-ink-900 font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="font-black text-base">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </span>
              <span>{loading ? "Opening Google Pay…" : `Pay · ${fmt(total)}`}</span>
            </button>
          </div>
        )}

        {selectedMethod === "crypto" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black">
                  ₿
                </span>
                Pay with Crypto (PayPal Orders V2 APM)
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                {currencyCode} Settlement
              </span>
            </div>

            {/* Supported Crypto Coins Pill Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: "PYUSD", label: "PYUSD", sub: "0% Fee" },
                  { id: "BTC", label: "Bitcoin", sub: "BTC" },
                  { id: "ETH", label: "Ethereum", sub: "ETH" },
                  { id: "SOL", label: "Solana", sub: "SOL" },
                ] as const
              ).map((coin) => (
                <button
                  key={coin.id}
                  type="button"
                  onClick={() => setSelectedCryptoAsset(coin.id)}
                  className={`py-1.5 px-2 rounded-xl border text-center transition ${
                    selectedCryptoAsset === coin.id
                      ? "border-indigo-600 bg-indigo-600 text-white font-extrabold"
                      : "border-ink-200 bg-white text-ink-800 hover:border-indigo-300 font-semibold"
                  }`}
                >
                  <div className="text-[11px] leading-tight">{coin.label}</div>
                  <div
                    className={`text-[9px] ${
                      selectedCryptoAsset === coin.id ? "text-indigo-100" : "text-ink-400"
                    }`}
                  >
                    {coin.sub}
                  </div>
                </button>
              ))}
            </div>

            {/* Payer Name & Email inputs required by PayPal Crypto Orders V2 API (`payment_source.crypto.name`) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={cryptoFirstName}
                  onChange={(e) => setCryptoFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-3 py-2 rounded-xl border border-ink-200 bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={cryptoLastName}
                  onChange={(e) => setCryptoLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 rounded-xl border border-ink-200 bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {!compact && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">
                  Delivery Email (for Gift Card Codes)
                </label>
                <input
                  type="email"
                  value={cryptoEmail}
                  onChange={(e) => setCryptoEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-ink-200 bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => startPaymentAction("crypto")}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>₿</span>
              <span>
                {loading
                  ? "Creating Crypto Order…"
                  : `Pay with ${selectedCryptoAsset} Crypto · ${fmt(total)}`}
              </span>
            </button>
          </div>
        )}

        {/* Optional Inline Smart Buttons Accordion (only shown when customer clicks to expand) */}
        {showInlineCardForm && (selectedMethod === "paypal" || selectedMethod === "card") && (
          <div className="pt-2 border-t border-ink-200/70 animate-fade-in">
            <div
              ref={paypalSmartRef}
              className="w-full min-h-[110px] rounded-xl overflow-visible"
            />
          </div>
        )}
      </div>
    </div>
  );
}

