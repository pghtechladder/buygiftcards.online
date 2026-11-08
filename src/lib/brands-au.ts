import type { Brand } from "./brands";
import { GENERATED_ZENDIT_AU_OFFERS } from "./zendit-offers-au.generated";

/**
 * Dedicated Australia (AU / .au) Gift Card Catalog (`au.buygiftcards.online` & `buygiftcards.com.au`).
 * All denominations are in Australian Dollars (AUD / A$), backed by live Zendit Australia
 * voucher offers (`GET /v1/vouchers/offers?country=AU`).
 * Customer `discountPercent` reflects the live Zendit AU wholesale discount minus a 2% platform margin.
 */
export const ALL_BRANDS_AU: Brand[] = [
  // House Multi-Brand Choice Cards (AUD / A$)
  {
    slug: "buygiftcards",
    name: "BuyGiftCards.online Australia Gift Card",
    category: "Multi-Brand",
    domain: "buygiftcards.online",
    color: "#0f8c66",
    type: "egift",
    min: 10,
    max: 500,
    denominations: [25, 50, 75, 100, 150, 250, 500],
    badge: "ALL-IN-ONE CHOICE",
    description:
      "Our signature Australia multi-brand gift card — recipients redeem their card number and PIN at au.buygiftcards.online/redeem to swap or split their A$ balance across any of our official Australian retail, dining, fashion, travel, and entertainment brands.",
    supportsCustomPhoto: true,
    discountPercent: 5,
  },
  {
    slug: "one4all",
    name: "One4all Australia Multi-Brand Gift Card",
    category: "Multi-Brand",
    domain: "buygiftcards.online",
    color: "#0f8c66",
    type: "egift",
    min: 15,
    max: 500,
    denominations: [25, 50, 75, 100, 150, 250],
    badge: "MULTI-BRAND",
    description:
      "The ultimate Australian choice gift card — recipient redeems at au.buygiftcards.online/redeem and chooses from top Australian retail, dining, entertainment, and travel brands.",
    supportsCustomPhoto: true,
    discountPercent: 5,
  },
  {
    slug: "holidayfavorites",
    name: "Holiday Favorites Australia Multi-Brand",
    category: "Multi-Brand",
    domain: "buygiftcards.online",
    color: "#991b1b",
    type: "egift",
    min: 15,
    max: 500,
    denominations: [25, 50, 100, 200, 500],
    badge: "HOLIDAY PICK",
    description:
      "Spread festive cheer across Australia with one card redeemable at au.buygiftcards.online/redeem for favourite Australian shopping, dining, travel, and entertainment brands.",
    supportsCustomPhoto: true,
    discountPercent: 5,
  },

  // Shopping (Live Zendit AU Catalog)
  {
    slug: "amazon",
    name: "Amazon.com.au",
    category: "Shopping",
    domain: "amazon.com.au",
    color: "#ff9900",
    type: "egift",
    min: 10,
    max: 150,
    fixedOnly: true,
    denominations: [10, 25, 50, 75, 100, 125, 150],
    badge: "TOP GIFT",
    description:
      "Shop millions of products on Amazon.com.au across Australia with instant digital delivery in Australian Dollars (AUD).",
    discountPercent: 6.5,
  },
  {
    slug: "target",
    name: "Target Australia",
    category: "Shopping",
    domain: "target.com.au",
    color: "#cc0000",
    type: "egift",
    min: 10,
    max: 200,
    fixedOnly: true,
    denominations: [10, 25, 50, 100, 150, 200],
    badge: "AUSSIE FAVOURITE",
    description:
      "Redeemable at Target Australia stores nationwide and online at target.com.au for homewares, clothing, toys, and essentials.",
    discountPercent: 6.6,
  },

  // Food & Drink (Live Zendit AU Catalog)
  {
    slug: "ubereats",
    name: "Uber Eats Australia",
    category: "Food & Drink",
    domain: "ubereats.com",
    color: "#06c167",
    type: "egift",
    min: 10,
    max: 150,
    fixedOnly: true,
    denominations: [10, 25, 50, 75, 100, 125, 150],
    badge: "POPULAR",
    description:
      "Order meals, groceries, and local Australian restaurant favourites with Uber Eats eGift cards in AUD.",
    discountPercent: 6.1,
  },
  {
    slug: "doordash",
    name: "DoorDash Australia",
    category: "Food & Drink",
    domain: "doordash.com",
    color: "#ff3008",
    type: "egift",
    min: 25,
    max: 150,
    fixedOnly: true,
    denominations: [25, 50, 75, 100, 125, 150],
    badge: "SAVE 4.6%",
    description:
      "Local Australian restaurants, takeaway, and convenience essentials delivered straight to their door with DoorDash.",
    discountPercent: 4.6,
  },

  // Fashion (Live Zendit AU Catalog)
  {
    slug: "asos",
    name: "ASOS Australia",
    category: "Fashion",
    domain: "asos.com",
    color: "#2d2d2d",
    type: "egift",
    min: 25,
    max: 150,
    fixedOnly: true,
    denominations: [25, 50, 75, 100, 125, 150],
    badge: "SAVE 6.5%",
    description:
      "Discover 850+ fashion, footwear, and beauty brands on ASOS Australia (`asos.com/au`) delivered across Australia.",
    discountPercent: 6.5,
  },
  {
    slug: "hm",
    name: "H&M Australia",
    category: "Fashion",
    domain: "hm.com",
    color: "#e50010",
    type: "egift",
    min: 10,
    max: 150,
    fixedOnly: true,
    denominations: [10, 25, 50, 75, 100, 125, 150],
    badge: "SAVE 6.5%",
    description:
      "Contemporary fashion, wardrobe staples, and accessories for women, men, and kids at H&M Australia.",
    discountPercent: 6.5,
  },

  // Entertainment (Live Zendit AU Catalog)
  {
    slug: "ticketmaster",
    name: "Ticketmaster Australia",
    category: "Entertainment",
    domain: "ticketmaster.com.au",
    color: "#026cdf",
    type: "egift",
    min: 10,
    max: 150,
    fixedOnly: true,
    denominations: [10, 25, 50, 75, 100, 125, 150],
    badge: "CONCERTS & SPORT",
    description:
      "Concerts, AFL/NRL sport, theatre, festivals, and live events across Australia at Ticketmaster.com.au.",
    discountPercent: 6.0,
  },

  // Travel & Experiences (Live Zendit AU Catalog)
  {
    slug: "uber",
    name: "Uber Australia",
    category: "Travel",
    domain: "uber.com",
    color: "#000000",
    type: "egift",
    min: 15,
    max: 150,
    fixedOnly: true,
    denominations: [15, 25, 50, 75, 100, 125, 150],
    badge: "RIDES & EATS",
    description:
      "Seamless rides, airport transfers, and Uber Eats delivery across Sydney, Melbourne, Brisbane, Perth, Adelaide, and nationwide.",
    discountPercent: 6.1,
  },
  {
    slug: "globalhotel",
    name: "Global Hotel Card (Australia)",
    category: "Travel",
    domain: "globalhotelcard.com",
    color: "#0284c7",
    type: "egift",
    min: 50,
    max: 175,
    fixedOnly: true,
    denominations: [50, 75, 100, 125, 150, 175],
    badge: "SAVE 6.1%",
    description:
      "Redeemable at over 500,000 hotels, resorts, and coastal stays across Australia, New Zealand, and worldwide in AUD.",
    discountPercent: 6.1,
  },
  {
    slug: "globalexperiences",
    name: "Global Experiences Card (Australia)",
    category: "Travel",
    domain: "globalexperiencescard.com",
    color: "#0891b2",
    type: "egift",
    min: 25,
    max: 150,
    fixedOnly: true,
    denominations: [25, 50, 75, 100, 125, 150],
    badge: "SAVE 6.6%",
    description:
      "Book Great Barrier Reef tours, Sydney Harbour cruises, wine tours, and 350,000+ experiences in Australia and worldwide.",
    discountPercent: 6.6,
  },
];

const HOUSE_SLUGS = ["buygiftcards", "one4all", "holidayfavorites"];

export const BRANDS_AU: Brand[] = ALL_BRANDS_AU.filter(
  (b) => !b.hidden && (HOUSE_SLUGS.includes(b.slug) || Boolean(GENERATED_ZENDIT_AU_OFFERS[b.slug]))
);

export const CATEGORIES_AU: string[] = Array.from(new Set(BRANDS_AU.map((b) => b.category)));

