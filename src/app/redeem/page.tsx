"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getBrandsForCountry, getCategoriesForCountry, getBrand, HOUSE_BRAND_SLUGS, Brand } from "@/lib/brands";
import { CountryCode, formatCurrency, getCurrencyCode, getCurrencySymbol, resolveCountryFromHostOrEnv } from "@/lib/country-config";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";
import { trackRetailEvent } from "@/lib/analytics";

type VerifiedCard = {
  id: string;
  code: string;
  maskedCode: string;
  brandSlug: string;
  brandName: string;
  balanceCents: number;
  customerEmail: string;
  orderNumber: string;
  alreadyRedeemed: boolean;
};

type BasketItem = {
  brand: Brand;
  amountDollars: number;
  quantity: number;
};

type RedemptionResult = {
  orderNumber: string;
  email: string;
  emailSent: boolean;
  emailError?: string;
  sourceBrandName: string;
  sourceCardMasked: string;
  redeemedItems: {
    id: string;
    brandSlug: string;
    brandName: string;
    amountCents: number;
    code: string;
    pin: string;
    isDemo: boolean;
  }[];
  remainingCard?: {
    amountCents: number;
    code: string;
    pin: string;
  };
};

function RedeemPortalContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const initialPin = searchParams.get("pin") || "";

  const [country, setCountry] = useState<CountryCode>(() => resolveCountryFromHostOrEnv());
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCountry(resolveCountryFromHostOrEnv(window.location.host));
    }
  }, []);

  const activeBrands = useMemo(() => getBrandsForCountry(country), [country]);
  const activeCategories = useMemo(() => getCategoriesForCountry(country), [country]);
  const currencySym = getCurrencySymbol(country);
  const currencyCode = getCurrencyCode(country);
  const fmt = (cents: number) => formatCurrency(cents / 100, country);

  const PARTICIPATING_BRANDS = useMemo(
    () => activeBrands.filter((b) => !HOUSE_BRAND_SLUGS.includes(b.slug)),
    [activeBrands]
  );
  const SWAP_CATEGORIES = useMemo(
    () => ["All", ...activeCategories.filter((c) => c !== "Multi-Brand")],
    [activeCategories]
  );

  const [code, setCode] = useState(initialCode);
  const [pin, setPin] = useState(initialPin);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [card, setCard] = useState<VerifiedCard | null>(null);

  // Step 2: Brand Swap Marketplace state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAmounts, setSelectedAmounts] = useState<Record<string, number>>({});
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [exchanging, setExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  // Step 3: Completed Redemption Result
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lookupCard = async (overrideCode?: string, overridePin?: string) => {
    const c = (overrideCode ?? code).trim();
    const p = (overridePin ?? pin).trim();
    if (!c) return;

    setVerifying(true);
    setVerifyError(null);
    setResult(null);

    try {
      const res = await fetch("/api/redeem/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, pin: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not verify card.");
      }
      setCard(data.card);
      setDeliveryEmail(data.card.customerEmail || "");
      setBasket([]);
      trackRetailEvent("redeem_lookup", {
        brand_slug: data.card?.brandSlug,
        balance_dollars: (data.card?.balanceCents || 0) / 100,
      });
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      lookupCard(initialCode, initialPin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSampleCard = () => {
    const sampleCode = "8888 2026 1225 0100";
    const samplePin = "20261225";
    setCode(sampleCode);
    setPin(samplePin);
    lookupCard(sampleCode, samplePin);
  };

  const selectedCents = useMemo(
    () => basket.reduce((sum, item) => sum + Math.round(item.amountDollars * 100) * item.quantity, 0),
    [basket]
  );

  const remainingCents = card ? Math.max(0, card.balanceCents - selectedCents) : 0;

  const filteredBrands = useMemo(() => {
    return PARTICIPATING_BRANDS.filter((b) => {
      if (selectedCategory !== "All" && b.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [PARTICIPATING_BRANDS, selectedCategory, searchQuery]);

  const getDenomsForBrand = (b: Brand): number[] => {
    const base = b.denominations.length ? b.denominations : [25, 50, 100];
    // Include smaller denominations if allowed by brand.min so users can easily split balances
    const extras = [10, 15, 20, 25, 50, 75, 100].filter((d) => d >= b.min && d <= b.max);
    return Array.from(new Set([...base, ...extras])).sort((a, c) => a - c);
  };

  const getChosenAmount = (b: Brand): number => {
    if (selectedAmounts[b.slug]) return selectedAmounts[b.slug];
    const denoms = getDenomsForBrand(b);
    const maxAffordable = Math.floor(remainingCents / 100);
    const affordable = denoms.filter((d) => d <= maxAffordable);
    if (affordable.length > 0) {
      return affordable[Math.min(1, affordable.length - 1)];
    }
    return denoms[0];
  };

  const addToBasket = (b: Brand) => {
    const amt = getChosenAmount(b);
    const amtCents = Math.round(amt * 100);
    if (amtCents > remainingCents) {
      setExchangeError(
        `Adding a $${amt} ${b.name} card exceeds your remaining balance of ${fmt(remainingCents)}.`
      );
      return;
    }
    setExchangeError(null);
    setBasket((prev) => {
      const idx = prev.findIndex((item) => item.brand.slug === b.slug && item.amountDollars === amt);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { brand: b, amountDollars: amt, quantity: 1 }];
    });
  };

  const removeFromBasket = (index: number) => {
    setExchangeError(null);
    setBasket((prev) => prev.filter((_, i) => i !== index));
  };

  const completeRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || basket.length === 0) return;

    setExchanging(true);
    setExchangeError(null);

    try {
      const res = await fetch("/api/redeem/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card.id,
          code: card.code,
          pin,
          email: deliveryEmail.trim(),
          selections: basket.map((item) => ({
            brandSlug: item.brand.slug,
            amountDollars: item.amountDollars,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Redemption failed.");
      }
      setResult(data);
      trackRetailEvent("redeem_exchange", {
        order_number: data.orderNumber,
        source_brand: data.sourceBrandName,
        redeemed_count: data.redeemedItems?.length || 0,
        value: selectedCents / 100,
        currency: currencyCode,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setExchangeError(err instanceof Error ? err.message : "Could not complete redemption.");
    } finally {
      setExchanging(false);
    }
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1800);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-ink-50/50 pb-20">
      {/* Festive Branded Redemption Banner */}
      <div className="bg-gradient-to-br from-[#0a4738] via-brand-700 to-[#7f1d1d] text-white py-12 px-6 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="max-w-6xl mx-auto relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 mb-4">
              <div className="bg-white rounded-md p-0.5 flex items-center justify-center">
                <Image src="/logo-mark-512.png" alt="buygiftcards.online" width={20} height={20} className="rounded-sm" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                Official BuyGiftCards.online Redemption Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
              Redeem Your Gift Card for 165+ Top Brands
            </h1>
            <p className="text-white/85 text-sm sm:text-base leading-relaxed">
              Received a <strong>BuyGiftCards.online Gift Card</strong>, <strong>One4all Multi-Brand</strong>, or{" "}
              <strong>Holiday Favorites Card</strong>? Enter your 16-digit card number and PIN to swap or split your
              balance across Amazon, Visa®, Starbucks, Target, Nike, DoorDash, and 160+ more brands!
            </p>
          </div>

          {/* Visual BuyGiftCards.online Card Preview */}
          <div className="w-72 sm:w-80 aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-emerald-950 via-brand-600 to-emerald-800 p-5 shadow-2xl border border-white/30 flex flex-col justify-between relative overflow-hidden flex-shrink-0">
            <div
              className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, #fbbf24, transparent 70%)" }}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white/95 px-2.5 py-1.5 rounded-xl shadow">
                <Image src="/logo-mark-512.png" alt="buygiftcards.online" width={24} height={24} className="rounded" />
                <span className="text-xs font-extrabold text-ink-900">
                  buygiftcards<span className="text-brand-600">.online</span>
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-ink-950 px-2.5 py-1 rounded-full">
                165+ BRANDS
              </span>
            </div>
            <div>
              <div className="font-mono text-xs tracking-widest text-white/80 mb-1">
                {card ? card.maskedCode : "8888 •••• •••• 0100"}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-emerald-200">Redeemable Choice Card</span>
                <span className="text-2xl font-extrabold text-white">
                  {card ? fmt(card.balanceCents) : `${currencySym}10 – ${currencySym}500`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Portal Body */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-10">
        {/* STEP 3: REDEMPTION COMPLETED */}
        {result ? (
          <div className="bg-white border border-ink-100 rounded-3xl p-8 sm:p-10 shadow-xl space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-100 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                  <Icon name="checkCircle" size={30} />
                </div>
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-brand-600 mb-1">
                    Redemption Complete · Order {result.orderNumber}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
                    Your Merchant eGift Cards Are Ready!
                  </h2>
                  <p className="text-sm text-ink-600 mt-1">
                    Swapped from <strong>{result.sourceBrandName}</strong> ({result.sourceCardMasked}) ·{" "}
                    {result.emailSent ? (
                      <span className="text-green-700 font-semibold">
                        Confirmation emailed to {result.email} via Zoho SMTP
                      </span>
                    ) : (
                      <span>Saved to order {result.orderNumber}</span>
                    )}
                  </p>
                </div>
              </div>
              <Link
                href={`/orders/${encodeURIComponent(result.orderNumber)}?email=${encodeURIComponent(result.email)}`}
                className="px-5 py-2.5 rounded-xl bg-ink-900 text-white text-xs font-extrabold hover:bg-ink-800 transition self-start"
              >
                View Full Order &rarr;
              </Link>
            </div>

            {/* Issued Merchant Cards List */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-500">
                Issued Merchant eGift Cards ({result.redeemedItems.length})
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.redeemedItems.map((item) => {
                  const brandObj = getBrand(item.brandSlug, country);
                  const isUrl = /^https?:\/\//i.test(item.code);
                  return (
                    <div
                      key={item.id}
                      className="border-2 border-ink-100 rounded-2xl p-5 bg-ink-50/60 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {brandObj && (
                            <BrandLogo domain={brandObj.domain} name={brandObj.name} size={44} radius={10} bg="#fff" />
                          )}
                          <div>
                            <div className="font-extrabold text-base text-ink-900">{item.brandName}</div>
                            <div className="text-xs text-ink-500">
                              {isUrl ? "Live Zendit Digital Reward Link" : "Instant Zendit eGift Voucher"}
                            </div>
                          </div>
                        </div>
                        <div className="text-xl font-extrabold text-brand-700">{fmt(item.amountCents)}</div>
                      </div>

                      {isUrl ? (
                        <div className="space-y-2 pt-2 border-t border-ink-100">
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={item.code}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-extrabold text-xs hover:bg-brand-700 transition shadow-sm"
                            >
                              <Icon name="gift" size={15} />
                              Claim {fmt(item.amountCents)} {item.brandName} Card &rarr;
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText(item.id, item.code)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-ink-200 text-ink-700 font-bold text-xs hover:bg-ink-100 transition"
                            >
                              <Icon name={copiedId === item.id ? "checkCircle" : "copy"} size={14} />
                              {copiedId === item.id ? "Copied Link" : "Copy Link"}
                            </button>
                          </div>
                          <div className="font-mono text-[11px] text-ink-400 truncate">{item.code}</div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-ink-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="font-mono text-xs font-bold bg-white px-3 py-2 rounded-lg border border-ink-200">
                            Code: {item.code} {item.pin ? `· PIN: ${item.pin}` : ""}
                          </div>
                          <button
                            type="button"
                            onClick={() => copyText(item.id, item.code)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-ink-200 text-xs font-bold hover:bg-ink-100 transition"
                          >
                            <Icon name={copiedId === item.id ? "checkCircle" : "copy"} size={13} />
                            {copiedId === item.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Remaining Balance Card if partial swap */}
            {result.remainingCard && (
              <div className="bg-brand-50 border-2 border-dashed border-brand-400 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-brand-700 mb-1">
                    Remaining Balance Voucher Issued ({fmt(result.remainingCard.amountCents)})
                  </div>
                  <p className="text-xs text-ink-700 mb-2">
                    You didn&apos;t spend your full card balance. Save this new Card Number &amp; PIN to redeem your
                    remaining <strong>{fmt(result.remainingCard.amountCents)}</strong> anytime:
                  </p>
                  <div className="font-mono text-sm font-extrabold text-ink-950 bg-white px-4 py-2.5 rounded-xl border border-brand-200 inline-block">
                    Card #: {result.remainingCard.code} &nbsp;|&nbsp; PIN: {result.remainingCard.pin}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const rem = result.remainingCard!;
                    setCode(rem.code);
                    setPin(rem.pin);
                    setResult(null);
                    lookupCard(rem.code, rem.pin);
                  }}
                  className="px-5 py-3 rounded-xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 transition flex-shrink-0"
                >
                  Redeem Remaining {fmt(result.remainingCard.amountCents)} Now &rarr;
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-ink-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setCard(null);
                  setResult(null);
                  setBasket([]);
                  setCode("");
                  setPin("");
                }}
                className="text-xs font-bold text-ink-600 hover:text-brand-600 transition"
              >
                &larr; Redeem Another Gift Card
              </button>
              <Link href="/catalog" className="text-xs font-extrabold text-brand-600 hover:underline">
                Continue Shopping on buygiftcards.online &rarr;
              </Link>
            </div>
          </div>
        ) : !card ? (
          /* STEP 1: ENTER CARD NUMBER & PIN */
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white border border-ink-100 rounded-3xl p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon name="gift" size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-ink-900">Enter Your Gift Card Credentials</h2>
                  <p className="text-xs text-ink-500">
                    Found in your buygiftcards.online gift email, order page, or back of your card
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  lookupCard();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">
                    16-Digit Card Number / Voucher Code
                  </label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="8888 2026 1225 0100"
                    className="w-full px-4 py-3.5 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:bg-white font-mono text-base tracking-wider transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">
                    8-Digit PIN / Security Code
                  </label>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="20261225"
                    className="w-full px-4 py-3.5 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:bg-white font-mono text-base tracking-wider transition"
                  />
                </div>

                {verifyError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {verifyError}
                  </div>
                )}

                <button
                  disabled={verifying}
                  className="w-full py-4 rounded-xl bg-brand-600 text-white font-extrabold text-sm hover:bg-brand-700 transition shadow-md disabled:opacity-50"
                >
                  {verifying ? "Verifying Card Balance…" : "Check Balance & Choose Brands →"}
                </button>
              </form>

              {/* Need a Card / Track Order helper */}
              <div className="mt-6 pt-6 border-t border-ink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-50/60 p-4 rounded-2xl border border-brand-100">
                <div>
                  <div className="text-xs font-extrabold text-brand-900">Where do I find my Card Number &amp; PIN?</div>
                  <div className="text-[11px] text-brand-700 mt-0.5">
                    Check your <strong>buygiftcards.online</strong> confirmation email or view your codes on your order status page.
                  </div>
                </div>
                <Link
                  href="/orders"
                  className="px-4 py-2.5 rounded-xl bg-white border border-brand-300 text-brand-700 font-extrabold text-xs hover:bg-brand-600 hover:text-white transition flex-shrink-0 shadow-sm text-center"
                >
                  Lookup My Order &rarr;
                </Link>
              </div>
            </div>

            {/* Right Column: How BuyGiftCards.online Redemption Works (Giftcards.com Logic) */}
            <div className="lg:col-span-5 bg-white border border-ink-100 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5">
                <Image src="/logo-mark-512.png" alt="buygiftcards.online" width={28} height={28} className="rounded-lg" />
                <h3 className="text-base font-extrabold text-ink-900">How Gift Card Redemption Works</h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Enter Your Card Number & PIN",
                    desc: "Enter the 16-digit card number and 8-digit PIN from your BuyGiftCards.online Gift Card, One4all, or Holiday Favorites card.",
                  },
                  {
                    step: "2",
                    title: "Mix, Match & Split Across 165+ Brands",
                    desc: "Spend your full balance on a single store (e.g., $100 Amazon) or split it across multiple favorites (e.g., $50 Visa + $25 Walmart + $25 Nike).",
                  },
                  {
                    step: "3",
                    title: "Instant eGift Claim Links & Email Delivery",
                    desc: "We immediately issue your live merchant eGift card claim links on screen and email them to you via Zoho SMTP. Any unused balance stays on a new voucher!",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-ink-900">{item.title}</div>
                      <p className="text-xs text-ink-500 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
                <span>Need to buy a multi-brand card?</span>
                <Link href="/product/buygiftcards" className="font-extrabold text-brand-600 hover:underline">
                  Shop BuyGiftCards.online Card &rarr;
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: INTERACTIVE SWAP & SPLIT BALANCE MARKETPLACE */
          <div className="space-y-6">
            {/* Sticky Balance Allocation Bar */}
            <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-2 border-brand-500 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-brand-50 p-2 rounded-xl border border-brand-100">
                  <Image src="/logo-mark-512.png" alt="buygiftcards.online" width={32} height={32} className="rounded-lg" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-ink-900">{card.brandName}</span>
                    <span className="font-mono text-xs bg-ink-100 text-ink-700 px-2 py-0.5 rounded-md">
                      {card.maskedCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCard(null);
                      setBasket([]);
                    }}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    Change Card
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Available Card Balance</div>
                  <div className="text-lg font-extrabold text-ink-900">{fmt(card.balanceCents)}</div>
                </div>
                <div className="h-8 w-px bg-ink-100 hidden sm:block" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Selected to Swap</div>
                  <div className="text-lg font-extrabold text-brand-600">{fmt(selectedCents)}</div>
                </div>
                <div className="h-8 w-px bg-ink-100 hidden sm:block" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Remaining Balance</div>
                  <div className="text-lg font-extrabold text-amber-600">{fmt(remainingCents)}</div>
                </div>
              </div>
            </div>

            {exchangeError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between">
                <span>{exchangeError}</span>
                <button type="button" onClick={() => setExchangeError(null)} className="text-red-500 hover:text-red-800">
                  ✕
                </button>
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left 8 Cols: Brand Catalog Picker */}
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white border border-ink-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="relative flex-1">
                      <Icon
                        name="search"
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                      />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search 165+ participating brands (Amazon, Visa, Walmart, Nike, Starbucks…)"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-50 border border-ink-100 text-sm outline-none focus:border-brand-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {SWAP_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                          selectedCategory === cat
                            ? "bg-brand-600 text-white"
                            : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Participating Brands Grid */}
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredBrands.map((b) => {
                    const denoms = getDenomsForBrand(b);
                    const chosenAmt = getChosenAmount(b);
                    const canAfford = Math.round(chosenAmt * 100) <= remainingCents;

                    return (
                      <div
                        key={b.slug}
                        className="bg-white border border-ink-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <BrandLogo domain={b.domain} name={b.name} size={42} radius={10} />
                            <div className="min-w-0">
                              <div className="font-extrabold text-sm text-ink-900 truncate">{b.name}</div>
                              <div className="text-[11px] text-ink-400">{b.category}</div>
                            </div>
                          </div>
                          <p className="text-xs text-ink-500 line-clamp-2">{b.description}</p>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-ink-50">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-ink-400 block mb-1">
                              Select Denomination
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {denoms.slice(0, 5).map((d) => {
                                const affordable = d * 100 <= remainingCents;
                                const active = chosenAmt === d;
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => setSelectedAmounts((prev) => ({ ...prev, [b.slug]: d }))}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition ${
                                      active
                                        ? "bg-brand-600 text-white border-brand-600"
                                        : affordable
                                        ? "bg-ink-50 text-ink-800 border-ink-200 hover:border-brand-400"
                                        : "bg-ink-50 text-ink-300 border-ink-100"
                                    }`}
                                  >
                                    {currencySym}{d}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => addToBasket(b)}
                            className="w-full py-2.5 rounded-xl bg-ink-900 text-white font-extrabold text-xs hover:bg-brand-600 transition disabled:opacity-40 disabled:hover:bg-ink-900"
                          >
                            {canAfford
                              ? `+ Add ${currencySym}${chosenAmt} ${b.name}`
                              : `Exceeds Remaining (${fmt(remainingCents)})`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 4 Cols: Redemption Basket & Confirm */}
              <div className="lg:col-span-4 lg:sticky lg:top-40 bg-white border border-ink-100 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-ink-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-ink-900">Your Redemption Basket</h3>
                    <p className="text-xs text-ink-500">Swap into 1 or more eGift cards</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-extrabold text-xs">
                    {basket.reduce((s, i) => s + i.quantity, 0)} card(s)
                  </span>
                </div>

                {basket.length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-400 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-ink-50 flex items-center justify-center mx-auto text-ink-400">
                      <Icon name="gift" size={18} />
                    </div>
                    <p>No brands selected yet.</p>
                    <p>Pick any brand and denomination on the left to allocate your {fmt(card.balanceCents)} balance.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {basket.map((item, idx) => (
                      <div
                        key={`${item.brand.slug}-${item.amountDollars}`}
                        className="flex items-center justify-between gap-3 bg-ink-50 rounded-xl p-3 border border-ink-100"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BrandLogo domain={item.brand.domain} name={item.brand.name} size={32} radius={8} />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-ink-900 truncate">{item.brand.name}</div>
                            <div className="text-[11px] text-ink-500">
                              {currencySym}{item.amountDollars} × {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-extrabold text-xs text-ink-900">
                            {currencySym}{(item.amountDollars * item.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromBasket(idx)}
                            className="w-6 h-6 rounded-full hover:bg-red-50 text-ink-400 hover:text-red-600 flex items-center justify-center transition text-xs"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={completeRedemption} className="space-y-4 pt-3 border-t border-ink-100">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-ink-500">
                      <span>Card Balance</span>
                      <span>{fmt(card.balanceCents)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-brand-700">
                      <span>Selected eGift Cards</span>
                      <span>{fmt(selectedCents)}</span>
                    </div>
                    <div className="flex justify-between text-ink-500 pt-1 border-t border-ink-50">
                      <span>Remaining After Swap</span>
                      <span className="font-bold">{fmt(remainingCents)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-ink-600 block mb-1">
                      Deliver eGift Cards To Email
                    </label>
                    <input
                      required
                      type="email"
                      value={deliveryEmail}
                      onChange={(e) => setDeliveryEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-xs outline-none focus:border-brand-500 focus:bg-white"
                    />
                  </div>

                  <button
                    disabled={basket.length === 0 || exchanging}
                    className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-extrabold text-sm hover:bg-brand-700 transition shadow-md disabled:opacity-50"
                  >
                    {exchanging
                      ? "Issuing Merchant eGift Cards…"
                      : `Complete Redemption (${fmt(selectedCents)}) →`}
                  </button>

                  <p className="text-[11px] text-ink-400 text-center leading-relaxed">
                    $0 redemption fees. Your selected merchant eGift card claim links will appear immediately and be
                    sent to your email.
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-6 py-16 text-center text-sm text-ink-400">Loading redemption portal…</div>}>
      <RedeemPortalContent />
    </Suspense>
  );
}

