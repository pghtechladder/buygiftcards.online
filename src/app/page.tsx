import { PromoBanner } from "@/components/PromoBanner";
import { Hero } from "@/components/Hero";
import { CategoryStrip } from "@/components/CategoryStrip";
import { BrandGrid } from "@/components/BrandGrid";
import { BrandLogoStrip } from "@/components/BrandLogoStrip";
import { PromoTiles } from "@/components/PromoTiles";
import { BRANDS } from "@/lib/brands";

const dining = BRANDS.filter((b) => b.category === "Food & Drink").slice(0, 10);
const travel = BRANDS.filter((b) => b.category === "Travel");
const bestBrands = BRANDS.slice(0, 16);
const featured = BRANDS.slice(20, 30);

export default function HomePage() {
  return (
    <>
      <PromoBanner />
      <Hero />
      <CategoryStrip />
      <BrandGrid items={BRANDS.slice(0, 10)} title="Most popular" />
      <PromoTiles />
      <BrandGrid items={dining} title="Dining gift cards" />
      <BrandGrid items={travel} title="Travel gift cards" />
      <BrandLogoStrip items={bestBrands} title="Shop the best brands" />
      <BrandGrid items={featured} title="Featured gift cards" />
    </>
  );
}
