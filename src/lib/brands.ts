import { ALL_BRANDS_CA, BRANDS_CA, CATEGORIES_CA } from "./brands-ca";
import { ALL_BRANDS_SG, BRANDS_SG, CATEGORIES_SG } from "./brands-sg";
import { ALL_BRANDS_AU, BRANDS_AU, CATEGORIES_AU } from "./brands-au";
import { CountryCode, resolveCountryFromHostOrEnv } from "./country-config";

export type DeliveryType = "egift" | "physical" | "both";

export type Brand = {
  slug: string;
  name: string;
  category: string;
  domain: string; // used for logo.dev lookup
  color: string;
  type: DeliveryType;
  min: number;
  max: number;
  denominations: number[];
  description: string;
  badge?: string;
  // Lets the customer upload their own photo to appear on the virtual card
  // face — purely a storefront visual (src/components/ProductDetail.tsx),
  // not something that goes to the card issuer. See src/lib/photo-upload.ts.
  supportsCustomPhoto?: boolean;
  // Percent off face value — a real reseller-style discount (customer pays
  // less than the card's value), not just a cosmetic badge. Applied to the
  // charged amount in the checkout route; the gift card is still issued at
  // full face value.
  discountPercent?: number;
  // Backed by fixed-denomination supplier offers: only the listed denominations can be bought.
  fixedOnly?: boolean;
  // Hidden from the storefront (not purchasable). hiddenTag records why, so we can
  // find and re-enable them later, e.g. grep NO_SUPPLIER_OFFER.
  hidden?: boolean;
  hiddenTag?: string;
};

