import Link from "next/link";
import { CATEGORIES } from "@/lib/brands";

// Same color system as the brand tiles (brand green / accent orange / ink),
// just cycled per category so the row reads as one family of colors rather
// than a random rainbow.
const PALETTE = ["#0f8c66", "#1aad7d", "#0d6f54", "#ff9f1c", "#0c5844", "#3fc99a"];

export function CategoryStrip() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-extrabold mb-5">Shop by category</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {CATEGORIES.map((c, i) => (
          <Link
            key={c}
            href={`/catalog?category=${encodeURIComponent(c)}`}
            className="flex flex-col items-center gap-2 flex-shrink-0 w-20 group"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-sm group-hover:-translate-y-1 group-hover:shadow-lg transition"
              style={{ background: PALETTE[i % PALETTE.length] }}
            >
              {c.charAt(0)}
            </div>
            <span className="text-[11px] font-semibold text-ink-600 text-center leading-tight group-hover:text-brand-600 transition">
              {c}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
