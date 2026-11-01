import { Icon } from "@/components/Icon";
import { SupportForm } from "@/components/SupportForm";
import Link from "next/link";

const FAQS = [
  {
    q: "How quickly are eGift cards delivered?",
    a: "Digital eGift cards are generated immediately upon PayPal / card payment confirmation and delivered both on your Order Detail page and via email within 1–2 minutes.",
  },
  {
    q: "How do I redeem my digital gift card or voucher?",
    a: "Click 'Reveal Claim Link' or 'Show Code' on your order confirmation page (or the link in your email). You will see your card number, PIN, or direct brand claim instructions.",
  },
  {
    q: "Can I send a gift card directly to someone else for the holidays?",
    a: "Yes! On any product page, select 'Send as a Gift', choose a festive Holiday card design, enter your recipient's name, email, and a personal message. We will email them their gift card notification directly.",
  },
  {
    q: "Do gift cards expire or have hidden fees?",
    a: "Merchant gift cards sold on buygiftcards.online carry $0 purchase fees and the underlying retail gift card funds never expire.",
  },
  {
    q: "How do I check my remaining card balance?",
    a: "Visit our Check Balance page (/balance) to look up your order credentials or connect directly to the official balance portal for Visa, Mastercard, Amazon, Starbucks, Target, Walmart, and more.",
  },
];

export default function SupportPage() {
  const whatsappUrl = `/api/chat/whatsapp?text=${encodeURIComponent(
    "Hello support team! I need assistance with my gift card order."
  )}`;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="messageCircle" size={26} className="text-brand-600" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Help Center &amp; Customer Support</h1>
        <p className="text-sm text-ink-600">
          Browse answers to common questions below, use our self-service tools, chat with our instant AI assistant, or message our live support team on WhatsApp.
        </p>
      </div>

      {/* WhatsApp Immediate Support Banner */}
      <div className="mb-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 2C6.516 2 2.031 6.484 2.031 12c0 1.945.556 3.766 1.522 5.309L2 22l4.858-1.517A9.94 9.94 0 0 0 12.031 22c5.516 0 10-4.484 10-10s-4.484-10-10-10zm0 18.25c-1.636 0-3.176-.46-4.502-1.258l-.323-.193-2.887.901.918-2.812-.211-.334A8.196 8.196 0 0 1 3.781 12c0-4.551 3.699-8.25 8.25-8.25s8.25 3.699 8.25 8.25-3.699 8.25-8.25 8.25zm4.516-6.195c-.247-.123-1.464-.723-1.691-.806-.227-.083-.393-.123-.559.123-.166.246-.643.806-.788.971-.144.166-.289.185-.536.062s-1.047-.386-1.994-1.231c-.737-.657-1.235-1.469-1.38-1.716s-.015-.38.108-.503c.111-.111.247-.289.37-.433s.166-.247.248-.412c.083-.166.041-.309-.021-.433s-.559-1.347-.765-1.844c-.201-.484-.405-.418-.559-.426l-.476-.008c-.166 0-.434.062-.661.309s-.868.848-.868 2.069.889 2.4 1.013 2.565c.124.165 1.75 2.673 4.238 3.748.592.256 1.054.409 1.414.524.594.189 1.135.162 1.563.098.477-.071 1.464-.599 1.671-1.176.207-.577.207-1.072.144-1.176-.062-.103-.227-.165-.474-.288z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl">Instant WhatsApp Live Support</span>
              <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Online Now
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-50 mt-1">
              Have questions about your order, delivery, or payment? Connect with our support team for an immediate reply.
            </p>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 transition font-extrabold px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2.5 text-sm"
        >
          <span>Chat on WhatsApp</span>
          <span className="text-base">↗</span>
        </a>
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
          <h2 className="text-xl font-extrabold mb-1">Email Our Team</h2>
          <p className="text-xs text-ink-500 mb-6">
            Messages are routed directly to <span className="font-semibold text-ink-700">support@buygiftcards.online</span>.
          </p>
          <SupportForm />
        </div>
      </div>
    </div>
  );
}
