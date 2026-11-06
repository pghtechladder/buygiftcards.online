import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group Gift Cards Online — Pool Contributions for One Big eGift Card",
  description:
    "Start an online group gift card for coworkers, bosses, teachers, weddings, or birthdays. Pool contributions and greeting card messages from everyone into a single high-value digital eGift card at buygiftcards.online.",
  keywords: [
    "group gift cards online",
    "pool money for gift card",
    "office group gift card",
    "teacher group gift card",
  ],
  alternates: { canonical: "/group-gifts" },
};

export default function GroupGiftsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

