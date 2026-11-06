import { BRANDS } from "@/lib/brands";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";

export function StructuredData() {
  const topBrands = BRANDS.slice(0, 20);

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": `${SITE_URL}/#organization`,
        name: "BuyGiftCards.online",
        alternateName: ["Buy Gift Cards Online", "buygiftcards.online"],
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo-full.png`,
          width: 512,
          height: 512,
        },
        image: `${SITE_URL}/logo-full.png`,
        description:
          "Buy gift cards online with instant email delivery. Shop 165+ digital eGift cards, prepaid Visa virtual cards, multi-brand choice cards, Amazon, Starbucks, gaming, dining, and retail gift cards with $0 purchase fees on brand cards.",
        priceRange: "$5 - $500",
        currenciesAccepted: "USD",
        paymentAccepted: "Credit Card, Debit Card, Visa, Mastercard, American Express, Discover, PayPal, Venmo",
        areaServed: {
          "@type": "Country",
          name: "United States",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "1840",
          bestRating: "5",
          worstRating: "1",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Digital Gift Cards & Prepaid eGift Catalog",
          itemListElement: topBrands.map((b, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            item: {
              "@type": "Product",
              name: `${b.name} Gift Card`,
              url: `${SITE_URL}/product/${b.slug}`,
              description: b.description,
              category: `${b.category} Gift Cards`,
              brand: {
                "@type": "Brand",
                name: b.name,
              },
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "USD",
                lowPrice: b.min.toFixed(2),
                highPrice: b.max.toFixed(2),
                offerCount: b.denominations.length,
                availability: "https://schema.org/InStock",
                url: `${SITE_URL}/product/${b.slug}`,
              },
            },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Buy Gift Cards Online — buygiftcards.online",
        description:
          "Buy digital gift cards and eGift cards online from 165+ popular brands with instant email delivery.",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/catalog?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Where can I buy gift cards online with instant email delivery?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "At buygiftcards.online, you can buy digital gift cards (eGift cards) from 165+ top brands including Visa, Amazon, Starbucks, DoorDash, Uber, Disney, Xbox, and our BuyGiftCards.online All-in-One Choice Card with instant email delivery and secure Credit/Debit Card or PayPal checkout.",
            },
          },
          {
            "@type": "Question",
            name: "Can I buy gift cards online with a credit card, debit card, or PayPal?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. buygiftcards.online accepts all major credit cards and debit cards (Visa, Mastercard, American Express, Discover) directly on desktop and mobile checkout, as well as PayPal, Venmo, and Pay Later.",
            },
          },
          {
            "@type": "Question",
            name: "How fast are digital gift cards delivered after purchase?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Digital eGift cards ordered on buygiftcards.online are generated immediately upon payment capture and delivered by email within minutes, complete with your claim code, PIN, and redemption instructions.",
            },
          },
          {
            "@type": "Question",
            name: "Are there any purchase fees when I buy gift cards on buygiftcards.online?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "There are $0 purchase fees on all retail, dining, gaming, and entertainment brand gift cards—plus many brands feature instant reseller discounts of up to 15% off face value.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
    />
  );
}
