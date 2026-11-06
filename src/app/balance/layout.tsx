import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Gift Card Balance & Verify Order Funds",
  description:
    "Check your gift card balance online at buygiftcards.online. Verify remaining funds on your order or access official balance portals for Visa, Amazon & more.",
  keywords: [
    "check gift card balance online",
    "gift card balance lookup",
    "check visa gift card balance",
    "check mastercard gift card balance",
    "verify egift card status",
    "buygiftcards.online balance check",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://buygiftcards.online/balance" },
  openGraph: {
    title: "BuyGiftCards.online | Check Gift Card Balance Online",
    description:
      "Check your gift card balance online at buygiftcards.online. Verify remaining funds on your order or access official balance portals for Visa, Amazon & more.",
    url: "https://buygiftcards.online/balance",
    type: "website",
    images: ["https://buygiftcards.online/logo-full.png"],
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

