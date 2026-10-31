"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./Icon";

const fmt = (n: number) => `$${n.toFixed(2)}`;

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "BAAvgWHBMWqWeegN_69dmvEE4L1rO4bxEjWv-51rbfcPdEwdz9J9CxZmYrqIl5L7jZhkSK9LQLhAzTPrYc";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, unknown>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: unknown) => void;
      }) => {
        render: (el: HTMLElement) => Promise<void>;
      };
    };
  }
}

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, setOpen, updateQty, remove, total, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Load PayPal JS SDK when CartDrawer opens
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

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
    )}&currency=USD&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => {
      // PayPal redirect button below still works even if SDK script is blocked
      setSdkReady(false);
    };
    document.body.appendChild(script);
  }, [isOpen, items.length]);

  // Render PayPal Smart Buttons whenever SDK is ready & cart items change
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
        height: 45,
      },
      createOrder: async () => {
        setError(null);
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
          clear();
          setOpen(false);
          setLoading(false);
          router.push(
            `/orders/${encodeURIComponent(captured.order.orderNumber)}?email=${encodeURIComponent(
              captured.order.customerEmail
            )}`
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : "Payment capture failed");
          setLoading(false);
        }
      },
      onError: (err) => {
        console.error("[PayPal Buttons error]", err);
      },
    });

    buttons.render(container).catch(() => {});
  }, [isOpen, sdkReady, serializedItems, idempotencyKey, clear, setOpen, router, items.length]);

  if (!isOpen) return null;

  const checkoutWithPayPalRedirect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          idempotencyKey,
          items: serializedItems,
        }),
      });
      const raw = await res.text();
      let data: { url?: string; paypalOrderId?: string; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`PayPal checkout failed (status ${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || "PayPal checkout failed");
      if (!data.url) throw new Error("PayPal approval URL missing");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500]">
      <div onClick={() => setOpen(false)} className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[440px] bg-white shadow-2xl flex flex-col animate-slide-in">
        <div className="px-7 py-5 border-b border-ink-100 flex justify-between items-center">
          <h3 className="text-xl font-extrabold">Your Cart ({items.reduce((s, i) => s + i.qty, 0)})</h3>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="text-ink-400 hover:text-ink-900 transition">
            <Icon name="x" size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-7 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-ink-400">
              <Icon name="cart" size={44} className="mx-auto mb-4 text-ink-200" strokeWidth={1.5} />
              <div className="font-medium">Your cart is empty</div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.key} className="flex gap-4 py-4 border-b border-ink-50 items-center">
                {item.customPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.customPhotoUrl} alt="" className="w-12 h-12 rounded-[10px] object-cover flex-shrink-0" />
                ) : (
                  <BrandLogo domain={item.domain} name={item.brandName} size={48} radius={10} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{item.brandName}</div>
                  <div className="text-xs text-ink-400">
                    {fmt(item.amount)} · {item.deliveryType === "egift" ? "eGift" : "Physical"}
                    {item.customPhotoUrl && " · Custom photo"}
                  </div>
                  {item.recipientEmail && (
                    <div className="text-[11px] text-brand-700 font-medium truncate mt-0.5">
                      To: {item.recipientName ? `${item.recipientName} (${item.recipientEmail})` : item.recipientEmail}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex border border-ink-100 rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.key, item.qty - 1)} className="w-7 h-7 bg-ink-50">−</button>
                    <span className="w-7 flex items-center justify-center text-xs font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.key, item.qty + 1)} className="w-7 h-7 bg-ink-50">+</button>
                  </div>
                  <div className="font-extrabold text-sm w-14 text-right">{fmt(item.amount * item.qty)}</div>
                  <button onClick={() => remove(item.key)} aria-label={`Remove ${item.brandName}`} className="text-ink-400 hover:text-red-500 transition">
                    <Icon name="x" size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-7 py-6 border-t border-ink-100 bg-ink-50 space-y-3">
            <div className="flex justify-between text-lg font-extrabold">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Primary Direct PayPal Checkout Button */}
            <button
              onClick={checkoutWithPayPalRedirect}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-[#FFC439] hover:bg-[#f2b829] text-[#003087] font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
              </svg>
              <span>
                {loading ? "Processing PayPal Checkout…" : `Pay with PayPal · ${fmt(total)}`}
              </span>
            </button>

            {/* Interactive PayPal Smart Buttons (PayPal + Venmo / Pay Later / Debit & Credit Card) */}
            <div ref={paypalContainerRef} className="min-h-[45px]" />

            <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-ink-400">
              <Icon name="lock" size={13} />
              Secure PayPal Checkout · Instant eGift Delivery
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
