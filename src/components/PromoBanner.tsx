"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type Slide = {
  eyebrow: string;
  title: string;
  copy: string;
  ctaLabel: string;
  ctaHref: string;
  icon: "zap" | "package" | "gift" | "lock" | "shield";
};

// Rotating marketing messages only — no discount percentages here. Every
// claim below is a real, always-true feature of the storefront; if a real
// promo (e.g. a brand-specific discount) is added to brands.ts later, add a
// slide for it here rather than hardcoding a number that could go stale.
const SLIDES: Slide[] = [
  {
    eyebrow: "Labor Day Weekend",
    title: "Gift cards for the long weekend",
    copy: "Browse 165+ brands and send one in minutes — no lines, no waiting on shipping.",
    ctaLabel: "Shop All Brands",
    ctaHref: "/catalog",
    icon: "gift",
  },
  {
    eyebrow: "New",
    title: "Put your own photo on a Visa gift card",
    copy: "Upload a picture and we print it right on the card face — a gift that's actually personal.",
    ctaLabel: "Design a Card",
    ctaHref: "/product/visa",
    icon: "package",
  },
  {
    eyebrow: "For Teams",
    title: "Buying for the whole office?",
    copy: "Bulk orders, invoicing, and volume pricing for corporate and team gifting.",
    ctaLabel: "Get a Quote",
    ctaHref: "/business",
    icon: "shield",
  },
  {
    eyebrow: "Always On",
    title: "Instant delivery, every order",
    copy: "Secure Stripe checkout, and your gift card lands by email in minutes — not days.",
    ctaLabel: "Start Shopping",
    ctaHref: "/catalog",
    icon: "zap",
  },
];

const INTERVAL_MS = 5500;

export function PromoBanner() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  const go = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];

  return (
    <div
      className="relative bg-ink-950 text-white overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* subtle brand-colored glow, purely decorative */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(600px circle at 15% 50%, rgba(26,173,125,0.25), transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
        <button
          aria-label="Previous offer"
          onClick={() => go(index - 1)}
          className="hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full border border-white/15 items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition"
        >
          <Icon name="chevronRight" size={14} className="rotate-180" />
        </button>

        <div key={index} className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-2 animate-[promoFade_.4s_ease]">
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center">
            <Icon name={slide.icon} size={17} />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-400 mr-2">{slide.eyebrow}</span>
            <span className="font-bold text-sm sm:text-[15px]">{slide.title}</span>
            <span className="hidden md:inline text-white/60 text-sm ml-2">{slide.copy}</span>
          </div>
          <Link
            href={slide.ctaHref}
            className="ml-auto flex-shrink-0 inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 text-ink-950 text-xs font-extrabold px-4 py-2 rounded-full transition whitespace-nowrap"
          >
            {slide.ctaLabel}
            <Icon name="chevronRight" size={12} />
          </Link>
        </div>

        <button
          aria-label="Next offer"
          onClick={() => go(index + 1)}
          className="hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full border border-white/15 items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition"
        >
          <Icon name="chevronRight" size={14} />
        </button>
      </div>

      <div className="relative flex items-center justify-center gap-1.5 pb-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            aria-label={`Go to offer ${i + 1}`}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-accent-500" : "w-1.5 bg-white/25 hover:bg-white/40"}`}
          />
        ))}
      </div>

      <style>{`@keyframes promoFade { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
