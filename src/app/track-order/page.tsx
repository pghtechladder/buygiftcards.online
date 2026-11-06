import type { Metadata } from "next";
import OrdersLookupPage from "../orders/page";

export const metadata: Metadata = {
  title: "Track Your Gift Card Order — Instant eGift Claim Link & Code Lookup",
  description:
    "Look up your buygiftcards.online order status, retrieve your instant digital gift card claim links and PIN codes, or check physical card delivery.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return <OrdersLookupPage />;
}
