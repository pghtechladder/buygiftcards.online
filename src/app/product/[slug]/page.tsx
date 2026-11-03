import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brands";
import { ProductDetail } from "@/components/ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand || brand.hidden) notFound();
  return <ProductDetail brand={brand} />;
}
