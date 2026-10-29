import Link from "next/link";
import { Icon } from "@/components/Icon";

const TIPS = [
  {
    title: "Never pay bills, taxes, or bail with a gift card",
    body: "No legitimate government agency (IRS, Social Security), utility provider, tech support company, or employer will ever ask you to pay a fee or debt using gift cards.",
  },
  {
    title: "Keep your claim links and PINs private",
    body: "Treat your digital claim URLs and 16-digit card numbers like cash. Anyone who sees your revealed code or Giftbit claim link can redeem the balance immediately.",
  },
  {
    title: "Verify the website URL before entering card numbers",
    body: "Only check balances or activate cards on official merchant portals or directly here on buygiftcards.online/balance. Avoid third-party 'balance checker' sites found on search engines.",
  },
  {
    title: "Inspect physical packaging upon delivery",
    body: "If you order a physical card and the security scratch-off strip or tamper-evident packaging appears altered, contact our support team before using the card.",
  },
];

export default function GiftSafePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-brand-900 to-brand-700 text-white p-8 sm:p-12 mb-10 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
          <Icon name="shield" size={24} className="text-amber-300" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Gift Safe: Consumer Fraud Protection</h1>
        <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-2xl">
          Gift cards are meant for celebrating friends, family, and colleagues — never for making demanded payments.
          Learn how to spot common gift card scams and protect your purchases.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        {TIPS.map((t) => (
          <div key={t.title} className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-brand-700 font-extrabold text-sm mb-2">
              <Icon name="checkCircle" size={16} />
              {t.title}
            </div>
            <p className="text-xs text-ink-600 leading-relaxed">{t.body}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-extrabold text-amber-950 mb-1">Suspect fraud or need help with an order?</h2>
          <p className="text-xs text-amber-900 leading-relaxed max-w-xl">
            Report suspected scams to the Federal Trade Commission at{" "}
            <a href="https://ReportFraud.ftc.gov" target="_blank" rel="noopener noreferrer" className="underline font-bold">
              ReportFraud.ftc.gov
            </a>{" "}
            and reach out to our support team immediately with your order number.
          </p>
        </div>
        <Link
          href="/support"
          className="px-6 py-3 rounded-xl bg-ink-950 text-white text-xs font-extrabold hover:bg-ink-800 transition flex-shrink-0"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

