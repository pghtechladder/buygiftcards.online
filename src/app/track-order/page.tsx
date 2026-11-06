import type { Metadata } from "next";
import OrdersLookupPage from "../orders/page";

export const metadata: Metadata = {
  title: "Track Gift Card Order & Lookup eGift Claim Links",
  description:
    "Look up your buygiftcards.online order status, retrieve your instant digital gift card claim links and PIN codes, or check physical card delivery.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/track-order" },
  openGraph: {
    title: "BuyGiftCards.online | Track Gift Card Order & Lookup Claim Links",
    description:
      "Look up your buygiftcards.online order status, retrieve your instant digital gift card claim links and PIN codes, or check physical card delivery.",
    url: "https://buygiftcards.online/track-order",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
  },
};

export default function TrackOrderPage() {
  return <OrdersLookupPage />;
}
