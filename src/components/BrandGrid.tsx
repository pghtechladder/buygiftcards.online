import Link from "next/link";
import { Brand } from "@/lib/brands";
import { BrandLogo } from "./BrandLogo";

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function BrandGrid({ items, title }: { items: Brand[]; title?: string }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {title && <h2 className="text-2xl font-extrabold mb-5">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {items.map((b) => (
          <Link
            key={b.slug}
            href={`/product/${b.slug}`}
            className="bg-white border border-ink-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 transition relative flex flex-col"
          >
            {b.badge && !b.badge.includes("%") && (
              <span className="absolute top-3 left-3 z-10 bg-white/95 text-ink-900 text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow">
                {b.badge}
              </span>
            )}
            <div
              className="h-32 flex items-center justify-center relative"
              style={{ background: `linear-gradient(150deg, ${b.color}, ${b.color}cc)` }}
            >
              <BrandLogo domain={b.domain} name={b.name} size={68} radius={14} bg="rgba(255,255,255,0.96)" />
              {!!b.discountPercent && (
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-accent-500 text-ink-950 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                  {b.discountPercent}% OFF
                </span>
              )}
            </div>
            <div className={`bg-ink-950 text-white px-4 pb-3 flex-1 flex flex-col justify-center ${b.discountPercent ? "pt-5" : "pt-3"}`}>
              <div className="font-bold text-sm leading-tight mb-1 line-clamp-2">{b.name}</div>
              <div className="text-white/80 text-xs font-semibold">
                {b.discountPercent ? (
                  <>
                    <span className="line-through text-white/75 mr-1.5">{fmt(b.min)}</span>
                    From {fmt(Math.round(b.min * (1 - b.discountPercent / 100) * 100) / 100)}
                  </>
                ) : (
                  <>{fmt(b.min)} – {fmt(b.max)}</>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {items.length === 0 && <div className="text-center py-16 text-ink-400">No gift cards found.</div>}
    </div>
  );
}
