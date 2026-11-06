import Image from "next/image";
import Link from "next/link";
import { VisitorCounter } from "./VisitorCounter";

const COLUMNS = [
  {
    title: "Shop Gift Cards",
    links: [
      ["All Gift Cards (165+)", "/catalog"],
      ["BuyGiftCards.online Card", "/product/buygiftcards"],
      ["Visa® Gift Cards", "/product/visa"],
      ["Mastercard® Gift Cards", "/product/mastercard"],
      ["One4all Multi-Brand", "/product/one4all"],
      ["eGift Cards (Instant)", "/catalog?type=egift"],
      ["Physical Gift Cards", "/catalog?type=physical"],
    ],
  },
  {
    title: "Holidays & Occasions",
    links: [
      ["🎄 Holiday Gift Guide", "/occasions?occasion=holidays"],
      ["Deals & Discounts", "/deals"],
      ["Birthday Gift Cards", "/occasions?occasion=birthday"],
      ["Thank You Gifts", "/occasions?occasion=thank-you"],
      ["Wedding & Anniversary", "/occasions?occasion=wedding"],
      ["Group Gifting", "/group-gifts"],
    ],
  },
  {
    title: "Manage & Self-Service",
    links: [
      ["Redeem a Gift Card", "/redeem"],
      ["Track Your Order", "/track-order"],
      ["Check Card Balance", "/balance"],
      ["Activate a Card", "/activate"],
      ["Corporate & Bulk Orders", "/business"],
      ["My Account", "/account"],
      ["Support & FAQ", "/support"],
    ],
  },
  {
    title: "Company & Trust",
    links: [
      ["About Us", "/about"],
      ["Customer Reviews (Trustpilot)", "https://www.trustpilot.com/review/buygiftcards.online"],
      ["Gift Safe Security", "/gift-safe"],
      ["Terms of Use", "/terms"],
      ["Privacy Policy", "/privacy"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-950 text-white/80 mt-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white rounded-lg p-1">
              <Image src="/logo-mark-512.png" alt="BuyGiftCards.online" width={28} height={28} className="rounded" />
            </div>
            <span className="text-white font-extrabold">buygiftcards.online</span>
          </div>
          <p className="text-xs leading-relaxed text-white/75 mb-4">
            Your trusted digital &amp; physical gift card marketplace. Shop 165+ top retail, dining, travel, and
            entertainment brands with instant email delivery and secure Credit/Debit Card or PayPal checkout.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-amber-300 font-semibold">
            🎄 Holiday Season Ready
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="text-white text-xs font-bold uppercase tracking-wider mb-4">{col.title}</div>
            {col.links.map(([label, href]) => (
              <Link key={label} href={href} className="block text-sm text-white/80 mb-2.5 hover:text-white transition">
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-6 py-6 text-xs text-center text-white/75 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-3">
        <div>
          © {new Date().getFullYear()} buygiftcards.online. All rights reserved. All merchant trademarks and logos are the property of their respective owners.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/analytics" className="hover:text-white transition">Retail Analytics</Link>
          <Link href="/gift-safe" className="hover:text-white transition">Gift Safe</Link>
          <Link href="/terms" className="hover:text-white transition">Terms</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          <VisitorCounter />
        </div>
      </div>
    </footer>
  );
}
