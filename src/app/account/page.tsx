"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-brand-50 text-brand-700",
  FULFILLED: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-ink-100 text-ink-600",
};

type AccountOrder = {
  orderNumber: string;
  customerEmail: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { brandName: string; denomCents: number; quantity: number }[];
};

export default function AccountPage() {
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/orders");
        if (res.status === 401) {
          setSignedIn(false);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Something went wrong");
          setLoading(false);
          return;
        }
        setOrders(data.orders);
      } catch {
        setError("Something went wrong");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center text-sm text-ink-400">Loading your account…</div>
    );
  }

  if (!signedIn) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white border border-ink-100 rounded-3xl p-10 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Icon name="lock" size={26} className="text-brand-600" />
          </div>
          <h1 className="text-2xl font-extrabold mb-1.5">My Account</h1>
          <p className="text-sm text-ink-500">Sign in to view your order history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-extrabold mb-1">My Orders</h1>
      <p className="text-sm text-ink-500 mb-6">Every order placed while signed in to your account.</p>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {orders && orders.length === 0 && (
        <div className="bg-white border border-ink-100 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center mx-auto mb-4">
            <Icon name="inbox" size={26} className="text-ink-400" />
          </div>
          <p className="text-sm text-ink-500">No orders yet on this account.</p>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemSummary = order.items.map((i) => `${i.brandName} × ${i.quantity}`).join(", ");
            return (
              <Link
                key={order.orderNumber}
                href={`/orders/${encodeURIComponent(order.orderNumber)}?email=${encodeURIComponent(order.customerEmail)}`}
                className="block bg-white border border-ink-100 rounded-2xl p-6 hover:border-brand-200 transition"
              >
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="font-extrabold font-mono text-sm truncate">{order.orderNumber}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[order.status] || "bg-ink-100 text-ink-600"}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-ink-600 truncate mb-2">{itemSummary}</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-ink-900">{fmt(order.totalCents)}</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
                    View order <Icon name="chevronRight" size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
