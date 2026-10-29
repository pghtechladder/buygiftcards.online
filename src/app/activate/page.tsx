"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function ActivatePage() {
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [activated, setActivated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActivated(null);

    const digits = cardNumber.replace(/\s+/g, "");
    if (digits.length < 12) {
      setError("Please enter the 16-digit card number printed on your physical card.");
      return;
    }
    if (cvv.trim().length < 3) {
      setError("Please enter the 3-digit security code (CVV) or 4-digit PIN on the back of your card.");
      return;
    }

    setActivated(digits.slice(-4));
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="bg-white border border-ink-100 rounded-3xl p-8 sm:p-10 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Icon name="shield" size={26} className="text-brand-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Activate Your Card</h1>
          <p className="text-sm text-ink-600">
            Received a physical Visa®, Mastercard®, or retail gift card in the mail? Confirm receipt and activate your
            card for immediate use online or in stores.
          </p>
        </div>

        {activated ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto">
              <Icon name="checkCircle" size={24} />
            </div>
            <h2 className="text-lg font-extrabold text-green-900">Card Ending in •••• {activated} is Active!</h2>
            <p className="text-xs text-green-800 leading-relaxed">
              Your card is activated and ready to use wherever accepted. For PIN-based debit transactions at checkout,
              use the 4-digit PIN set on your card.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/balance"
                className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 transition"
              >
                Check Card Balance
              </Link>
              <button
                type="button"
                onClick={() => {
                  setActivated(null);
                  setCardNumber("");
                  setCvv("");
                }}
                className="px-5 py-2.5 rounded-xl bg-white border border-ink-200 text-ink-700 text-xs font-bold hover:bg-ink-50 transition"
              >
                Activate Another Card
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">16-Digit Card Number</label>
              <input
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4111 2222 3333 4444"
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 font-mono text-sm"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">CVV / Security Code</label>
                <input
                  required
                  maxLength={8}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="3-digit CVV or PIN"
                  className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Order # (optional)</label>
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="BGC-20261029-..."
                  className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Purchaser or Recipient Email</label>
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

            <button className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-extrabold hover:bg-brand-700 transition">
              Activate Card Now
            </button>

            <p className="text-xs text-ink-400 text-center pt-2">
              Note: Digital eGift cards and Giftbit claim links are already active upon delivery and do not require
              manual activation.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

