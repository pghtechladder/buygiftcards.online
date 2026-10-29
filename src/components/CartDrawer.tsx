"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./Icon";

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQty, remove, total } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable per-cart idempotency key: stays the same across retries of the
  // same cart (so a retry after a network hiccup can't double-charge), but
  // changes as soon as the cart contents actually change.
  const idempotencyKey = useMemo(
    () => crypto.randomUUID(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(items.map((i) => [i.key, i.qty]))]
  );

  if (!isOpen) return null;

  const checkout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          items: items.map((i) => ({
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
        }),
      });
      const raw = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`Checkout failed (unexpected response, status ${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (!data.url) throw new Error("Checkout session missing redirect URL");
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
          <div className="px-7 py-6 border-t border-ink-100 bg-ink-50">
            <div className="flex justify-between text-lg font-extrabold mb-4">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <button
              onClick={checkout}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-brand-600 text-white font-extrabold disabled:opacity-50"
            >
              {loading ? "Redirecting to Stripe…" : `Checkout · ${fmt(total)}`}
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-ink-400">
              <Icon name="lock" size={13} />
              Secure Stripe checkout
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
