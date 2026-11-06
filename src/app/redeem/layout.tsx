import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redeem Your Gift Card Online — Swap & Split Balance Across 165+ Brands",
  description:
    "Redeem your BuyGiftCards.online Choice Card, One4all Multi-Brand, or Holiday Favorites gift card online. Enter your 16-digit card number and PIN to swap or split your balance across Amazon, Visa, Starbucks, Target, and 165+ top brands.",
  keywords: [
    "redeem gift card online",
    "redeem multi-brand gift card",
    "one4all gift card redeem",
    "swap gift card balance",
    "buygiftcards.online redeem",
  ],
  alternates: { canonical: "/redeem" },
};

export default function RedeemLayout({ children }: { children: React.ReactNode }) {
  return children;
}

