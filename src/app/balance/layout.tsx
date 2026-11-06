import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Gift Card Balance Online — Verify Order & Merchant Card Funds",
  description:
    "Check your gift card balance online at buygiftcards.online. Verify remaining funds on your order, check a 16-digit card number or claim link, or access official balance portals for Visa, Mastercard, Amazon, Starbucks, Target, and Walmart.",
  keywords: [
    "check gift card balance online",
    "gift card balance lookup",
    "check visa gift card balance",
    "verify egift card status",
  ],
  alternates: { canonical: "/balance" },
};

export default function BalanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}