// Server-side source of truth for prices. Checkout re-validates every line
// item against this list — the client can never dictate what gets charged.
export const ALL_BRANDS: Brand[] = [
  { slug: "buygiftcards", name: "BuyGiftCards.online Gift Card", category: "Multi-Brand", domain: "buygiftcards.online", color: "#0f8c66", type: "both", min: 10, max: 500, denominations: [25, 50, 75, 100, 150, 250, 500], badge: "ALL-IN-ONE CHOICE", description: "Our signature house gift card — recipients redeem their card number and PIN at buygiftcards.online/redeem to swap or split their balance across any of our 165+ top retail, dining, travel, and entertainment brands.", supportsCustomPhoto: true, discountPercent: 5 },
  { slug: "visa", name: "Visa Virtual Account", category: "Visa", domain: "visa.com", color: "#1a1f71", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 150, 200, 250], badge: "BEST SELLER", description: "Use anywhere Visa debit cards are accepted in the US. Shop online or in stores with the freedom to choose.", supportsCustomPhoto: true },
  { slug: "mastercard", name: "Mastercard Virtual Account", category: "Mastercard", domain: "mastercard.com", color: "#eb001b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 150, 200, 250], badge: "POPULAR", description: "Accepted worldwide wherever Mastercard debit is accepted. A flexible gift for any occasion.", supportsCustomPhoto: true },
  { slug: "one4all", name: "One4all Multi-Brand Gift Card", category: "Multi-Brand", domain: "buygiftcards.online", color: "#0f8c66", type: "both", min: 15, max: 500, denominations: [25, 50, 75, 100, 150, 250], badge: "MULTI-BRAND", description: "The ultimate choice gift card — recipient redeems at buygiftcards.online/redeem and chooses from 165+ top retail, dining, entertainment, and travel brands.", supportsCustomPhoto: true, discountPercent: 5 },
  { slug: "holidayfavorites", name: "Holiday Favorites Multi-Brand", category: "Multi-Brand", domain: "buygiftcards.online", color: "#991b1b", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], badge: "HOLIDAY PICK", description: "Spread holiday cheer with one card redeemable at buygiftcards.online/redeem for dozens of favorite holiday shopping, dining, and entertainment brands.", supportsCustomPhoto: true, discountPercent: 5 },
  { slug: "amazon", name: "Amazon", category: "Shopping", domain: "amazon.com", color: "#ff9900", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], badge: "TOP GIFT", description: "Millions of items to choose from on Amazon.com." },
  { slug: "starbucks", name: "Starbucks", category: "Food & Drink", domain: "starbucks.com", color: "#00704a", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], badge: "POPULAR", description: "Redeemable at any participating US Starbucks location or via the app." },
  { slug: "apple", name: "Apple", category: "Tech", domain: "apple.com", color: "#333333", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200], description: "App Store, Apple Music, iCloud+, Apple TV+, accessories, and more.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "doordash", name: "DoorDash", category: "Food & Drink", domain: "doordash.com", color: "#ff3008", type: "both", min: 25, max: 50, fixedOnly: true, denominations: [25, 50], description: "Restaurants and more, delivered to their door.", discountPercent: 1 },
  { slug: "nike", name: "Nike", category: "Fashion", domain: "nike.com", color: "#111111", type: "both", min: 25, max: 250, denominations: [25, 50, 100, 150, 250], description: "Redeemable at Nike stores, Nike.com, and the Nike app.", discountPercent: 5, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "netflix", name: "Netflix", category: "Entertainment", domain: "netflix.com", color: "#e50914", type: "both", min: 20, max: 100, fixedOnly: true, denominations: [20, 30, 50, 60, 75, 100], description: "Apply to any Netflix subscription plan." },
  { slug: "target", name: "Target", category: "Shopping", domain: "target.com", color: "#cc0000", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], badge: "HOLIDAY HIT", description: "Redeemable at any Target store nationwide or on Target.com." },
  { slug: "uber", name: "Uber", category: "Travel", domain: "uber.com", color: "#000000", type: "both", min: 15, max: 100, fixedOnly: true, denominations: [15, 25, 50, 75, 100], description: "For rides and Uber Eats." },
  { slug: "steam", name: "Steam", category: "Gaming", domain: "store.steampowered.com", color: "#1b2838", type: "egift", min: 10, max: 100, denominations: [10, 20, 50, 100], description: "Redeemable on Steam for games, DLC, and in-game items.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "spotify", name: "Spotify", category: "Entertainment", domain: "spotify.com", color: "#1db954", type: "egift", min: 10, max: 60, denominations: [10, 30, 60], description: "Apply to Spotify Premium.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "chipotle", name: "Chipotle", category: "Food & Drink", domain: "chipotle.com", color: "#441500", type: "both", min: 5, max: 100, fixedOnly: true, denominations: [5, 25, 50, 75, 100], description: "Burritos, bowls, tacos, and salads." },
  { slug: "airbnb", name: "Airbnb", category: "Travel", domain: "airbnb.com", color: "#ff5a5f", type: "both", min: 50, max: 100, fixedOnly: true, denominations: [50, 100], description: "Stays and experiences worldwide." },
  { slug: "walmart", name: "Walmart", category: "Shopping", domain: "walmart.com", color: "#0071ce", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200], description: "Redeemable at any Walmart store or on Walmart.com.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "homedepot", name: "Home Depot", category: "Home", domain: "homedepot.com", color: "#f96302", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Tools, materials, and more.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "sephora", name: "Sephora", category: "Fashion", domain: "sephora.com", color: "#000000", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], description: "Prestige cosmetics, skincare, fragrance, and hair care.", discountPercent: 3.1, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "panera", name: "Panera Bread", category: "Food & Drink", domain: "panerabread.com", color: "#4e7c32", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 100], description: "Fresh-baked breads, soups, salads, and sandwiches.", discountPercent: 2 },
  { slug: "xbox", name: "Xbox", category: "Gaming", domain: "xbox.com", color: "#107c10", type: "both", min: 15, max: 100, fixedOnly: true, denominations: [15, 25, 50, 100], description: "Games, add-ons, devices, and more.", discountPercent: 2.1, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "ikea", name: "IKEA", category: "Home", domain: "ikea.com", color: "#0058a3", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 250, 500], description: "Redeemable at any US IKEA store or IKEA.com.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "ubereats", name: "Uber Eats", category: "Food & Drink", domain: "ubereats.com", color: "#06c167", type: "both", min: 15, max: 100, fixedOnly: true, denominations: [15, 25, 50, 75, 100], description: "Food delivery from favorite local restaurants." },
  { slug: "googleplay", name: "Google Play", category: "Tech", domain: "play.google.com", color: "#4285f4", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], description: "Apps, games, music, movies, books, and more.", discountPercent: 1.5, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "lowes", name: "Lowe's", category: "Home", domain: "lowes.com", color: "#004990", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Home improvement made easy.", discountPercent: 5, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "adidas", name: "Adidas", category: "Fashion", domain: "adidas.com", color: "#000000", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Shoes, clothing, and accessories.", discountPercent: 3 },

  // Gas & Auto
  { slug: "shell", name: "Shell", category: "Gas & Auto", domain: "shell.com", color: "#dd1d21", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 15, 25, 50, 100], description: "Fuel, snacks, and essentials at Shell stations nationwide.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "marathon", name: "Marathon", category: "Gas & Auto", domain: "marathonpetroleum.com", color: "#00843d", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Redeemable at participating Marathon gas stations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "chevron", name: "Chevron / Texaco", category: "Gas & Auto", domain: "chevron.com", color: "#0055a4", type: "both", min: 25, max: 50, fixedOnly: true, denominations: [25, 50], description: "Fuel and convenience items at Chevron and Texaco stations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "autozone", name: "AutoZone", category: "Gas & Auto", domain: "autozone.com", color: "#d52b1e", type: "both", min: 20, max: 50, fixedOnly: true, denominations: [20, 50], description: "Auto parts, tools, and accessories.", discountPercent: 2.7, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "advanceautoparts", name: "Advance Auto Parts", category: "Gas & Auto", domain: "advanceautoparts.com", color: "#e4002b", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 100], description: "Auto parts and accessories, in store or online.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "jiffylube", name: "Jiffy Lube", category: "Gas & Auto", domain: "jiffylube.com", color: "#003da5", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Oil changes and routine vehicle maintenance.", discountPercent: 3.5 },
  { slug: "circlek", name: "Circle K", category: "Gas & Auto", domain: "circlek.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Fuel and snacks at Circle K convenience stores.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "arco", name: "ARCO", category: "Gas & Auto", domain: "arco.com", color: "#ee3124", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Redeemable at participating ARCO fuel stations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "irvingoil", name: "Irving Oil", category: "Gas & Auto", domain: "irvingoil.com", color: "#00558c", type: "both", min: 20, max: 500, denominations: [25, 50, 100, 200, 500], description: "Fuel and convenience items at Irving Oil stations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "gulfoil", name: "Gulf Oil", category: "Gas & Auto", domain: "gulfoil.com", color: "#f47920", type: "both", min: 50, max: 50, denominations: [50], description: "Redeemable at participating Gulf fuel stations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "tirediscounters", name: "Tire Discounters", category: "Gas & Auto", domain: "tirediscounters.com", color: "#e4002b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Tires and vehicle service.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "caseys", name: "Casey's General Store", category: "Gas & Auto", domain: "caseys.com", color: "#e4002b", type: "both", min: 10, max: 200, denominations: [10, 25, 50, 100, 200], description: "Fuel, pizza, and convenience-store essentials.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },

  // Grocery
  { slug: "topsmarkets", name: "Tops Markets", category: "Grocery", domain: "topsmarkets.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Groceries at Tops Markets locations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "giantco", name: "The Giant Company", category: "Grocery", domain: "giantfoodstores.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Groceries at Giant Food Stores and Martin's.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "giantfood", name: "Giant Food", category: "Grocery", domain: "giantfood.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Groceries at Giant Food supermarkets.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "stopandshop", name: "Stop & Shop", category: "Grocery", domain: "stopandshop.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Groceries at Stop & Shop supermarkets.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "cvspharmacy", name: "CVS Pharmacy", category: "Grocery", domain: "cvs.com", color: "#cc0000", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Pharmacy, health, and everyday essentials.", discountPercent: 2 },

  // Shopping
  { slug: "bathbodyworks", name: "Bath & Body Works", category: "Shopping", domain: "bathandbodyworks.com", color: "#0f2e5e", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Fragrances, candles, and body care.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "bloomingdales", name: "Bloomingdale's", category: "Shopping", domain: "bloomingdales.com", color: "#000000", type: "both", min: 25, max: 200, denominations: [25, 50, 100, 200], description: "Designer fashion, beauty, and home goods.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "ultabeauty", name: "Ulta Beauty", category: "Beauty", domain: "ulta.com", color: "#e6007e", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Cosmetics, skincare, and salon services.", discountPercent: 0.3 },
  { slug: "kohls", name: "Kohl's", category: "Shopping", domain: "kohls.com", color: "#004b8d", type: "both", min: 10, max: 50, fixedOnly: true, denominations: [10, 25, 50], description: "Apparel, home, and everyday essentials.", discountPercent: 0.5 },
  { slug: "saks", name: "Saks Fifth Avenue", category: "Shopping", domain: "saksfifthavenue.com", color: "#000000", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], description: "Luxury fashion, beauty, and accessories.", discountPercent: 1.9 },
  { slug: "macys", name: "Macy's", category: "Shopping", domain: "macys.com", color: "#e21a2c", type: "both", min: 5, max: 100, fixedOnly: true, denominations: [5, 10, 25, 50, 100], description: "Apparel, home, and beauty at Macy's.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "staples", name: "Staples", category: "Shopping", domain: "staples.com", color: "#cc0000", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Office supplies, tech, and printing services.", discountPercent: 2 },
  { slug: "containerstore", name: "The Container Store", category: "Home", domain: "containerstore.com", color: "#00558c", type: "both", min: 5, max: 100, fixedOnly: true, denominations: [5, 10, 25, 50, 75, 100], description: "Storage and organization solutions." , discountPercent: 2.5 },
  { slug: "totalwine", name: "Total Wine & More", category: "Shopping", domain: "totalwine.com", color: "#7a1f2b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Wine, beer, and spirits.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "onestopplus", name: "OneStopPlus", category: "Fashion", domain: "onestopplus.com", color: "#000000", type: "both", min: 20, max: 250, denominations: [25, 50, 100, 250], description: "Plus-size apparel from multiple brands.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "jcpenney", name: "JCPenney", category: "Shopping", domain: "jcpenney.com", color: "#e4002b", type: "both", min: 5, max: 100, fixedOnly: true, denominations: [5, 10, 25, 50, 100], description: "Apparel, home, and beauty at JCPenney.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "shutterfly", name: "Shutterfly", category: "Shopping", domain: "shutterfly.com", color: "#4fb14d", type: "egift", min: 25, max: 50, fixedOnly: true, denominations: [25, 50], description: "Custom photo books, prints, and gifts.", discountPercent: 2 },
  { slug: "groupon", name: "Groupon", category: "Shopping", domain: "groupon.com", color: "#53a318", type: "both", min: 15, max: 200, denominations: [15, 25, 50, 100, 200], description: "Local deals on dining, activities, and more.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "wayfair", name: "Wayfair", category: "Home", domain: "wayfair.com", color: "#7f187f", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Furniture and home goods.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "crateandbarrel", name: "Crate & Barrel", category: "Home", domain: "crateandbarrel.com", color: "#000000", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Modern furniture and home decor.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "yankeecandle", name: "Yankee Candle", category: "Home", domain: "yankeecandle.com", color: "#000000", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Candles and home fragrance.", discountPercent: 3.5 },

  // Fashion
  { slug: "underarmour", name: "Under Armour", category: "Fashion", domain: "underarmour.com", color: "#111111", type: "both", min: 15, max: 500, denominations: [15, 25, 50, 100, 200, 500], description: "Athletic apparel, footwear, and gear.", discountPercent: 4.2 },
  { slug: "gamestop", name: "GameStop", category: "Gaming", domain: "gamestop.com", color: "#d0021b", type: "both", min: 5, max: 100, fixedOnly: true, denominations: [5, 10, 25, 50, 75, 100], description: "Video games, consoles, and accessories.", discountPercent: 2, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "hottopic", name: "Hot Topic", category: "Fashion", domain: "hottopic.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Pop-culture apparel and accessories.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "llbean", name: "L.L.Bean", category: "Fashion", domain: "llbean.com", color: "#00693e", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 100], description: "Outdoor apparel and gear.", discountPercent: 2.9 },
  { slug: "dsw", name: "DSW", category: "Fashion", domain: "dsw.com", color: "#e4002b", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Shoes for the whole family.", discountPercent: 2 },
  { slug: "dillards", name: "Dillard's", category: "Shopping", domain: "dillards.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Apparel, beauty, and home at Dillard's.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "childrensplace", name: "The Children's Place", category: "Kids", domain: "childrensplace.com", color: "#e4002b", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Kids' and baby apparel.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "torrid", name: "Torrid", category: "Fashion", domain: "torrid.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Plus-size women's fashion.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "untuckit", name: "UNTUCKit", category: "Fashion", domain: "untuckit.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Shirts designed to be worn untucked.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "raybans", name: "Ray-Ban", category: "Fashion", domain: "ray-ban.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Sunglasses and eyewear.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "footlocker", name: "Foot Locker", category: "Fashion", domain: "footlocker.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Sneakers and athletic apparel.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "finishline", name: "Finish Line", category: "Fashion", domain: "finishline.com", color: "#000000", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Sneakers and athletic apparel.", discountPercent: 5.2 },
  { slug: "chicos", name: "Chico's", category: "Fashion", domain: "chicos.com", color: "#000000", type: "both", min: 10, max: 50, fixedOnly: true, denominations: [10, 25, 50], description: "Women's apparel and accessories.", discountPercent: 2.8 },
  { slug: "talbots", name: "Talbots", category: "Fashion", domain: "talbots.com", color: "#000000", type: "both", min: 25, max: 25, denominations: [25], description: "Classic women's apparel.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "guess", name: "Guess", category: "Fashion", domain: "guess.com", color: "#000000", type: "both", min: 15, max: 50, fixedOnly: true, denominations: [15, 25, 50], description: "Apparel, denim, and accessories.", discountPercent: 4.1 },
  { slug: "boscovs", name: "Boscov's", category: "Shopping", domain: "boscovs.com", color: "#e4002b", type: "both", min: 15, max: 50, fixedOnly: true, denominations: [15, 25, 50], description: "Department store apparel and home goods.", discountPercent: 4.1 },
  { slug: "aeo", name: "American Eagle Outfitters", category: "Fashion", domain: "ae.com", color: "#002d5b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Casual apparel and denim.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "aerie", name: "Aerie", category: "Fashion", domain: "ae.com", color: "#ff5b77", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Intimates and loungewear from American Eagle's sister brand.", discountPercent: 0.5 },
  { slug: "aeropostale", name: "Aeropostale", category: "Fashion", domain: "aeropostale.com", color: "#000000", type: "both", min: 15, max: 250, denominations: [25, 50, 100, 250], description: "Casual apparel for teens.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "lanebryant", name: "Lane Bryant", category: "Fashion", domain: "lanebryant.com", color: "#000000", type: "both", min: 15, max: 200, denominations: [25, 50, 100, 200], description: "Plus-size women's fashion.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "pacsun", name: "PacSun", category: "Fashion", domain: "pacsun.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Streetwear and denim for teens.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "carters", name: "Carter's / OshKosh B'gosh", category: "Kids", domain: "carters.com", color: "#0093d0", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], description: "Baby and kids' apparel.", discountPercent: 5.6 },
  { slug: "landsend", name: "Lands' End", category: "Fashion", domain: "landsend.com", color: "#00263a", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Classic apparel and outerwear.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "guitarcenter", name: "Guitar Center", category: "Shopping", domain: "guitarcenter.com", color: "#000000", type: "both", min: 25, max: 50, fixedOnly: true, denominations: [25, 50], description: "Musical instruments and gear.", discountPercent: 0.5 },
  { slug: "sunglasshut", name: "Sunglass Hut", category: "Fashion", domain: "sunglasshut.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Sunglasses from top brands.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "stitchfix", name: "Stitch Fix", category: "Fashion", domain: "stitchfix.com", color: "#000000", type: "egift", min: 5, max: 100, fixedOnly: true, denominations: [5, 10, 25, 50, 75, 100], description: "Personal styling, delivered to your door.", discountPercent: 2.6 },
  { slug: "hibbettsports", name: "Hibbett Sports", category: "Fashion", domain: "hibbett.com", color: "#e4002b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Athletic footwear and apparel.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },

  // Beauty
  { slug: "sallybeauty", name: "Sally Beauty", category: "Beauty", domain: "sallybeauty.com", color: "#000000", type: "both", min: 25, max: 100, denominations: [25, 50, 100], description: "Hair color and beauty supplies.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },

  // Food & Drink
  { slug: "mcdonalds", name: "McDonald's", category: "Food & Drink", domain: "mcdonalds.com", color: "#da291c", type: "both", min: 10, max: 150, denominations: [10, 25, 50, 100, 150], description: "Redeemable at participating McDonald's restaurants.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "subway", name: "Subway", category: "Food & Drink", domain: "subway.com", color: "#008938", type: "both", min: 5, max: 100, fixedOnly: true, denominations: [5, 10, 25, 50, 75, 100], description: "Sandwiches, salads, and wraps." },
  { slug: "darden", name: "Darden Restaurants", category: "Food & Drink", domain: "darden.com", color: "#4c7c2b", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "One card for Olive Garden, LongHorn, and other Darden brands.", discountPercent: 2 },
  { slug: "pizzahut", name: "Pizza Hut", category: "Food & Drink", domain: "pizzahut.com", color: "#ee3831", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Pizza, wings, and pasta.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "dominos", name: "Domino's", category: "Food & Drink", domain: "dominos.com", color: "#0078ae", type: "both", min: 5, max: 100, fixedOnly: true, denominations: [5, 25, 50, 75, 100], description: "Pizza delivery and carryout.", discountPercent: 2 },
  { slug: "cheesecakefactory", name: "The Cheesecake Factory", category: "Food & Drink", domain: "thecheesecakefactory.com", color: "#6b3fa0", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "An extensive menu, plus legendary cheesecake." },
  { slug: "redrobin", name: "Red Robin", category: "Food & Drink", domain: "redrobin.com", color: "#c8102e", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 100], description: "Gourmet burgers and bottomless fries.", discountPercent: 0.1 },
  { slug: "peets", name: "Peet's Coffee", category: "Food & Drink", domain: "peets.com", color: "#582c1c", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], description: "Coffee and tea, roasted fresh.", discountPercent: 1.3 },
  { slug: "bjsrestaurants", name: "BJ's Restaurants", category: "Food & Drink", domain: "bjsrestaurants.com", color: "#e21937", type: "both", min: 15, max: 200, denominations: [25, 50, 100, 200], description: "Craft beer, deep-dish pizza, and Pizookie.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "firehousesubs", name: "Firehouse Subs", category: "Food & Drink", domain: "firehousesubs.com", color: "#a6192e", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Hot subs, firehouse-style.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "wendys", name: "Wendy's", category: "Food & Drink", domain: "wendys.com", color: "#e2231a", type: "both", min: 20, max: 100, denominations: [20, 25, 50, 100], description: "Fresh, never frozen beef burgers.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "chilis", name: "Chili's", category: "Food & Drink", domain: "chilis.com", color: "#a6192e", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 100], description: "Bold flavors and Tex-Mex favorites.", discountPercent: 3.4 },
  { slug: "grubhub", name: "Grubhub", category: "Food & Drink", domain: "grubhub.com", color: "#f63440", type: "egift", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Food delivery from local restaurants.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "steaknshake", name: "Steak 'n Shake", category: "Food & Drink", domain: "steaknshake.com", color: "#e4002b", type: "both", min: 15, max: 100, fixedOnly: true, denominations: [15, 25, 50, 75, 100], description: "Burgers and hand-dipped milkshakes.", discountPercent: 4.1 },
  { slug: "arbys", name: "Arby's", category: "Food & Drink", domain: "arbys.com", color: "#c8102e", type: "both", min: 15, max: 100, denominations: [15, 25, 50, 100], description: "We have the meats.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "krispykreme", name: "Krispy Kreme", category: "Food & Drink", domain: "krispykreme.com", color: "#00a651", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Doughnuts and coffee.", discountPercent: 5.1 },
  { slug: "ihop", name: "IHOP", category: "Food & Drink", domain: "ihop.com", color: "#0033a0", type: "both", min: 100, max: 100, fixedOnly: true, denominations: [100], description: "Pancakes and breakfast, anytime.", discountPercent: 0.6 },
  { slug: "olivegarden", name: "Olive Garden", category: "Food & Drink", domain: "olivegarden.com", color: "#4c7c2b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Italian dining, family-style.", discountPercent: 2.8, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "outback", name: "Outback Steakhouse", category: "Food & Drink", domain: "outback.com", color: "#e4002b", type: "both", min: 20, max: 100, denominations: [25, 50, 100], description: "Steaks and Aussie-inspired dishes.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "bobevans", name: "Bob Evans", category: "Food & Drink", domain: "bobevans.com", color: "#0066b3", type: "both", min: 15, max: 50, fixedOnly: true, denominations: [15, 25, 50], description: "Farm-fresh comfort food.", discountPercent: 2.5 },
  { slug: "applebees", name: "Applebee's", category: "Food & Drink", domain: "applebees.com", color: "#a6192e", type: "both", min: 15, max: 200, denominations: [25, 50, 100, 200], description: "Casual dining and bar favorites.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "jackinthebox", name: "Jack in the Box", category: "Food & Drink", domain: "jackinthebox.com", color: "#e4002b", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Burgers, tacos, and late-night eats.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "redlobster", name: "Red Lobster", category: "Food & Drink", domain: "redlobster.com", color: "#c8102e", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Seafood dining.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "larosas", name: "LaRosa's Family Pizzerias", category: "Food & Drink", domain: "larosas.com", color: "#c8102e", type: "both", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Family-style pizza and Italian food.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "papamurphys", name: "Papa Murphy's", category: "Food & Drink", domain: "papamurphys.com", color: "#ef3e42", type: "both", min: 15, max: 250, denominations: [25, 50, 100, 250], description: "Take-and-bake pizza.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "burgerking", name: "Burger King", category: "Food & Drink", domain: "bk.com", color: "#d62300", type: "both", min: 10, max: 100, denominations: [25, 50, 100], description: "Home of the Whopper.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "rockymountainchocolate", name: "Rocky Mountain Chocolate Factory", category: "Food & Drink", domain: "rmcf.com", color: "#5c2e1f", type: "egift", min: 25, max: 25, denominations: [25], description: "Handcrafted chocolates and confections.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "planetsmoothie", name: "Planet Smoothie", category: "Food & Drink", domain: "planetsmoothie.com", color: "#f57e20", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Smoothies made to order.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "macaronigrill", name: "Romano's Macaroni Grill", category: "Food & Drink", domain: "macaronigrill.com", color: "#7a1f2b", type: "both", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Italian-American dining.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "dennys", name: "Denny's", category: "Food & Drink", domain: "dennys.com", color: "#e4002b", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Diner classics, open late.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "cpk", name: "California Pizza Kitchen", category: "Food & Drink", domain: "cpk.com", color: "#00543d", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "California-style pizza and salads.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "blackangus", name: "Black Angus Steakhouse", category: "Food & Drink", domain: "blackangus.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Steakhouse dining.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "benihana", name: "Benihana", category: "Food & Drink", domain: "benihana.com", color: "#c8102e", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Japanese hibachi dining.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "sweetfrog", name: "Sweetfrog", category: "Food & Drink", domain: "sweetfrog.com", color: "#ec008c", type: "both", min: 5, max: 25, fixedOnly: true, denominations: [5, 10, 25], description: "Self-serve frozen yogurt.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "jerseymikes", name: "Jersey Mike's", category: "Food & Drink", domain: "jerseymikes.com", color: "#00843d", type: "both", min: 20, max: 50, fixedOnly: true, denominations: [20, 50], description: "Fresh sliced subs.", discountPercent: 4.1 },
  { slug: "coldstonecreamery", name: "Cold Stone Creamery", category: "Food & Drink", domain: "coldstonecreamery.com", color: "#6a1b3a", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Ice cream, made fresh on a frozen stone.", discountPercent: 4.2 },
  { slug: "bajafresh", name: "Baja Fresh", category: "Food & Drink", domain: "bajafresh.com", color: "#e4002b", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Fresh-Mex burritos and tacos.", discountPercent: 2 },
  { slug: "chuys", name: "Chuy's", category: "Food & Drink", domain: "chuys.com", color: "#00843d", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Tex-Mex with a side of fun.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "bubbagump", name: "Bubba Gump Shrimp Co.", category: "Food & Drink", domain: "bubbagump.com", color: "#e4002b", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], description: "Seafood dining, Forrest Gump-inspired.", discountPercent: 4.1 },
  { slug: "carrabbas", name: "Carrabba's Italian Grill", category: "Food & Drink", domain: "carrabbas.com", color: "#7a1f2b", type: "both", min: 20, max: 200, denominations: [25, 50, 100], description: "Italian dining, family recipes.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "popeyes", name: "Popeyes", category: "Food & Drink", domain: "popeyes.com", color: "#a6192e", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Louisiana-style fried chicken.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "bahamabreeze", name: "Bahama Breeze", category: "Food & Drink", domain: "bahamabreeze.com", color: "#00843d", type: "both", min: 10, max: 50, fixedOnly: true, denominations: [10, 25, 50], description: "Caribbean-inspired island dining.", discountPercent: 2 },
  { slug: "lucillesbbq", name: "Lucille's Smokehouse Bar-B-Que", category: "Food & Drink", domain: "lucillesbbq.com", color: "#7a1f2b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Slow-smoked barbecue.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "rubytuesday", name: "Ruby Tuesday", category: "Food & Drink", domain: "rubytuesday.com", color: "#e4002b", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "American casual dining.", discountPercent: 1 },
  { slug: "cheddars", name: "Cheddar's Scratch Kitchen", category: "Food & Drink", domain: "cheddars.com", color: "#7a1f2b", type: "both", min: 10, max: 50, fixedOnly: true, denominations: [10, 25, 50], description: "Scratch-made comfort food.", discountPercent: 1 },
  { slug: "seasons52", name: "Seasons 52", category: "Food & Drink", domain: "seasons52.com", color: "#4c7c2b", type: "both", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], description: "Seasonally inspired, lighter dining.", discountPercent: 1.5 },
  { slug: "longhornsteakhouse", name: "LongHorn Steakhouse", category: "Food & Drink", domain: "longhornsteakhouse.com", color: "#7a1f2b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Bold, expertly grilled steaks.", discountPercent: 2.8, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "omahasteaks", name: "Omaha Steaks", category: "Food & Drink", domain: "omahasteaks.com", color: "#7a1f2b", type: "both", min: 20, max: 200, denominations: [25, 50, 100, 200], description: "Premium steaks and gourmet foods, delivered.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "bibibop", name: "BIBIBOP Asian Grill", category: "Food & Drink", domain: "bibibop.com", color: "#e4002b", type: "both", min: 20, max: 100, denominations: [20, 25, 50, 100], description: "Build-your-own Korean-inspired bowls.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "buffalowildwings", name: "Buffalo Wild Wings", category: "Food & Drink", domain: "buffalowildwings.com", color: "#000000", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Wings, beer, and sports on the big screen.", discountPercent: 1 },
  { slug: "jasonsdeli", name: "Jason's Deli", category: "Food & Drink", domain: "jasonsdeli.com", color: "#00843d", type: "both", min: 25, max: 25, denominations: [25], description: "Deli sandwiches, soups, and salads.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },

  // Travel & Hotel
  { slug: "southwest", name: "Southwest Airlines", category: "Travel", domain: "southwest.com", color: "#304cb2", type: "egift", min: 15, max: 100, fixedOnly: true, denominations: [15, 25, 50, 75, 100], description: "Flights across the Southwest network.", discountPercent: 2.1 },
  { slug: "amtrak", name: "Amtrak", category: "Travel", domain: "amtrak.com", color: "#013c6a", type: "egift", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Train travel across the US.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "marriott", name: "Marriott", category: "Travel", domain: "marriott.com", color: "#a70e29", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Stays across the Marriott portfolio.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "mgmresorts", name: "MGM Resorts", category: "Travel", domain: "mgmresorts.com", color: "#b8860b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Stays, dining, and shows at MGM Resorts destinations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "goldennugget", name: "Golden Nugget Hotel & Casino", category: "Travel", domain: "goldennugget.com", color: "#c5a253", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Stays and dining at Golden Nugget properties.", discountPercent: 2 },

  // Entertainment
  { slug: "amctheatres", name: "AMC Theatres", category: "Entertainment", domain: "amctheatres.com", color: "#d4202c", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Movie tickets and concessions.", discountPercent: 1.5 },
  { slug: "regal", name: "Regal Cinemas", category: "Entertainment", domain: "regmovies.com", color: "#000000", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 100], description: "Movie tickets and concessions.", discountPercent: 1 },
  { slug: "cinemark", name: "Cinemark", category: "Entertainment", domain: "cinemark.com", color: "#8a1538", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Movie tickets and concessions.", discountPercent: 0.5 },
  { slug: "emagine", name: "Emagine Theaters", category: "Entertainment", domain: "emagine-entertainment.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Movie tickets and premium theater experiences.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "chuckecheese", name: "Chuck E. Cheese", category: "Entertainment", domain: "chuckecheese.com", color: "#e4002b", type: "both", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Games, pizza, and family fun.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "playstation", name: "Sony PlayStation Store", category: "Gaming", domain: "playstation.com", color: "#003791", type: "egift", min: 10, max: 100, fixedOnly: true, denominations: [10, 25, 50, 75, 100], description: "Games, DLC, and subscriptions on PlayStation Store.", discountPercent: 3.6, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "golfnow", name: "GolfNow", category: "Entertainment", domain: "golfnow.com", color: "#003057", type: "egift", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Tee times at courses nationwide.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "spafinder", name: "Spafinder", category: "Beauty", domain: "spafinder.com", color: "#7a1f2b", type: "egift", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Spa and wellness experiences nationwide.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "buildabear", name: "Build-A-Bear", category: "Kids", domain: "buildabear.com", color: "#ec008c", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Make-your-own stuffed animals.", discountPercent: 3.5 },
  { slug: "fanatics", name: "Fanatics", category: "Shopping", domain: "fanatics.com", color: "#0f4d92", type: "egift", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Officially licensed sports gear and jerseys.", discountPercent: 3 },

  // Sports & Outdoors
  { slug: "rei", name: "REI", category: "Sports & Outdoors", domain: "rei.com", color: "#004c3f", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Outdoor gear and apparel.", discountPercent: 4.9 },
  { slug: "basspro", name: "Bass Pro Shops", category: "Sports & Outdoors", domain: "basspro.com", color: "#8a0303", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Fishing, hunting, and outdoor gear.", discountPercent: 2 },
  { slug: "academysports", name: "Academy Sports + Outdoors", category: "Sports & Outdoors", domain: "academy.com", color: "#00563f", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Sporting goods and outdoor gear.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "petco", name: "Petco", category: "Home", domain: "petco.com", color: "#d2202e", type: "both", min: 10, max: 200, denominations: [25, 50, 100, 200], description: "Pet food, supplies, and services.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "petsmart", name: "PetSmart", category: "Home", domain: "petsmart.com", color: "#003057", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Pet food, supplies, and grooming.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "chewy", name: "Chewy", category: "Home", domain: "chewy.com", color: "#1a6ba9", type: "egift", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Pet food and supplies, delivered." },
  { slug: "barnesnoble", name: "Barnes & Noble", category: "Shopping", domain: "barnesandnoble.com", color: "#066938", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Books, toys, and gifts.", discountPercent: 2 },
  { slug: "michaels", name: "Michaels", category: "Home", domain: "michaels.com", color: "#dd0031", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Arts, crafts, and hobby supplies.", discountPercent: 3.6 },
  { slug: "pandaexpress", name: "Panda Express", category: "Food & Drink", domain: "pandaexpress.com", color: "#d2232a", type: "both", min: 15, max: 100, fixedOnly: true, denominations: [15, 25, 50, 75, 100], description: "American Chinese favorites.", discountPercent: 2.5 },
  { slug: "belk", name: "Belk", category: "Shopping", domain: "belk.com", color: "#005baa", type: "both", min: 25, max: 50, fixedOnly: true, denominations: [25, 50], description: "Apparel, home, and beauty at Belk.", discountPercent: 5.1 },
  { slug: "gap", name: "Gap", category: "Fashion", domain: "gap.com", color: "#002f6c", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Casual apparel for the whole family.", discountPercent: 3 },
  { slug: "hellofresh", name: "HelloFresh", category: "Food & Drink", domain: "hellofresh.com", color: "#99cc33", type: "egift", min: 61, max: 61, denominations: [61], description: "Meal kits delivered to your door.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },

  // Additional Zendit US Catalog Brands (Live Voucher & eGift Fulfillment)
  { slug: "disney", name: "Disney", category: "Entertainment", domain: "disney.com", color: "#113ccf", type: "both", min: 15, max: 500, denominations: [15, 25, 50, 100, 200, 500], badge: "FAMILY FAVORITE", description: "Redeemable at Disney store, shopDisney.com, Disney+, and Walt Disney World® & Disneyland® Resorts." },
  { slug: "dunkin", name: "Dunkin'", category: "Food & Drink", domain: "dunkindonuts.com", color: "#ff671f", type: "both", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], badge: "POPULAR", description: "Coffee, espresso, donuts, and breakfast sandwiches at participating Dunkin' locations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "oldnavy", name: "Old Navy", category: "Fashion", domain: "oldnavy.gap.com", color: "#003764", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Must-have fashion and everyday essentials for the whole family at Old Navy.", discountPercent: 5.7, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "burlington", name: "Burlington", category: "Shopping", domain: "burlington.com", color: "#cc0000", type: "both", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 75, 100], description: "Deals on brand-name apparel, shoes, coats, and home decor at Burlington stores.", discountPercent: 1.3 },
  { slug: "albertsons", name: "Albertsons", category: "Grocery", domain: "albertsons.com", color: "#005da6", type: "egift", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Fresh groceries, bakery, deli, and pharmacy essentials at Albertsons supermarkets.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "conoco", name: "Conoco", category: "Gas & Auto", domain: "conoco.com", color: "#e4002b", type: "egift", min: 5, max: 50, fixedOnly: true, denominations: [5, 10, 25, 50], description: "Fuel, snacks, and road-trip essentials at participating Conoco stations.", hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "fortnite", name: "Fortnite V-Bucks", category: "Gaming", domain: "fortnite.com", color: "#2a0e61", type: "egift", min: 25, max: 150, fixedOnly: true, denominations: [25, 50, 75, 100, 150], badge: "GAMER PICK", description: "Redeem for Fortnite V-Bucks to unlock Battle Passes, outfits, emotes, and item shop bundles.", discountPercent: 0.8, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "minecraft", name: "Minecraft", category: "Gaming", domain: "minecraft.net", color: "#3c8527", type: "egift", min: 10, max: 27, denominations: [10, 20, 27], description: "Redeem for Minecraft Minecoins, add-ons, worlds, or Minecraft Java & Bedrock Edition.", discountPercent: 28.6, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "eaplay", name: "EA Play", category: "Gaming", domain: "ea.com", color: "#ff4747", type: "egift", min: 15, max: 25, fixedOnly: true, denominations: [15, 25], description: "Unlock EA Play membership benefits, trials, and a library of top Electronic Arts titles.", discountPercent: 7.8, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "razergold", name: "Razer Gold", category: "Gaming", domain: "razer.com", color: "#44d62c", type: "egift", min: 10, max: 50, fixedOnly: true, denominations: [10, 20, 50], description: "The unified virtual credit for gamers across 42,000+ games and entertainment titles.", discountPercent: 2.2, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "pubg", name: "PUBG Mobile UC", category: "Gaming", domain: "pubg.com", color: "#f2a900", type: "egift", min: 1, max: 500, fixedOnly: true, denominations: [1, 5, 10, 25, 50, 100, 200, 300, 400, 500], description: "Redeem for Unknown Cash (UC) in PUBG Mobile for Royale Passes, crates, and skins.", discountPercent: 1.2 },
  { slug: "freefire", name: "Garena Free Fire", category: "Gaming", domain: "ff.garena.com", color: "#ff5500", type: "egift", min: 1, max: 20, fixedOnly: true, denominations: [1, 2, 5, 10, 20], description: "Redeem for Free Fire Diamonds to unlock characters, weapon skins, and Elite Passes." },
  { slug: "mobilelegends", name: "Mobile Legends Diamonds", category: "Gaming", domain: "mobilelegends.com", color: "#1e3a8a", type: "egift", min: 1, max: 100, fixedOnly: true, denominations: [1, 5, 10, 20, 30, 50, 100], description: "Top up Mobile Legends: Bang Bang Diamonds for heroes, skins, and Starlight memberships.", discountPercent: 0.5 },
  { slug: "gatorade", name: "Gatorade", category: "Sports & Outdoors", domain: "gatorade.com", color: "#ff5b00", type: "egift", min: 25, max: 100, fixedOnly: true, denominations: [25, 50, 100], description: "Sports fuel, bottles, equipment, and custom gear on Gatorade.com.", discountPercent: 3.4, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "zwilling", name: "Zwilling J.A. Henckels", category: "Home", domain: "zwilling.com", color: "#d5001c", type: "egift", min: 25, max: 200, fixedOnly: true, denominations: [25, 50, 75, 100, 150, 200], description: "Premium kitchen knives, Staub cast iron cookware, and culinary tools.", discountPercent: 2.7, hidden: true, hiddenTag: "NO_SUPPLIER_OFFER" },
  { slug: "integralcare", name: "Integral Care", category: "Beauty", domain: "zendit.io", color: "#0284c7", type: "egift", min: 139, max: 230, fixedOnly: true, denominations: [139, 230], description: "Digital healthcare, telehealth, and wellness membership plans.", discountPercent: 3 },
];

// Storefront list: excludes brands tagged `hidden` (no supplier offer yet).
export const BRANDS: Brand[] = ALL_BRANDS.filter((b) => !b.hidden);

export const CATEGORIES = [...new Set(BRANDS.map((b) => b.category))].sort();

/**
 * Returns the active storefront brand catalog for the selected country:
 * - `CA` -> Canada-supported gift cards (`BRANDS_CA` from `src/lib/brands-ca.ts`)
/**
 * Returns the active gift card catalog for the given country:
 * - `CA` -> Canada gift cards (`BRANDS_CA`, CAD)
 * - `SG` -> Singapore gift cards (`BRANDS_SG`, SGD)
 * - `AU` -> Australia gift cards (`BRANDS_AU`, AUD)
 * - `US` (and default) -> US gift cards (`BRANDS`, USD)
 */
export function getBrandsForCountry(
  country: CountryCode = resolveCountryFromHostOrEnv()
): Brand[] {
  if (country === "CA") return BRANDS_CA;
  if (country === "SG") return BRANDS_SG;
  if (country === "AU") return BRANDS_AU;
  return BRANDS;
}

export function getCategoriesForCountry(
  country: CountryCode = resolveCountryFromHostOrEnv()
): string[] {
  if (country === "CA") return CATEGORIES_CA;
  if (country === "SG") return CATEGORIES_SG;
  if (country === "AU") return CATEGORIES_AU;
  return CATEGORIES;
}

// Looks up country-appropriate brand first, then falls back across ALL_BRANDS, ALL_BRANDS_CA, ALL_BRANDS_SG, and ALL_BRANDS_AU
// so country-specific brands (`bostonpizza`, `ardene`, `petrocanada`, `garena`, `asos`, `globalhotel`, etc.)
// and existing orders always resolve cleanly.
export function getBrand(
  slug: string,
  country: CountryCode = resolveCountryFromHostOrEnv()
): Brand | undefined {
  if (country === "CA") {
    return (
      ALL_BRANDS_CA.find((b) => b.slug === slug) ||
      ALL_BRANDS.find((b) => b.slug === slug) ||
      ALL_BRANDS_SG.find((b) => b.slug === slug) ||
      ALL_BRANDS_AU.find((b) => b.slug === slug)
    );
  }
  if (country === "SG") {
    return (
      ALL_BRANDS_SG.find((b) => b.slug === slug) ||
      ALL_BRANDS.find((b) => b.slug === slug) ||
      ALL_BRANDS_CA.find((b) => b.slug === slug) ||
      ALL_BRANDS_AU.find((b) => b.slug === slug)
    );
  }
  if (country === "AU") {
    return (
      ALL_BRANDS_AU.find((b) => b.slug === slug) ||
      ALL_BRANDS.find((b) => b.slug === slug) ||
      ALL_BRANDS_CA.find((b) => b.slug === slug) ||
      ALL_BRANDS_SG.find((b) => b.slug === slug)
    );
  }
  return (
    ALL_BRANDS.find((b) => b.slug === slug) ||
    ALL_BRANDS_CA.find((b) => b.slug === slug) ||
    ALL_BRANDS_SG.find((b) => b.slug === slug) ||
    ALL_BRANDS_AU.find((b) => b.slug === slug)
  );
}

export const HOUSE_BRAND_SLUGS = ["buygiftcards", "one4all", "holidayfavorites"];

export function isHouseBrand(slugOrName: string): boolean {
  const lower = slugOrName.toLowerCase();
  return (
    HOUSE_BRAND_SLUGS.includes(lower) ||
    lower.includes("buygiftcards.online") ||
    lower.includes("one4all") ||
    lower.includes("holiday favorites") ||
    lower.includes("multi-brand")
  );
}

export function logoUrl(domain: string, size = 128) {
  if (domain === "buygiftcards.online") {
    return "/logo-mark-512.png";
  }
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  return `https://img.logo.dev/${domain}?token=${token}&size=${size}&format=webp&retina=true`;
}

/** Validates a requested amount is one this brand actually sells, at the server. */
export function isValidDenomination(brand: Brand, amountCents: number): boolean {
  const dollars = amountCents / 100;
  if (brand.denominations.includes(dollars)) return true;
  if (brand.fixedOnly) return false;
  return dollars >= brand.min && dollars <= brand.max && Number.isInteger(dollars);
}

/**
 * What the customer actually pays for a given face-value denomination, in
 * cents, after any discount. The gift card is still issued at the full
 * face value — the discount is the reseller's margin, same model real
 * gift-card marketplaces use. Server-side source of truth; the checkout
 * route recomputes this itself rather than trusting a client-sent price.
 */
export function chargeAmountCents(brand: Brand, faceValueDollars: number): number {
  const faceCents = Math.round(faceValueDollars * 100);
  if (!brand.discountPercent) return faceCents;
  return Math.round(faceCents * (1 - brand.discountPercent / 100));
}
