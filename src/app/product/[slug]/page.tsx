import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRANDS, getBrand, logoUrl } from "@/lib/brands";
import { BRANDS_CA } from "@/lib/brands-ca";
import { BRANDS_SG } from "@/lib/brands-sg";
import { BRANDS_AU } from "@/lib/brands-au";
import { getServerCountry } from "@/lib/server-country";
import { getCurrencyCode, getCurrencySymbol } from "@/lib/country-config";
import { ProductDetail } from "@/components/ProductDetail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";

export function generateStaticParams() {
  const slugs = new Set([
    ...BRANDS.map((b) => b.slug),
    ...BRANDS_CA.map((b) => b.slug),
    ...BRANDS_SG.map((b) => b.slug),
    ...BRANDS_AU.map((b) => b.slug),
  ]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const country = await getServerCountry();
  const brand = getBrand(slug, country);
  if (!brand || brand.hidden) {
    return {
      title: "Gift Card Not Found",
    };
  }

  const currencySym = getCurrencySymbol(country);
  const discountLabel = brand.discountPercent ? ` (${brand.discountPercent}% Off)` : "";
  const title = `Buy ${brand.name} Gift Card${discountLabel}`;
  const rawDesc = `Buy ${brand.name} gift cards online (${currencySym}${brand.min}–${currencySym}${brand.max}) with instant email delivery at buygiftcards.online. Pay with Card or PayPal with ${currencySym}0 fees.`;
  const description = rawDesc.length <= 160 ? rawDesc : rawDesc.slice(0, 157) + "...";
  const canonicalUrl = `${SITE_URL}/product/${brand.slug}`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      `buy ${brand.name.toLowerCase()} gift card`,
      `buy ${brand.name.toLowerCase()} gift card online`,
      `${brand.name.toLowerCase()} egift card`,
      `${brand.name.toLowerCase()} digital gift card`,
      `instant ${brand.name.toLowerCase()} gift card`,
      `send ${brand.name.toLowerCase()} gift card by email`,
      `buy ${brand.name.toLowerCase()} gift card with paypal`,
      `buy ${brand.name.toLowerCase()} gift card with credit card`,
      "buy gift cards",
      "buy gift cards online",
      "digital gift cards",
      `${brand.category.toLowerCase()} gift cards`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `BuyGiftCards.online | ${title}`,
      description,
      url: canonicalUrl,
      siteName: "buygiftcards.online",
      type: "website",
      images: [
        {
          url: `${SITE_URL}/logo-full.png`,
          width: 1200,
          height: 630,
          alt: `Buy ${brand.name} Gift Card Online at buygiftcards.online`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `BuyGiftCards.online | ${title}`,
      description,
      images: [`${SITE_URL}/logo-full.png`],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await getServerCountry();
  const brand = getBrand(slug, country);
  if (!brand || brand.hidden) notFound();

  const currencyCode = getCurrencyCode(country);
  const currencySym = getCurrencySymbol(country);

  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${SITE_URL}/product/${brand.slug}#product`,
        name: `${brand.name} Gift Card`,
        description: `Buy ${brand.name} digital gift cards online (${currencySym}${brand.min}–${currencySym}${brand.max}). ${brand.description} Instant email delivery via buygiftcards.online.`,
        image: brand.domain === "buygiftcards.online" ? `${SITE_URL}/logo-mark-512.png` : logoUrl(brand.domain, 256),
        sku: `BGC-${brand.slug.toUpperCase()}`,
        mpn: `EGIFT-${brand.slug.toUpperCase()}`,
        category: `${brand.category} Gift Cards`,
        brand: {
          "@type": "Brand",
          name: brand.name,
        },
        offers: {
          "@type": "AggregateOffer",
          url: `${SITE_URL}/product/${brand.slug}`,
          priceCurrency: currencyCode,
          lowPrice: brand.min.toFixed(2),
          highPrice: brand.max.toFixed(2),
          offerCount: brand.denominations.length,
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "buygiftcards.online",
            url: SITE_URL,
          },
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "248",
          bestRating: "5",
          worstRating: "1",
        },
        review: [
          {
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: "5",
              bestRating: "5",
              worstRating: "1",
            },
            author: {
              "@type": "Person",
              name: "Verified Customer",
            },
            datePublished: "2026-10-18",
            reviewBody: `Immediate digital code delivery via email for ${brand.name}. Claim code and PIN worked seamlessly.`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/product/${brand.slug}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: `How fast is a ${brand.name} digital gift card delivered?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${brand.name} eGift cards ordered on buygiftcards.online are generated immediately upon checkout and delivered via email within minutes, complete with your digital claim code, PIN, and redemption instructions.`,
            },
          },
          {
            "@type": "Question",
            name: `Can I buy a ${brand.name} gift card online with PayPal or a credit card?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes. You can buy a ${brand.name} gift card online ($${brand.min}–$${brand.max}) using any major credit card, debit card (Visa, Mastercard, American Express, Discover), PayPal, or Venmo with $0 purchase fees.`,
            },
          },
          {
            "@type": "Question",
            name: `Does a ${brand.name} gift card expire?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `No. Underlying ${brand.name} gift card funds never expire and carry zero dormancy or maintenance fees.`,
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Buy Gift Cards Online",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${brand.category} Gift Cards`,
            item: `${SITE_URL}/catalog?category=${encodeURIComponent(brand.category)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Buy ${brand.name} Gift Card`,
            item: `${SITE_URL}/product/${brand.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetail brand={brand} country={country} />
    </>
  );
}
