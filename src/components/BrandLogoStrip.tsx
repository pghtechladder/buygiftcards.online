import Link from "next/link";
import { Brand } from "@/lib/brands";
import { BrandLogo } from "./BrandLogo";

export function BrandLogoStrip({ items, title }: { items: Brand[]; title?: string }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-5">
        {title && <h2 className="text-2xl font-extrabold">{title}</h2>}
        <Link href="/catalog" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition">
          See all &rarr;
        </Link>
      </div>
      <div className="flex flex-wrap gap-4">
        {items.map((b) => (
          <Link
            key={b.slug}
            href={`/product/${b.slug}`}
            title={b.name}
            className="w-20 h-20 rounded-2xl border border-ink-100 bg-white flex items-center justify-center hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 transition"
          >
            <BrandLogo domain={b.domain} name={b.name} size={44} radius={10} />
          </Link>
        ))}
      </div>
    </div>
  );
}
