import Link from "next/link";
import { getCategoriesForCountry } from "@/lib/brands";
import { CountryCode, resolveCountryFromHostOrEnv } from "@/lib/country-config";
import { CategoryIcon } from "./CategoryIcon";

export function CategoryStrip({ country = resolveCountryFromHostOrEnv() }: { country?: CountryCode }) {
  const categories = getCategoriesForCountry(country);
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-extrabold mb-5">Shop by category</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map((c) => (
          <Link
            key={c}
            href={`/catalog?category=${encodeURIComponent(c)}`}
            className="flex flex-col items-center gap-2 flex-shrink-0 w-20 group"
          >
            <div className="w-16 h-16 rounded-full bg-white border border-ink-100 flex items-center justify-center shadow-sm group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-brand-200 transition">
              <CategoryIcon name={c} size={34} />
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
