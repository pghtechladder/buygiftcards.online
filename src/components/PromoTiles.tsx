import Link from "next/link";
import { Icon, IconName } from "./Icon";

const TILES: { icon: IconName; title: string; copy: string; ctaLabel: string; href: string; accent: string }[] = [
  {
    icon: "package",
    title: "Visa gift card options",
    copy: "Choose a preset design, or upload your own photo and we'll put it right on the card face.",
    ctaLabel: "Personalize a Visa Card",
    href: "/product/visa",
    accent: "#1a1f71",
  },
  {
    icon: "mail",
    title: "Send by email, instantly",
    copy: "No shipping, no waiting — checkout with Stripe and the gift card lands in their inbox in minutes.",
    ctaLabel: "Shop eGift Cards",
    href: "/catalog?type=egift",
    accent: "#0f8c66",
  },
  {
    icon: "shield",
    title: "Gift cards for business",
    copy: "Bulk orders and invoicing for employee rewards, client gifts, and corporate programs.",
    ctaLabel: "Get a Business Quote",
    href: "/business",
    accent: "#0d6f54",
  },
];

export function PromoTiles() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid sm:grid-cols-3 gap-5">
        {TILES.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className="rounded-2xl bg-ink-950 text-white p-6 flex flex-col hover:-translate-y-1 hover:shadow-xl transition"
          >
            <span
              className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
              style={{ background: `${t.accent}33`, color: t.accent === "#1a1f71" ? "#9ba3f5" : "#4ade80" }}
            >
              <Icon name={t.icon} size={20} />
            </span>
            <div className="font-bold text-base mb-2">{t.title}</div>
            <p className="text-sm text-white/80 leading-relaxed flex-1">{t.copy}</p>
            <span className="mt-4 text-sm font-bold text-accent-400 flex items-center gap-1.5">
              {t.ctaLabel}
              <Icon name="chevronRight" size={13} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
