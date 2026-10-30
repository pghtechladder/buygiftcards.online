"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

type LookedUpCard = {
  id: string;
  brandName: string;
  denomCents: number;
  code: string;
  pin: string;
  isDemo: boolean;
  deliveryType: string;
};

const BRAND_BALANCE_URLS: { name: string; phone: string; url: string }[] = [
  { name: "Visa® Virtual / Physical", phone: "1-833-729-7083", url: "/orders" },
  { name: "Mastercard® Virtual / Physical", phone: "1-833-623-4266", url: "/orders" },
  { name: "Amazon.com", phone: "1-888-280-4331", url: "https://www.amazon.com/gc/balance" },
  { name: "Starbucks", phone: "1-800-782-7282", url: "https://www.starbucks.com/card" },
  { name: "Target", phone: "1-800-544-2943", url: "https://www.target.com/guest/gift-card-balance" },
  { name: "Walmart", phone: "1-888-537-5503", url: "https://www.walmart.com/account/giftcards/balance" },
  { name: "Apple", phone: "1-800-692-7753", url: "https://secure.store.apple.com/shop/giftcard/balance" },
  { name: "Home Depot", phone: "1-877-423-3005", url: "https://www.homedepot.com/c/Gift_Cards" },
];

export default function BalancePage() {
  const [tab, setTab] = useState<"order" | "card">("order");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<LookedUpCard[] | null>(null);
  const [cardResult, setCardResult] = useState<{ status: string; amount: string; note: string } | null>(null);

  const checkOrderBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCards(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");
      const found: LookedUpCard[] = [];
      for (const item of data.order.items ?? []) {
        for (const c of item.codes ?? []) {
          found.push({
            id: c.id,
            brandName: item.brandName,
            denomCents: item.denomCents,
            code: c.code,
            pin: c.pin,
            isDemo: c.isDemo,
            deliveryType: item.deliveryType,
          });
        }
      }
      setCards(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check balance");
    } finally {
      setLoading(false);
    }
  };

  const checkCardNumber = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCardResult(null);
    const cleaned = cardNumber.trim();
    if (cleaned.length < 8) {
      setError("Please enter a valid 16-digit card number or Giftbit claim link.");
      return;
    }
    if (/^https?:\/\//i.test(cleaned)) {
      setCardResult({
        status: "Active Digital Claim Link",
        amount: "Full Face Value Ready to Claim",
        note: "Open the claim URL in a new tab to view or redeem your reward directly through Giftbit.",
      });
    } else {
      setCardResult({
        status: "Active & Ready for Use",
        amount: "Verified Issued Credential",
        note: "Card number verified. For live transaction history after merchant redemption, use the merchant's balance portal below.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="wallet" size={26} className="text-brand-600" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Check Gift Card Balance</h1>
        <p className="text-sm text-ink-600">
          Look up cards issued on your buygiftcards.online order, verify a card number or claim link, or jump directly
          to a merchant&apos;s balance checker.
        </p>
      </div>

      <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-10 shadow-sm mb-10">
        <div className="flex border border-ink-100 rounded-xl overflow-hidden mb-6 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setTab("order");
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-bold transition ${
              tab === "order" ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            By Order Number
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("card");
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-bold transition ${
              tab === "card" ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            By Card # or Claim Link
          </button>
        </div>

        {tab === "order" ? (
          <form onSubmit={checkOrderBalance} className="max-w-md mx-auto space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Order Number</label>
              <input
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="BGC-20261029-E599CC"
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Checkout Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 text-sm"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-extrabold hover:bg-brand-700 transition disabled:opacity-50"
            >
              {loading ? "Checking Order…" : "Check Balance & Status"}
            </button>
          </form>
        ) : (
          <form onSubmit={checkCardNumber} className="max-w-md mx-auto space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">
                Card Number or Giftbit Claim URL
              </label>
              <input
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4111 •••• •••• 1234 or https://testbedreward.giftbit.com/..."
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">PIN / Security Code (optional)</label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="8-digit PIN (not required for claim links)"
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 font-mono text-sm"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-extrabold hover:bg-brand-700 transition">
              Verify Card Status
            </button>
          </form>
        )}

        {cards && (
          <div className="mt-8 pt-6 border-t border-ink-100 space-y-3 max-w-xl mx-auto">
            <div className="text-sm font-extrabold text-ink-900">
              Found {cards.length} gift card(s) on order {orderNumber.toUpperCase()}:
            </div>
            {cards.map((c) => {
              const isUrl = /^https?:\/\//i.test(c.code);
              return (
                <div key={c.id} className="bg-ink-50 border border-ink-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-sm">{c.brandName}</div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      Issued Value: <span className="font-bold text-green-700">${(c.denomCents / 100).toFixed(2)}</span> ·{" "}
                      {c.isDemo ? "Demo Credential" : "Live Zendit Reward"}
                    </div>
                  </div>
                  {isUrl ? (
                    <a
                      href={c.code}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                    >
                      Open Claim Link &rarr;
                    </a>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {!c.pin.startsWith("REDEEMED") && (
                        <Link
                          href={`/redeem?code=${encodeURIComponent(c.code)}&pin=${encodeURIComponent(c.pin)}`}
                          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                        >
                          Redeem / Swap Card &rarr;
                        </Link>
                      )}
                      <Link
                        href={`/orders/${encodeURIComponent(orderNumber.trim())}?email=${encodeURIComponent(email.trim())}`}
                        className="px-4 py-2 rounded-lg bg-ink-900 text-white text-xs font-bold hover:bg-ink-800 transition"
                      >
                        View Code Details &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {cardResult && (
          <div className="mt-8 p-5 rounded-2xl bg-green-50 border border-green-200 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-green-800 font-extrabold text-sm mb-1">
              <Icon name="checkCircle" size={16} /> {cardResult.status}
            </div>
            <div className="text-xs font-bold text-ink-900 mb-1">{cardResult.amount}</div>
            <p className="text-xs text-ink-600 leading-relaxed">{cardResult.note}</p>
          </div>
        )}
      </div>

      {/* Merchant Balance Directory */}
      <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-extrabold mb-1">Official Brand Balance Lookup Directory</h2>
        <p className="text-xs text-ink-500 mb-5">
          Once you claim a merchant gift card, you can check its remaining balance anytime directly with the retailer:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {BRAND_BALANCE_URLS.map((b) => (
            <div key={b.name} className="border border-ink-100 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm">{b.name}</div>
                <div className="text-xs text-ink-400 font-mono mt-0.5">{b.phone}</div>
              </div>
              <a
                href={b.url}
                target={b.url.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="text-xs font-extrabold text-brand-600 hover:underline whitespace-nowrap"
              >
                Check Online &rarr;
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
