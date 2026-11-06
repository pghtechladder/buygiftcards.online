import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { SupportForm } from "@/components/SupportForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gift Card Help Center, FAQs & Customer Support Desk",
  description:
    "Get fast help with your digital gift card order at buygiftcards.online. Read FAQs on instant email delivery, balance checks, and card redemption, or open a support ticket.",
  alternates: { canonical: "/support" },
};

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
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="messageCircle" size={26} className="text-brand-600" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Help Center &amp; Support Ticket Desk</h1>
        <p className="text-sm text-ink-600">
          Browse common questions below, use our self-service order lookup tools, or submit an official support ticket. All requests are routed directly to <span className="font-semibold text-ink-800">support@buygiftcards.online</span>.
        </p>
      </div>

      {/* Ticket Notification Banner */}
      <div className="mb-10 bg-gradient-to-r from-brand-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl">Have an issue with your order?</span>
              <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Support Desk Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-brand-100 mt-1">
              Submit your ticket with issue details. Our engineering team receives it immediately at <span className="font-bold underline">support@buygiftcards.online</span>.
            </p>
          </div>
        </div>

        <Link
          href="#ticket-form"
          className="flex-shrink-0 bg-white text-brand-700 hover:bg-brand-50 active:scale-95 transition font-extrabold px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2 text-sm"
        >
          <span>Open Ticket</span>
          <span className="text-base">↓</span>
        </Link>
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

        <div id="ticket-form" className="lg:col-span-5 bg-white border border-ink-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold mb-1">Create a Support Ticket</h2>
          <p className="text-xs text-ink-500 mb-6">
            Creates a tracked ticket sent immediately to <span className="font-semibold text-ink-700">support@buygiftcards.online</span>.
          </p>
          <SupportForm />
        </div>
      </div>
    </div>
  );
}
