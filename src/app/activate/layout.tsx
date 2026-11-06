import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activate Physical Visa, Mastercard & Gift Cards",
  description:
    "Activate your newly arrived physical Visa, Mastercard, or retail gift card online at buygiftcards.online for immediate use in stores and online.",
  keywords: [
    "activate gift card online",
    "activate physical visa gift card",
    "confirm gift card receipt",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/activate" },
  openGraph: {
    title: "BuyGiftCards.online | Activate Physical Visa & Gift Cards",
    description:
      "Activate your newly arrived physical Visa, Mastercard, or retail gift card online at buygiftcards.online for immediate use in stores and online.",
    url: "https://buygiftcards.online/activate",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
  },
};

export default function ActivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}

