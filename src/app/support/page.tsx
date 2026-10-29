import { Icon } from "@/components/Icon";
import { SupportForm } from "@/components/SupportForm";
import Link from "next/link";

const FAQS = [
  {
    q: "How quickly are eGift cards delivered?",
    a: "Digital eGift cards and Giftbit claim links are generated immediately upon Stripe payment confirmation and delivered both on your Order Detail page and via email within 1–2 minutes.",
  },
  {
    q: "How do I redeem a Giftbit Direct Claim Link?",
    a: "Click 'Reveal Claim Link' on your order page (or the button in your confirmation email), then click 'Claim Gift Card'. You'll be taken directly to the secure Giftbit reward portal to access your barcode, card number, or PIN.",
  },
  {
    q: "Can I send a gift card directly to someone else for the holidays?",
    a: "Yes! On any product page, select 'Send as a Gift', choose a festive Holiday card design, enter your recipient's name, email, and a personal message. We will email them their gift card notification directly.",
  },
  {
    q: "Do gift cards expire or have hidden fees?",
    a: "Merchant gift cards sold on buygiftcards.online carry $0 purchase fees and the underlying retail gift card funds never expire. Promotional or corporate claim links must be claimed within 12 months of issuance.",
  },
  {
    q: "How do I check my remaining card balance?",
    a: "Visit our Check Balance page (/balance) to look up your order credentials or connect directly to the official balance portal for Visa, Mastercard, Amazon, Starbucks, Target, Walmart, and more.",
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="messageCircle" size={26} className="text-brand-600" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Help Center &amp; Customer Support</h1>
        <p className="text-sm text-ink-600">
          Browse answers to common questions below, use our self-service tools, or send a message directly to our support inbox.
        </p>
      </div>

      {/* Quick Self-Service Links */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Link href="/track-order" className="bg-white border border-ink-100 rounded-2xl p-5 hover:border-brand-300 transition flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <Icon name="package" size={18} />
          </div>
          <div>
            <div className="font-extrabold text-sm">Track an Order</div>
            <div className="text-xs text-ink-500">Find your codes or claim links</div>
          </div>
        </Link>
        <Link href="/balance" className="bg-white border border-ink-100 rounded-2xl p-5 hover:border-brand-300 transition flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <Icon name="wallet" size={18} />
          </div>
          <div>
            <div className="font-extrabold text-sm">Check Balance</div>
            <div className="text-xs text-ink-500">Verify card status &amp; funds</div>
          </div>
        </Link>
        <Link href="/activate" className="bg-white border border-ink-100 rounded-2xl p-5 hover:border-brand-300 transition flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <Icon name="shield" size={18} />
          </div>
          <div>
            <div className="font-extrabold text-sm">Activate Physical Card</div>
            <div className="text-xs text-ink-500">Confirm receipt in the mail</div>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-extrabold mb-3">Frequently Asked Questions</h2>
          {FAQS.map((f) => (
            <div key={f.q} className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm mb-1.5 text-ink-900">{f.q}</h3>
              <p className="text-xs text-ink-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white border border-ink-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold mb-1">Contact Our Team</h2>
          <p className="text-xs text-ink-500 mb-6">
            Messages are routed directly to <span className="font-semibold text-ink-700">support@buygiftcards.online</span>.
          </p>
          <SupportForm />
        </div>
      </div>
    </div>
  );
}
