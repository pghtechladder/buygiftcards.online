import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group Gift Cards Online — Pool Money for eGifts",
  description:
    "Start an online group gift card for coworkers, teachers, weddings, or birthdays. Pool contributions into a single digital eGift card at buygiftcards.online.",
  keywords: [
    "group gift cards online",
    "pool money for gift card",
    "office group gift card",
    "teacher group gift card",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/group-gifts" },
  openGraph: {
    title: "BuyGiftCards.online | Group Gift Cards Online",
    description:
      "Start an online group gift card for coworkers, teachers, weddings, or birthdays. Pool contributions into a single digital eGift card at buygiftcards.online.",
    url: "https://buygiftcards.online/group-gifts",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
  },
};

export default function GroupGiftsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

