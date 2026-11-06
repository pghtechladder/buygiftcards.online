"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Icon } from "./Icon";
import { trackRetailEvent } from "@/lib/analytics";

export function CheckoutSuccess() {
  const router = useRouter();
  const params = useSearchParams();
  const { clear } = useCart();
  const paypalToken = params.get("token");
  const sessionId = params.get("session_id") || (paypalToken ? `paypal_${paypalToken}` : null);
  const [status, setStatus] = useState<"loading" | "pending" | "ready" | "error">("loading");
  const [order, setOrder] = useState<{ orderNumber: string; customerEmail: string } | null>(null);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let attempts = 0;
    const poll = async () => {
      attempts++;
      const res = await fetch(`/api/checkout/session?session_id=${sessionId}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
        setStatus("ready");
        trackRetailEvent("purchase", {
          transaction_id: data.order.orderNumber,
          currency: "USD",
        });
        router.replace(
          `/orders/${data.order.orderNumber}?email=${encodeURIComponent(data.order.customerEmail)}`
        );
      } else if (attempts < 10) {
        setTimeout(poll, 1500);
      } else {
        setStatus("pending");
      }
    };
    poll();
  }, [sessionId, router]);

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <Icon name="loader" size={28} className="animate-spin text-brand-500" />
          Confirming your payment…
        </div>
      )}
      {status === "error" && <div className="text-red-600">Missing checkout session.</div>}
      {status === "pending" && (
        <div>
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
            <Icon name="mail" size={28} className="text-brand-600" />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Payment received</h1>
          <p className="text-ink-600">We're finishing up your order — check your email in a moment, or look it up from Track Order shortly.</p>
        </div>
      )}
      {status === "ready" && order && (
        <div>
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
            <Icon name="checkCircle" size={30} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Order confirmed</h1>
          <p className="text-ink-600 mb-6">A confirmation with your codes was sent to {order.customerEmail}.</p>
          <Link
            href={`/orders/${order.orderNumber}?email=${encodeURIComponent(order.customerEmail)}`}
            className="inline-block px-8 py-3.5 rounded-full bg-brand-600 text-white font-bold hover:bg-brand-700 transition"
          >
            View Order {order.orderNumber}
          </Link>
        </div>
      )}
    </div>
  );
}
