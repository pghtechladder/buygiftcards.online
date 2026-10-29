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
  holiday?: boolean;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "🎄 Holiday Gift Guide",
    title: "Festive eGift Cards & Stocking Stuffers",
    copy: "Send holiday cheer in minutes with custom holiday card designs, personal messages, and instant delivery.",
    ctaLabel: "Shop Holiday Gifts",
    ctaHref: "/occasions?occasion=holidays",
    icon: "gift",
    holiday: true,
  },
  {
    eyebrow: "✨ Holiday Deals",
    title: "Save up to 10% on top brands this season",
    copy: "Instant discounts on Starbucks, DoorDash, Nike, Panera Bread, Sephora, Adidas, and Multi-Brand cards.",
    ctaLabel: "View All Deals",
    ctaHref: "/deals",
    icon: "zap",
    holiday: true,
  },
  {
    eyebrow: "Custom Photo Card",
    title: "Put your favorite holiday photo on a Visa® or Mastercard®",
    copy: "Upload a family picture and create a personalized holiday gift card they will always remember.",
    ctaLabel: "Design a Card",
    ctaHref: "/product/visa",
    icon: "package",
  },
  {
    eyebrow: "Corporate Holiday Gifting",
    title: "Reward your entire team or client list",
    copy: "Bulk holiday orders, multi-brand choice links, and custom invoicing for teams of any size.",
    ctaLabel: "Get a Business Quote",
    ctaHref: "/business",
    icon: "shield",
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
      className={`relative text-white overflow-hidden transition-colors duration-500 ${
        slide.holiday ? "bg-gradient-to-r from-[#5c0f14] via-[#7f1d1d] to-[#0a4738]" : "bg-ink-950"
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(600px circle at 15% 50%, rgba(251,191,36,0.22), transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-3.5 flex items-center gap-4">
        <button
          aria-label="Previous offer"
          onClick={() => go(index - 1)}
          className="hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full border border-white/20 items-center justify-center text-white/70 hover:text-white hover:border-white/50 transition"
        >
          <Icon name="chevronRight" size={14} className="rotate-180" />
        </button>

        <div key={index} className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-2 animate-[promoFade_.4s_ease]">
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-white/15 text-amber-300 flex items-center justify-center">
            <Icon name={slide.icon} size={17} />
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300 mr-2.5">{slide.eyebrow}</span>
            <span className="font-bold text-sm sm:text-[15px]">{slide.title}</span>
            <span className="hidden lg:inline text-white/75 text-sm ml-2">{slide.copy}</span>
          </div>
          <Link
            href={slide.ctaHref}
            className="ml-auto flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-extrabold px-4 py-2 rounded-full transition whitespace-nowrap shadow"
          >
            {slide.ctaLabel}
            <Icon name="chevronRight" size={12} />
          </Link>
        </div>

        <button
          aria-label="Next offer"
          onClick={() => go(index + 1)}
          className="hidden sm:flex flex-shrink-0 w-8 h-8 rounded-full border border-white/20 items-center justify-center text-white/70 hover:text-white hover:border-white/50 transition"
        >
          <Icon name="chevronRight" size={14} />
        </button>
      </div>

      <div className="relative flex items-center justify-center gap-1.5 pb-2.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            aria-label={`Go to offer ${i + 1}`}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-amber-400" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>

      <style>{`@keyframes promoFade { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
