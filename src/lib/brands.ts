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
};

// Server-side source of truth for prices. Checkout re-validates every line
// item against this list — the client can never dictate what gets charged.
export const BRANDS: Brand[] = [
  { slug: "buygiftcards", name: "BuyGiftCards.online Gift Card", category: "Multi-Brand", domain: "buygiftcards.online", color: "#0f8c66", type: "egift", min: 10, max: 500, denominations: [25, 50, 75, 100, 150, 250, 500], badge: "ALL-IN-ONE CHOICE", description: "Our signature house gift card — recipients redeem their card number and PIN at buygiftcards.online/redeem to swap or split their balance across any of our 165+ top retail, dining, travel, and entertainment brands.", supportsCustomPhoto: true, discountPercent: 5 },
  { slug: "visa", name: "Visa Virtual Account", category: "Visa", domain: "visa.com", color: "#1a1f71", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 150, 200, 250], badge: "BEST SELLER", description: "Use anywhere Visa debit cards are accepted in the US. Shop online or in stores with the freedom to choose.", supportsCustomPhoto: true },
  { slug: "mastercard", name: "Mastercard Virtual Account", category: "Mastercard", domain: "mastercard.com", color: "#eb001b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 150, 200, 250], badge: "POPULAR", description: "Accepted worldwide wherever Mastercard debit is accepted. A flexible gift for any occasion.", supportsCustomPhoto: true },
  { slug: "one4all", name: "One4all Multi-Brand Gift Card", category: "Multi-Brand", domain: "buygiftcards.online", color: "#0f8c66", type: "egift", min: 15, max: 500, denominations: [25, 50, 75, 100, 150, 250], badge: "MULTI-BRAND", description: "The ultimate choice gift card — recipient redeems at buygiftcards.online/redeem and chooses from 165+ top retail, dining, entertainment, and travel brands.", supportsCustomPhoto: true, discountPercent: 5 },
  { slug: "holidayfavorites", name: "Holiday Favorites Multi-Brand", category: "Multi-Brand", domain: "buygiftcards.online", color: "#991b1b", type: "egift", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], badge: "HOLIDAY PICK", description: "Spread holiday cheer with one card redeemable at buygiftcards.online/redeem for dozens of favorite holiday shopping, dining, and entertainment brands.", supportsCustomPhoto: true, discountPercent: 5 },
  { slug: "amazon", name: "Amazon", category: "Shopping", domain: "amazon.com", color: "#ff9900", type: "egift", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], badge: "TOP GIFT", description: "Millions of items to choose from on Amazon.com." },
  { slug: "starbucks", name: "Starbucks", category: "Food & Drink", domain: "starbucks.com", color: "#00704a", type: "both", min: 10, max: 100, denominations: [10, 15, 25, 50, 100], badge: "5% OFF", description: "Redeemable at any participating US Starbucks location or via the app.", discountPercent: 5 },
  { slug: "apple", name: "Apple", category: "Tech", domain: "apple.com", color: "#333333", type: "egift", min: 25, max: 500, denominations: [25, 50, 100, 200], description: "App Store, Apple Music, iCloud+, Apple TV+, accessories, and more." },
  { slug: "doordash", name: "DoorDash", category: "Food & Drink", domain: "doordash.com", color: "#ff3008", type: "egift", min: 15, max: 500, denominations: [20, 50, 100], description: "Restaurants and more, delivered to their door.", discountPercent: 5 },
  { slug: "nike", name: "Nike", category: "Fashion", domain: "nike.com", color: "#111111", type: "both", min: 25, max: 250, denominations: [25, 50, 100, 150, 250], description: "Redeemable at Nike stores, Nike.com, and the Nike app.", discountPercent: 5 },
  { slug: "netflix", name: "Netflix", category: "Entertainment", domain: "netflix.com", color: "#e50914", type: "egift", min: 25, max: 200, denominations: [25, 50, 100], description: "Apply to any Netflix subscription plan." },
  { slug: "target", name: "Target", category: "Shopping", domain: "target.com", color: "#cc0000", type: "both", min: 10, max: 500, denominations: [25, 50, 75, 100, 200], badge: "HOLIDAY HIT", description: "Redeemable at any Target store nationwide or on Target.com." },
  { slug: "uber", name: "Uber", category: "Travel", domain: "uber.com", color: "#000000", type: "egift", min: 15, max: 200, denominations: [15, 25, 50, 100], description: "For rides and Uber Eats." },
  { slug: "steam", name: "Steam", category: "Gaming", domain: "store.steampowered.com", color: "#1b2838", type: "egift", min: 10, max: 100, denominations: [10, 20, 50, 100], description: "Redeemable on Steam for games, DLC, and in-game items." },
  { slug: "spotify", name: "Spotify", category: "Entertainment", domain: "spotify.com", color: "#1db954", type: "egift", min: 10, max: 60, denominations: [10, 30, 60], description: "Apply to Spotify Premium." },
  { slug: "chipotle", name: "Chipotle", category: "Food & Drink", domain: "chipotle.com", color: "#441500", type: "both", min: 10, max: 250, denominations: [10, 25, 50, 100], description: "Burritos, bowls, tacos, and salads." },
  { slug: "airbnb", name: "Airbnb", category: "Travel", domain: "airbnb.com", color: "#ff5a5f", type: "egift", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Stays and experiences worldwide.", discountPercent: 5 },
  { slug: "walmart", name: "Walmart", category: "Shopping", domain: "walmart.com", color: "#0071ce", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200], description: "Redeemable at any Walmart store or on Walmart.com." },
  { slug: "homedepot", name: "Home Depot", category: "Home", domain: "homedepot.com", color: "#f96302", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Tools, materials, and more." },
  { slug: "sephora", name: "Sephora", category: "Fashion", domain: "sephora.com", color: "#000000", type: "egift", min: 10, max: 250, denominations: [10, 25, 50, 75, 100, 250], description: "Prestige cosmetics, skincare, fragrance, and hair care.", discountPercent: 5 },
  { slug: "panera", name: "Panera Bread", category: "Food & Drink", domain: "panerabread.com", color: "#4e7c32", type: "both", min: 10, max: 200, denominations: [15, 25, 50, 100], description: "Fresh-baked breads, soups, salads, and sandwiches.", discountPercent: 10 },
  { slug: "xbox", name: "Xbox", category: "Gaming", domain: "xbox.com", color: "#107c10", type: "egift", min: 10, max: 100, denominations: [10, 15, 25, 50, 100], description: "Games, add-ons, devices, and more.", discountPercent: 5 },
  { slug: "ikea", name: "IKEA", category: "Home", domain: "ikea.com", color: "#0058a3", type: "egift", min: 10, max: 500, denominations: [25, 50, 100, 250, 500], description: "Redeemable at any US IKEA store or IKEA.com." },
  { slug: "ubereats", name: "Uber Eats", category: "Food & Drink", domain: "ubereats.com", color: "#06c167", type: "egift", min: 15, max: 200, denominations: [15, 25, 50, 100], description: "Food delivery from favorite local restaurants." },
  { slug: "googleplay", name: "Google Play", category: "Tech", domain: "play.google.com", color: "#4285f4", type: "egift", min: 10, max: 200, denominations: [10, 25, 50, 75, 100], description: "Apps, games, music, movies, books, and more." },
  { slug: "lowes", name: "Lowe's", category: "Home", domain: "lowes.com", color: "#004990", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Home improvement made easy.", discountPercent: 5 },
  { slug: "adidas", name: "Adidas", category: "Fashion", domain: "adidas.com", color: "#000000", type: "egift", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Shoes, clothing, and accessories.", discountPercent: 10 },

  // Gas & Auto
  { slug: "shell", name: "Shell", category: "Gas & Auto", domain: "shell.com", color: "#dd1d21", type: "both", min: 10, max: 300, denominations: [10, 15, 25, 50, 100, 200, 300], description: "Fuel, snacks, and essentials at Shell stations nationwide." },
  { slug: "marathon", name: "Marathon", category: "Gas & Auto", domain: "marathonpetroleum.com", color: "#00843d", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Redeemable at participating Marathon gas stations." },
  { slug: "chevron", name: "Chevron / Texaco", category: "Gas & Auto", domain: "chevron.com", color: "#0055a4", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Fuel and convenience items at Chevron and Texaco stations." },
  { slug: "autozone", name: "AutoZone", category: "Gas & Auto", domain: "autozone.com", color: "#d52b1e", type: "both", min: 20, max: 200, denominations: [20, 50, 100, 200], description: "Auto parts, tools, and accessories." },
  { slug: "advanceautoparts", name: "Advance Auto Parts", category: "Gas & Auto", domain: "advanceautoparts.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Auto parts and accessories, in store or online." },
  { slug: "jiffylube", name: "Jiffy Lube", category: "Gas & Auto", domain: "jiffylube.com", color: "#003da5", type: "both", min: 25, max: 300, denominations: [25, 50, 100, 300], description: "Oil changes and routine vehicle maintenance." },
  { slug: "circlek", name: "Circle K", category: "Gas & Auto", domain: "circlek.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Fuel and snacks at Circle K convenience stores." },
  { slug: "arco", name: "ARCO", category: "Gas & Auto", domain: "arco.com", color: "#ee3124", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Redeemable at participating ARCO fuel stations." },
  { slug: "irvingoil", name: "Irving Oil", category: "Gas & Auto", domain: "irvingoil.com", color: "#00558c", type: "both", min: 20, max: 500, denominations: [25, 50, 100, 200, 500], description: "Fuel and convenience items at Irving Oil stations." },
  { slug: "gulfoil", name: "Gulf Oil", category: "Gas & Auto", domain: "gulfoil.com", color: "#f47920", type: "both", min: 50, max: 50, denominations: [50], description: "Redeemable at participating Gulf fuel stations." },
  { slug: "tirediscounters", name: "Tire Discounters", category: "Gas & Auto", domain: "tirediscounters.com", color: "#e4002b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Tires and vehicle service." },
  { slug: "caseys", name: "Casey's General Store", category: "Gas & Auto", domain: "caseys.com", color: "#e4002b", type: "both", min: 10, max: 200, denominations: [10, 25, 50, 100, 200], description: "Fuel, pizza, and convenience-store essentials." },

  // Grocery
  { slug: "topsmarkets", name: "Tops Markets", category: "Grocery", domain: "topsmarkets.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Groceries at Tops Markets locations." },
  { slug: "giantco", name: "The Giant Company", category: "Grocery", domain: "giantfoodstores.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Groceries at Giant Food Stores and Martin's." },
  { slug: "giantfood", name: "Giant Food", category: "Grocery", domain: "giantfood.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Groceries at Giant Food supermarkets." },
  { slug: "stopandshop", name: "Stop & Shop", category: "Grocery", domain: "stopandshop.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Groceries at Stop & Shop supermarkets." },
  { slug: "cvspharmacy", name: "CVS Pharmacy", category: "Grocery", domain: "cvs.com", color: "#cc0000", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Pharmacy, health, and everyday essentials." },

  // Shopping
  { slug: "bathbodyworks", name: "Bath & Body Works", category: "Shopping", domain: "bathandbodyworks.com", color: "#0f2e5e", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Fragrances, candles, and body care." },
  { slug: "bloomingdales", name: "Bloomingdale's", category: "Shopping", domain: "bloomingdales.com", color: "#000000", type: "both", min: 25, max: 200, denominations: [25, 50, 100, 200], description: "Designer fashion, beauty, and home goods." },
  { slug: "ultabeauty", name: "Ulta Beauty", category: "Beauty", domain: "ulta.com", color: "#e6007e", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Cosmetics, skincare, and salon services." },
  { slug: "kohls", name: "Kohl's", category: "Shopping", domain: "kohls.com", color: "#004b8d", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Apparel, home, and everyday essentials." },
  { slug: "saks", name: "Saks Fifth Avenue", category: "Shopping", domain: "saksfifthavenue.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Luxury fashion, beauty, and accessories." },
  { slug: "macys", name: "Macy's", category: "Shopping", domain: "macys.com", color: "#e21a2c", type: "both", min: 25, max: 200, denominations: [25, 50, 100, 200], description: "Apparel, home, and beauty at Macy's." },
  { slug: "staples", name: "Staples", category: "Shopping", domain: "staples.com", color: "#cc0000", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Office supplies, tech, and printing services." },
  { slug: "containerstore", name: "The Container Store", category: "Home", domain: "containerstore.com", color: "#00558c", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Storage and organization solutions." },
  { slug: "totalwine", name: "Total Wine & More", category: "Shopping", domain: "totalwine.com", color: "#7a1f2b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Wine, beer, and spirits." },
  { slug: "onestopplus", name: "OneStopPlus", category: "Fashion", domain: "onestopplus.com", color: "#000000", type: "both", min: 20, max: 250, denominations: [25, 50, 100, 250], description: "Plus-size apparel from multiple brands." },
  { slug: "jcpenney", name: "JCPenney", category: "Shopping", domain: "jcpenney.com", color: "#e4002b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Apparel, home, and beauty at JCPenney." },
  { slug: "shutterfly", name: "Shutterfly", category: "Shopping", domain: "shutterfly.com", color: "#4fb14d", type: "egift", min: 15, max: 100, denominations: [15, 25, 50, 100], description: "Custom photo books, prints, and gifts." },
  { slug: "groupon", name: "Groupon", category: "Shopping", domain: "groupon.com", color: "#53a318", type: "both", min: 15, max: 200, denominations: [15, 25, 50, 100, 200], description: "Local deals on dining, activities, and more." },
  { slug: "wayfair", name: "Wayfair", category: "Home", domain: "wayfair.com", color: "#7f187f", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Furniture and home goods." },
  { slug: "crateandbarrel", name: "Crate & Barrel", category: "Home", domain: "crateandbarrel.com", color: "#000000", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Modern furniture and home decor." },
  { slug: "yankeecandle", name: "Yankee Candle", category: "Home", domain: "yankeecandle.com", color: "#000000", type: "both", min: 20, max: 500, denominations: [25, 50, 100, 200, 500], description: "Candles and home fragrance." },

  // Fashion
  { slug: "underarmour", name: "Under Armour", category: "Fashion", domain: "underarmour.com", color: "#111111", type: "both", min: 15, max: 500, denominations: [15, 25, 50, 100, 200, 500], description: "Athletic apparel, footwear, and gear." },
  { slug: "gamestop", name: "GameStop", category: "Gaming", domain: "gamestop.com", color: "#d0021b", type: "both", min: 5, max: 500, denominations: [5, 10, 25, 50, 75, 100, 200, 500], description: "Video games, consoles, and accessories." },
  { slug: "hottopic", name: "Hot Topic", category: "Fashion", domain: "hottopic.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Pop-culture apparel and accessories." },
  { slug: "llbean", name: "L.L.Bean", category: "Fashion", domain: "llbean.com", color: "#00693e", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Outdoor apparel and gear." },
  { slug: "dsw", name: "DSW", category: "Fashion", domain: "dsw.com", color: "#e4002b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Shoes for the whole family." },
  { slug: "dillards", name: "Dillard's", category: "Shopping", domain: "dillards.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Apparel, beauty, and home at Dillard's." },
  { slug: "childrensplace", name: "The Children's Place", category: "Kids", domain: "childrensplace.com", color: "#e4002b", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Kids' and baby apparel." },
  { slug: "torrid", name: "Torrid", category: "Fashion", domain: "torrid.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Plus-size women's fashion." },
  { slug: "untuckit", name: "UNTUCKit", category: "Fashion", domain: "untuckit.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Shirts designed to be worn untucked." },
  { slug: "raybans", name: "Ray-Ban", category: "Fashion", domain: "ray-ban.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Sunglasses and eyewear." },
  { slug: "footlocker", name: "Foot Locker", category: "Fashion", domain: "footlocker.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Sneakers and athletic apparel." },
  { slug: "finishline", name: "Finish Line", category: "Fashion", domain: "finishline.com", color: "#000000", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Sneakers and athletic apparel." },
  { slug: "chicos", name: "Chico's", category: "Fashion", domain: "chicos.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Women's apparel and accessories." },
  { slug: "talbots", name: "Talbots", category: "Fashion", domain: "talbots.com", color: "#000000", type: "both", min: 25, max: 25, denominations: [25], description: "Classic women's apparel." },
  { slug: "guess", name: "Guess", category: "Fashion", domain: "guess.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Apparel, denim, and accessories." },
  { slug: "boscovs", name: "Boscov's", category: "Shopping", domain: "boscovs.com", color: "#e4002b", type: "both", min: 15, max: 250, denominations: [25, 50, 100, 250], description: "Department store apparel and home goods." },
  { slug: "aeo", name: "American Eagle Outfitters", category: "Fashion", domain: "ae.com", color: "#002d5b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Casual apparel and denim." },
  { slug: "aerie", name: "Aerie", category: "Fashion", domain: "ae.com", color: "#ff5b77", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Intimates and loungewear from American Eagle's sister brand." },
  { slug: "aeropostale", name: "Aeropostale", category: "Fashion", domain: "aeropostale.com", color: "#000000", type: "both", min: 15, max: 250, denominations: [25, 50, 100, 250], description: "Casual apparel for teens." },
  { slug: "lanebryant", name: "Lane Bryant", category: "Fashion", domain: "lanebryant.com", color: "#000000", type: "both", min: 15, max: 200, denominations: [25, 50, 100, 200], description: "Plus-size women's fashion." },
  { slug: "pacsun", name: "PacSun", category: "Fashion", domain: "pacsun.com", color: "#000000", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Streetwear and denim for teens." },
  { slug: "carters", name: "Carter's / OshKosh B'gosh", category: "Kids", domain: "carters.com", color: "#0093d0", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Baby and kids' apparel." },
  { slug: "landsend", name: "Lands' End", category: "Fashion", domain: "landsend.com", color: "#00263a", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Classic apparel and outerwear." },
  { slug: "guitarcenter", name: "Guitar Center", category: "Shopping", domain: "guitarcenter.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Musical instruments and gear." },
  { slug: "sunglasshut", name: "Sunglass Hut", category: "Fashion", domain: "sunglasshut.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Sunglasses from top brands." },
  { slug: "stitchfix", name: "Stitch Fix", category: "Fashion", domain: "stitchfix.com", color: "#000000", type: "egift", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Personal styling, delivered to your door." },
  { slug: "hibbettsports", name: "Hibbett Sports", category: "Fashion", domain: "hibbett.com", color: "#e4002b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Athletic footwear and apparel." },

  // Beauty
  { slug: "sallybeauty", name: "Sally Beauty", category: "Beauty", domain: "sallybeauty.com", color: "#000000", type: "both", min: 25, max: 100, denominations: [25, 50, 100], description: "Hair color and beauty supplies." },

  // Food & Drink
  { slug: "mcdonalds", name: "McDonald's", category: "Food & Drink", domain: "mcdonalds.com", color: "#da291c", type: "both", min: 10, max: 150, denominations: [10, 25, 50, 100, 150], description: "Redeemable at participating McDonald's restaurants." },
  { slug: "subway", name: "Subway", category: "Food & Drink", domain: "subway.com", color: "#008938", type: "both", min: 20, max: 100, denominations: [20, 25, 50, 100], description: "Sandwiches, salads, and wraps." },
  { slug: "darden", name: "Darden Restaurants", category: "Food & Drink", domain: "darden.com", color: "#4c7c2b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "One card for Olive Garden, LongHorn, and other Darden brands." },
  { slug: "pizzahut", name: "Pizza Hut", category: "Food & Drink", domain: "pizzahut.com", color: "#ee3831", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Pizza, wings, and pasta." },
  { slug: "dominos", name: "Domino's", category: "Food & Drink", domain: "dominos.com", color: "#0078ae", type: "both", min: 15, max: 100, denominations: [15, 25, 50, 100], description: "Pizza delivery and carryout." },
  { slug: "cheesecakefactory", name: "The Cheesecake Factory", category: "Food & Drink", domain: "thecheesecakefactory.com", color: "#6b3fa0", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "An extensive menu, plus legendary cheesecake." },
  { slug: "redrobin", name: "Red Robin", category: "Food & Drink", domain: "redrobin.com", color: "#c8102e", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Gourmet burgers and bottomless fries." },
  { slug: "peets", name: "Peet's Coffee", category: "Food & Drink", domain: "peets.com", color: "#582c1c", type: "both", min: 15, max: 200, denominations: [15, 25, 50, 100, 200], description: "Coffee and tea, roasted fresh." },
  { slug: "bjsrestaurants", name: "BJ's Restaurants", category: "Food & Drink", domain: "bjsrestaurants.com", color: "#e21937", type: "both", min: 15, max: 200, denominations: [25, 50, 100, 200], description: "Craft beer, deep-dish pizza, and Pizookie." },
  { slug: "firehousesubs", name: "Firehouse Subs", category: "Food & Drink", domain: "firehousesubs.com", color: "#a6192e", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Hot subs, firehouse-style." },
  { slug: "wendys", name: "Wendy's", category: "Food & Drink", domain: "wendys.com", color: "#e2231a", type: "both", min: 20, max: 100, denominations: [20, 25, 50, 100], description: "Fresh, never frozen beef burgers." },
  { slug: "chilis", name: "Chili's", category: "Food & Drink", domain: "chilis.com", color: "#a6192e", type: "both", min: 15, max: 100, denominations: [15, 25, 50, 100], description: "Bold flavors and Tex-Mex favorites." },
  { slug: "grubhub", name: "Grubhub", category: "Food & Drink", domain: "grubhub.com", color: "#f63440", type: "egift", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Food delivery from local restaurants." },
  { slug: "steaknshake", name: "Steak 'n Shake", category: "Food & Drink", domain: "steaknshake.com", color: "#e4002b", type: "both", min: 15, max: 200, denominations: [15, 25, 50, 100, 200], description: "Burgers and hand-dipped milkshakes." },
  { slug: "arbys", name: "Arby's", category: "Food & Drink", domain: "arbys.com", color: "#c8102e", type: "both", min: 15, max: 100, denominations: [15, 25, 50, 100], description: "We have the meats." },
  { slug: "krispykreme", name: "Krispy Kreme", category: "Food & Drink", domain: "krispykreme.com", color: "#00a651", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Doughnuts and coffee." },
  { slug: "ihop", name: "IHOP", category: "Food & Drink", domain: "ihop.com", color: "#0033a0", type: "both", min: 15, max: 200, denominations: [25, 50, 100, 200], description: "Pancakes and breakfast, anytime." },
  { slug: "olivegarden", name: "Olive Garden", category: "Food & Drink", domain: "olivegarden.com", color: "#4c7c2b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Italian dining, family-style." },
  { slug: "outback", name: "Outback Steakhouse", category: "Food & Drink", domain: "outback.com", color: "#e4002b", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Steaks and Aussie-inspired dishes." },
  { slug: "bobevans", name: "Bob Evans", category: "Food & Drink", domain: "bobevans.com", color: "#0066b3", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Farm-fresh comfort food." },
  { slug: "applebees", name: "Applebee's", category: "Food & Drink", domain: "applebees.com", color: "#a6192e", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Casual dining and bar favorites." },
  { slug: "jackinthebox", name: "Jack in the Box", category: "Food & Drink", domain: "jackinthebox.com", color: "#e4002b", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Burgers, tacos, and late-night eats." },
  { slug: "redlobster", name: "Red Lobster", category: "Food & Drink", domain: "redlobster.com", color: "#c8102e", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Seafood dining." },
  { slug: "larosas", name: "LaRosa's Family Pizzerias", category: "Food & Drink", domain: "larosas.com", color: "#c8102e", type: "both", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Family-style pizza and Italian food." },
  { slug: "papamurphys", name: "Papa Murphy's", category: "Food & Drink", domain: "papamurphys.com", color: "#ef3e42", type: "both", min: 15, max: 250, denominations: [25, 50, 100, 250], description: "Take-and-bake pizza." },
  { slug: "burgerking", name: "Burger King", category: "Food & Drink", domain: "bk.com", color: "#d62300", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Home of the Whopper." },
  { slug: "rockymountainchocolate", name: "Rocky Mountain Chocolate Factory", category: "Food & Drink", domain: "rmcf.com", color: "#5c2e1f", type: "egift", min: 25, max: 25, denominations: [25], description: "Handcrafted chocolates and confections." },
  { slug: "planetsmoothie", name: "Planet Smoothie", category: "Food & Drink", domain: "planetsmoothie.com", color: "#f57e20", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Smoothies made to order." },
  { slug: "macaronigrill", name: "Romano's Macaroni Grill", category: "Food & Drink", domain: "macaronigrill.com", color: "#7a1f2b", type: "both", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Italian-American dining." },
  { slug: "dennys", name: "Denny's", category: "Food & Drink", domain: "dennys.com", color: "#e4002b", type: "both", min: 10, max: 100, denominations: [10, 25, 50, 100], description: "Diner classics, open late." },
  { slug: "cpk", name: "California Pizza Kitchen", category: "Food & Drink", domain: "cpk.com", color: "#00543d", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "California-style pizza and salads." },
  { slug: "blackangus", name: "Black Angus Steakhouse", category: "Food & Drink", domain: "blackangus.com", color: "#000000", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Steakhouse dining." },
  { slug: "benihana", name: "Benihana", category: "Food & Drink", domain: "benihana.com", color: "#c8102e", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Japanese hibachi dining." },
  { slug: "sweetfrog", name: "Sweetfrog", category: "Food & Drink", domain: "sweetfrog.com", color: "#ec008c", type: "both", min: 20, max: 200, denominations: [20, 25, 50, 100, 200], description: "Self-serve frozen yogurt." },
  { slug: "jerseymikes", name: "Jersey Mike's", category: "Food & Drink", domain: "jerseymikes.com", color: "#00843d", type: "both", min: 20, max: 200, denominations: [20, 25, 50, 100, 200], description: "Fresh sliced subs." },
  { slug: "coldstonecreamery", name: "Cold Stone Creamery", category: "Food & Drink", domain: "coldstonecreamery.com", color: "#6a1b3a", type: "both", min: 15, max: 100, denominations: [15, 25, 50, 100], description: "Ice cream, made fresh on a frozen stone." },
  { slug: "bajafresh", name: "Baja Fresh", category: "Food & Drink", domain: "bajafresh.com", color: "#e4002b", type: "both", min: 15, max: 100, denominations: [15, 25, 50, 100], description: "Fresh-Mex burritos and tacos." },
  { slug: "chuys", name: "Chuy's", category: "Food & Drink", domain: "chuys.com", color: "#00843d", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Tex-Mex with a side of fun." },
  { slug: "bubbagump", name: "Bubba Gump Shrimp Co.", category: "Food & Drink", domain: "bubbagump.com", color: "#e4002b", type: "both", min: 20, max: 200, denominations: [20, 25, 50, 100, 200], description: "Seafood dining, Forrest Gump-inspired." },
  { slug: "carrabbas", name: "Carrabba's Italian Grill", category: "Food & Drink", domain: "carrabbas.com", color: "#7a1f2b", type: "both", min: 20, max: 250, denominations: [25, 50, 100, 250], description: "Italian dining, family recipes." },
  { slug: "popeyes", name: "Popeyes", category: "Food & Drink", domain: "popeyes.com", color: "#a6192e", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Louisiana-style fried chicken." },
  { slug: "bahamabreeze", name: "Bahama Breeze", category: "Food & Drink", domain: "bahamabreeze.com", color: "#00843d", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Caribbean-inspired island dining." },
  { slug: "lucillesbbq", name: "Lucille's Smokehouse Bar-B-Que", category: "Food & Drink", domain: "lucillesbbq.com", color: "#7a1f2b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Slow-smoked barbecue." },
  { slug: "rubytuesday", name: "Ruby Tuesday", category: "Food & Drink", domain: "rubytuesday.com", color: "#e4002b", type: "both", min: 25, max: 25, denominations: [25], description: "American casual dining." },
  { slug: "cheddars", name: "Cheddar's Scratch Kitchen", category: "Food & Drink", domain: "cheddars.com", color: "#7a1f2b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Scratch-made comfort food." },
  { slug: "seasons52", name: "Seasons 52", category: "Food & Drink", domain: "seasons52.com", color: "#4c7c2b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Seasonally inspired, lighter dining." },
  { slug: "longhornsteakhouse", name: "LongHorn Steakhouse", category: "Food & Drink", domain: "longhornsteakhouse.com", color: "#7a1f2b", type: "both", min: 10, max: 250, denominations: [25, 50, 100, 250], description: "Bold, expertly grilled steaks." },
  { slug: "omahasteaks", name: "Omaha Steaks", category: "Food & Drink", domain: "omahasteaks.com", color: "#7a1f2b", type: "both", min: 20, max: 500, denominations: [25, 50, 100, 200, 500], description: "Premium steaks and gourmet foods, delivered." },
  { slug: "bibibop", name: "BIBIBOP Asian Grill", category: "Food & Drink", domain: "bibibop.com", color: "#e4002b", type: "both", min: 20, max: 100, denominations: [20, 25, 50, 100], description: "Build-your-own Korean-inspired bowls." },
  { slug: "buffalowildwings", name: "Buffalo Wild Wings", category: "Food & Drink", domain: "buffalowildwings.com", color: "#000000", type: "both", min: 15, max: 200, denominations: [25, 50, 100, 200], description: "Wings, beer, and sports on the big screen." },
  { slug: "jasonsdeli", name: "Jason's Deli", category: "Food & Drink", domain: "jasonsdeli.com", color: "#00843d", type: "both", min: 25, max: 25, denominations: [25], description: "Deli sandwiches, soups, and salads." },

  // Travel & Hotel
  { slug: "southwest", name: "Southwest Airlines", category: "Travel", domain: "southwest.com", color: "#304cb2", type: "egift", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Flights across the Southwest network." },
  { slug: "amtrak", name: "Amtrak", category: "Travel", domain: "amtrak.com", color: "#013c6a", type: "egift", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Train travel across the US." },
  { slug: "marriott", name: "Marriott", category: "Travel", domain: "marriott.com", color: "#a70e29", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Stays across the Marriott portfolio." },
  { slug: "mgmresorts", name: "MGM Resorts", category: "Travel", domain: "mgmresorts.com", color: "#b8860b", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Stays, dining, and shows at MGM Resorts destinations." },
  { slug: "goldennugget", name: "Golden Nugget Hotel & Casino", category: "Travel", domain: "goldennugget.com", color: "#c5a253", type: "both", min: 50, max: 200, denominations: [50, 100, 200], description: "Stays and dining at Golden Nugget properties." },

  // Entertainment
  { slug: "amctheatres", name: "AMC Theatres", category: "Entertainment", domain: "amctheatres.com", color: "#d4202c", type: "both", min: 15, max: 100, denominations: [15, 25, 50, 100], description: "Movie tickets and concessions." },
  { slug: "regal", name: "Regal Cinemas", category: "Entertainment", domain: "regmovies.com", color: "#000000", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Movie tickets and concessions." },
  { slug: "cinemark", name: "Cinemark", category: "Entertainment", domain: "cinemark.com", color: "#8a1538", type: "both", min: 20, max: 250, denominations: [25, 50, 100, 250], description: "Movie tickets and concessions." },
  { slug: "emagine", name: "Emagine Theaters", category: "Entertainment", domain: "emagine-entertainment.com", color: "#e4002b", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Movie tickets and premium theater experiences." },
  { slug: "chuckecheese", name: "Chuck E. Cheese", category: "Entertainment", domain: "chuckecheese.com", color: "#e4002b", type: "both", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Games, pizza, and family fun." },
  { slug: "playstation", name: "Sony PlayStation Store", category: "Gaming", domain: "playstation.com", color: "#003791", type: "egift", min: 10, max: 100, denominations: [10, 25, 50, 75, 100], description: "Games, DLC, and subscriptions on PlayStation Store." },
  { slug: "golfnow", name: "GolfNow", category: "Entertainment", domain: "golfnow.com", color: "#003057", type: "egift", min: 25, max: 250, denominations: [25, 50, 100, 250], description: "Tee times at courses nationwide." },
  { slug: "spafinder", name: "Spafinder", category: "Beauty", domain: "spafinder.com", color: "#7a1f2b", type: "egift", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Spa and wellness experiences nationwide." },
  { slug: "buildabear", name: "Build-A-Bear", category: "Kids", domain: "buildabear.com", color: "#ec008c", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Make-your-own stuffed animals." },
  { slug: "fanatics", name: "Fanatics", category: "Shopping", domain: "fanatics.com", color: "#0f4d92", type: "egift", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Officially licensed sports gear and jerseys." },

  // Sports & Outdoors
  { slug: "rei", name: "REI", category: "Sports & Outdoors", domain: "rei.com", color: "#004c3f", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Outdoor gear and apparel." },
  { slug: "basspro", name: "Bass Pro Shops", category: "Sports & Outdoors", domain: "basspro.com", color: "#8a0303", type: "both", min: 20, max: 500, denominations: [25, 50, 100, 200, 500], description: "Fishing, hunting, and outdoor gear." },
  { slug: "academysports", name: "Academy Sports + Outdoors", category: "Sports & Outdoors", domain: "academy.com", color: "#00563f", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Sporting goods and outdoor gear." },
  { slug: "petco", name: "Petco", category: "Home", domain: "petco.com", color: "#d2202e", type: "both", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Pet food, supplies, and services." },
  { slug: "petsmart", name: "PetSmart", category: "Home", domain: "petsmart.com", color: "#003057", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Pet food, supplies, and grooming." },
  { slug: "chewy", name: "Chewy", category: "Home", domain: "chewy.com", color: "#1a6ba9", type: "egift", min: 10, max: 500, denominations: [25, 50, 100, 200, 500], description: "Pet food and supplies, delivered." },
  { slug: "barnesnoble", name: "Barnes & Noble", category: "Shopping", domain: "barnesandnoble.com", color: "#066938", type: "both", min: 15, max: 500, denominations: [25, 50, 100, 200, 500], description: "Books, toys, and gifts." },
  { slug: "michaels", name: "Michaels", category: "Home", domain: "michaels.com", color: "#dd0031", type: "both", min: 50, max: 50, denominations: [50], description: "Arts, crafts, and hobby supplies." },
  { slug: "pandaexpress", name: "Panda Express", category: "Food & Drink", domain: "pandaexpress.com", color: "#d2232a", type: "both", min: 25, max: 100, denominations: [25, 50, 100], description: "American Chinese favorites." },
  { slug: "belk", name: "Belk", category: "Shopping", domain: "belk.com", color: "#005baa", type: "both", min: 25, max: 200, denominations: [25, 50, 100, 200], description: "Apparel, home, and beauty at Belk." },
  { slug: "gap", name: "Gap", category: "Fashion", domain: "gap.com", color: "#002f6c", type: "both", min: 25, max: 500, denominations: [25, 50, 100, 200, 500], description: "Casual apparel for the whole family." },
  { slug: "hellofresh", name: "HelloFresh", category: "Food & Drink", domain: "hellofresh.com", color: "#99cc33", type: "egift", min: 61, max: 61, denominations: [61], description: "Meal kits delivered to your door." },

  // Additional Zendit US Catalog Brands (Live Voucher & eGift Fulfillment)
  { slug: "disney", name: "Disney", category: "Entertainment", domain: "disney.com", color: "#113ccf", type: "egift", min: 15, max: 500, denominations: [15, 25, 50, 100, 200, 500], badge: "FAMILY FAVORITE", description: "Redeemable at Disney store, shopDisney.com, Disney+, and Walt Disney World® & Disneyland® Resorts." },
  { slug: "dunkin", name: "Dunkin'", category: "Food & Drink", domain: "dunkindonuts.com", color: "#ff671f", type: "egift", min: 5, max: 50, denominations: [5, 10, 25, 50], badge: "POPULAR", description: "Coffee, espresso, donuts, and breakfast sandwiches at participating Dunkin' locations." },
  { slug: "oldnavy", name: "Old Navy", category: "Fashion", domain: "oldnavy.gap.com", color: "#003764", type: "egift", min: 25, max: 100, denominations: [25, 50, 75, 100], description: "Must-have fashion and everyday essentials for the whole family at Old Navy." },
  { slug: "burlington", name: "Burlington", category: "Shopping", domain: "burlington.com", color: "#cc0000", type: "egift", min: 25, max: 100, denominations: [25, 50, 75, 100], description: "Deals on brand-name apparel, shoes, coats, and home decor at Burlington stores." },
  { slug: "albertsons", name: "Albertsons", category: "Grocery", domain: "albertsons.com", color: "#005da6", type: "egift", min: 5, max: 50, denominations: [5, 10, 25, 50], description: "Fresh groceries, bakery, deli, and pharmacy essentials at Albertsons supermarkets." },
  { slug: "conoco", name: "Conoco", category: "Gas & Auto", domain: "conoco.com", color: "#e4002b", type: "egift", min: 5, max: 50, denominations: [5, 10, 25, 50], description: "Fuel, snacks, and road-trip essentials at participating Conoco stations." },
  { slug: "fortnite", name: "Fortnite V-Bucks", category: "Gaming", domain: "fortnite.com", color: "#2a0e61", type: "egift", min: 25, max: 150, denominations: [25, 50, 75, 100, 150], badge: "GAMER PICK", description: "Redeem for Fortnite V-Bucks to unlock Battle Passes, outfits, emotes, and item shop bundles." },
  { slug: "minecraft", name: "Minecraft", category: "Gaming", domain: "minecraft.net", color: "#3c8527", type: "egift", min: 10, max: 27, denominations: [10, 20, 27], description: "Redeem for Minecraft Minecoins, add-ons, worlds, or Minecraft Java & Bedrock Edition." },
  { slug: "eaplay", name: "EA Play", category: "Gaming", domain: "ea.com", color: "#ff4747", type: "egift", min: 15, max: 25, denominations: [15, 25], description: "Unlock EA Play membership benefits, trials, and a library of top Electronic Arts titles." },
  { slug: "razergold", name: "Razer Gold", category: "Gaming", domain: "razer.com", color: "#44d62c", type: "egift", min: 10, max: 200, denominations: [10, 25, 50, 75, 100, 150, 200], description: "The unified virtual credit for gamers across 42,000+ games and entertainment titles." },
  { slug: "pubg", name: "PUBG Mobile UC", category: "Gaming", domain: "pubg.com", color: "#f2a900", type: "egift", min: 5, max: 500, denominations: [5, 10, 25, 50, 100, 200, 300, 400, 500], description: "Redeem for Unknown Cash (UC) in PUBG Mobile for Royale Passes, crates, and skins." },
  { slug: "freefire", name: "Garena Free Fire", category: "Gaming", domain: "ff.garena.com", color: "#ff5500", type: "egift", min: 5, max: 20, denominations: [5, 10, 20], description: "Redeem for Free Fire Diamonds to unlock characters, weapon skins, and Elite Passes." },
  { slug: "mobilelegends", name: "Mobile Legends Diamonds", category: "Gaming", domain: "mobilelegends.com", color: "#1e3a8a", type: "egift", min: 5, max: 100, denominations: [5, 10, 20, 30, 50, 100], description: "Top up Mobile Legends: Bang Bang Diamonds for heroes, skins, and Starlight memberships." },
  { slug: "gatorade", name: "Gatorade", category: "Sports & Outdoors", domain: "gatorade.com", color: "#ff5b00", type: "egift", min: 25, max: 100, denominations: [25, 50, 100], description: "Sports fuel, bottles, equipment, and custom gear on Gatorade.com." },
  { slug: "zwilling", name: "Zwilling J.A. Henckels", category: "Home", domain: "zwilling.com", color: "#d5001c", type: "egift", min: 25, max: 200, denominations: [25, 50, 75, 100, 150, 200], description: "Premium kitchen knives, Staub cast iron cookware, and culinary tools." },
  { slug: "integralcare", name: "Integral Care", category: "Beauty", domain: "zendit.io", color: "#0284c7", type: "egift", min: 30, max: 230, denominations: [30, 80, 139, 230], description: "Digital healthcare, telehealth, and wellness membership plans." },
];

export const CATEGORIES = [...new Set(BRANDS.map((b) => b.category))].sort();

export function getBrand(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug);
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
  return `https://img.logo.dev/${domain}?token=${token}&size=${size}&retina=true`;
}

/** Validates a requested amount is one this brand actually sells, at the server. */
export function isValidDenomination(brand: Brand, amountCents: number): boolean {
  const dollars = amountCents / 100;
  if (brand.denominations.includes(dollars)) return true;
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
