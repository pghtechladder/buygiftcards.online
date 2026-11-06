import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redeem Gift Card Online — Swap 165+ Brands",
  description:
    "Redeem your BuyGiftCards.online Choice Card or One4all gift card online. Enter your 16-digit card number and PIN to swap or split across 165+ top brands.",
  keywords: [
    "redeem gift card online",
    "redeem multi-brand gift card",
    "one4all gift card redeem",
    "swap gift card balance",
    "buygiftcards.online redeem",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/redeem" },
  openGraph: {
    title: "BuyGiftCards.online | Redeem Gift Card Online — Swap 165+ Brands",
    description:
      "Redeem your BuyGiftCards.online Choice Card or One4all gift card online. Enter your 16-digit card number and PIN to swap or split across 165+ top brands.",
    url: "https://buygiftcards.online/redeem",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
  },
};

export default function RedeemLayout({ children }: { children: React.ReactNode }) {
  return children;
}

