import type { Metadata } from "next";
import { BrandGrid } from "@/components/BrandGrid";
import { BRANDS, getBrandsForCountry, getCategoriesForCountry } from "@/lib/brands";
import { getServerCountry } from "@/lib/server-country";
import { getCurrencySymbol } from "@/lib/country-config";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; category?: string; price?: string; deals?: string }>;
}): Promise<Metadata> {
  const { q, type, category, deals } = await searchParams;
  const siteUrl = "https://buygiftcards.online";
  if (q) {
    return {
      title: `Search "${q}" Gift Cards`,
      robots: { index: false, follow: true },
    };
  }
  if (category) {
    const title = `Buy ${category} Gift Cards Online`;
    const description = `Buy ${category.toLowerCase()} digital gift cards and eGift cards online with instant email delivery, $0 purchase fees, and secure checkout at buygiftcards.online.`;
    const url = `${siteUrl}/catalog?category=${encodeURIComponent(category)}`;
    return {
      title,
      description,
      robots: { index: true, follow: true },
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website", images: [`${siteUrl}/logo-full.png`] },
    };
  }
  if (deals === "1") {
    const title = "Buy Discounted Gift Cards Online";
    const description = "Buy discounted digital gift cards online and save up to 15% automatically at checkout while receiving 100% full face value via instant email delivery.";
    const url = `${siteUrl}/deals`;
    return {
      title,
      description,
      robots: { index: true, follow: true },
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website", images: [`${siteUrl}/logo-full.png`] },
    };
  }
  if (type === "egift") {
    const title = "Buy Instant eGift Cards Online";
    const description = `Browse ${BRANDS.length}+ instant digital eGift cards delivered by email within minutes. Zero purchase fees on retail brands at buygiftcards.online.`;
    const url = `${siteUrl}/catalog?type=egift`;
    return {
      title,
      description,
      robots: { index: true, follow: true },
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website", images: [`${siteUrl}/logo-full.png`] },
    };
  }
  const title = `All ${BRANDS.length}+ Digital & Physical Gift Cards`;
  const description = `Browse our complete catalog of ${BRANDS.length}+ digital gift cards and instant eGift cards. Filter by category, price, or instant discounts at buygiftcards.online.`;
  const url = `${siteUrl}/catalog`;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: [`${siteUrl}/logo-full.png`] },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; category?: string; price?: string; deals?: string }>;
}) {
  const { q, type, category, price, deals } = await searchParams;
  const country = await getServerCountry();
  const activeBrands = getBrandsForCountry(country);
  const activeCategories = getCategoriesForCountry(country);
  const currencySym = getCurrencySymbol(country);
  let items = activeBrands;

  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (b) =>
        b.name.toLowerCase().includes(needle) ||
        b.category.toLowerCase().includes(needle) ||
        b.description.toLowerCase().includes(needle)
    );
  }
  if (type === "egift") items = items.filter((b) => b.type !== "physical");
  if (type === "physical") items = items.filter((b) => b.type === "both" || b.type === "physical");
  if (category) items = items.filter((b) => b.category === category);
  if (deals === "1") items = items.filter((b) => Boolean(b.discountPercent));
  if (price === "under25") items = items.filter((b) => b.min <= 25);
  if (price === "under50") items = items.filter((b) => b.min <= 50);

  const title = q
    ? `Results for "${q}" (${items.length})`
    : category
    ? `Buy ${category} Gift Cards Online (${items.length})`
    : deals === "1"
    ? `Buy Discounted Gift Cards Online (${items.length})`
    : type === "egift"
    ? `Buy Instant eGift Cards Online (${items.length})`
    : type === "physical"
    ? `Buy Physical Gift Cards Online (${items.length})`
    : `Buy Gift Cards Online — All ${items.length} Brands`;

  const leadText = category
    ? `Buy ${category.toLowerCase()} gift cards online with instant digital email delivery and ${currencySym}0 purchase fees.`
    : deals === "1"
    ? "Buy discounted gift cards online and save automatically at checkout while receiving 100% full face value."
    : `Buy gift cards online from ${activeBrands.length}+ official retail, dining, gaming, and prepaid brands with instant email delivery.`;

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = { q, type, category, price, deals, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Filter Header */}
      <div className="bg-white border border-ink-100 rounded-3xl p-6 mb-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">{title}</h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {leadText}
            </p>
          </div>
          {(q || type || category || price || deals) && (
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink-50 hover:bg-ink-100 text-xs font-bold text-ink-700 transition"
            >
              <Icon name="x" size={13} /> Clear Filters
            </Link>
          )}
        </div>

        {/* Format & Offer Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink-50">
          <span className="text-xs font-bold text-ink-400 uppercase mr-1">Format:</span>
          {[
            { label: "All Formats", val: undefined },
            { label: "⚡ eGift Cards", val: "egift" },
            { label: "📦 Physical Cards", val: "physical" },
          ].map((f) => (
            <Link
              key={f.label}
              href={buildHref({ type: f.val })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
                type === f.val || (!type && !f.val)
                  ? "bg-ink-950 text-white border-ink-950"
                  : "border-ink-100 text-ink-600 hover:border-brand-300"
              }`}
            >
              {f.label}
            </Link>
          ))}

          <span className="text-xs font-bold text-ink-400 uppercase ml-3 mr-1">Offers:</span>
          <Link
            href={buildHref({ deals: deals === "1" ? undefined : "1" })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
              deals === "1"
                ? "bg-accent-500 text-ink-950 border-accent-500"
                : "border-ink-100 text-ink-600 hover:border-accent-400"
            }`}
          >
            🏷️ On Sale / Discounted
          </Link>
          <Link
            href={buildHref({ price: price === "under25" ? undefined : "under25" })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
              price === "under25"
                ? "bg-brand-600 text-white border-brand-600"
                : "border-ink-100 text-ink-600 hover:border-brand-300"
            }`}
          >
            🎄 Under {currencySym}25 (Stocking Stuffers)
          </Link>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap pt-2 border-t border-ink-50">
          <Link
            href={buildHref({ category: undefined })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              !category ? "bg-brand-600 text-white border-brand-600" : "border-ink-100 text-ink-600 hover:border-brand-300"
            }`}
          >
            All Categories
          </Link>
          {activeCategories.map((c) => (
            <Link
              key={c}
              href={buildHref({ category: category === c ? undefined : c })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                category === c
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-ink-100 text-ink-600 hover:border-brand-300"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      <BrandGrid items={items} country={country} />
    </div>
  );
}
