import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Gift Card Balance Online — Verify Order & Merchant Card Funds",
  description:
    "Check your gift card balance online at buygiftcards.online. Verify remaining funds on your order, check a 16-digit card number or claim link, or access official balance portals for Visa, Mastercard, Amazon, Starbucks, Target, and Walmart.",
  keywords: [
    "check gift card balance online",
    "gift card balance lookup",
    "check visa gift card balance",
    "check mastercard gift card balance",
    "verify egift card status",
    "buygiftcards.online balance check",
  ],
  alternates: { canonical: "https://buygiftcards.online/balance" },
  openGraph: {
    title: "Check Gift Card Balance Online — BuyGiftCards.online",
    description:
      "Verify remaining funds on your buygiftcards.online order, check a 16-digit card number or claim link, or jump directly to official retailer balance portals.",
    url: "https://buygiftcards.online/balance",
    type: "website",
  },
};

export default function BalanceLayout({ children }: { children: React.ReactNode }) {
  const balanceSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://buygiftcards.online/balance#webpage",
        url: "https://buygiftcards.online/balance",
        name: "Check Gift Card Balance Online — Verify Order & Merchant Card Funds",
        description:
          "Check your gift card balance online at buygiftcards.online or connect to official balance checkers for Visa, Mastercard, Amazon, Starbucks, Target, Walmart, Apple, and Home Depot.",
        isPartOf: { "@id": "https://buygiftcards.online/#website" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Buy Gift Cards Online", item: "https://buygiftcards.online" },
          { "@type": "ListItem", position: 2, name: "Check Gift Card Balance", item: "https://buygiftcards.online/balance" },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://buygiftcards.online/balance#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do I check my gift card balance online?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "At buygiftcards.online/balance, you can check your gift card status by entering your Order Number and checkout email, verifying your 16-digit card number or digital claim link, or using our official retailer balance lookup directory for Visa, Mastercard, Amazon, Starbucks, Target, Walmart, Apple, and Home Depot.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(balanceSchema) }}
      />
      {children}
    </>
  );
}

