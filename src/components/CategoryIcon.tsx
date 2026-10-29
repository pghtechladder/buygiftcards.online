// Colorful category icons for the "Shop by category" row. These are flat
// emoji-style SVGs (Microsoft Fluent Emoji, MIT-licensed) bundled locally in
// /public/category so they always render with no external dependency. Keyed
// by the exact category strings in src/lib/brands.ts (CATEGORIES).

const CATEGORY_FILE: Record<string, string> = {
  Beauty: "beauty",
  Entertainment: "entertainment",
  Fashion: "fashion",
  "Food & Drink": "food-drink",
  Gaming: "gaming",
  "Gas & Auto": "gas-auto",
  Grocery: "grocery",
  Home: "home",
  Kids: "kids",
  Mastercard: "mastercard",
  "Multi-Brand": "shopping",
  Shopping: "shopping",
  "Sports & Outdoors": "sports-outdoors",
  Tech: "tech",
  Travel: "travel",
  Visa: "visa",
};

export function CategoryIcon({ name, size = 32 }: { name: string; size?: number }) {
  const file = CATEGORY_FILE[name];
  if (!file) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/category/${file}.svg`}
      alt={`${name} icon`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="flex-shrink-0"
    />
  );
}
