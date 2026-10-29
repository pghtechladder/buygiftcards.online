"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Brand, BRANDS, HOUSE_BRAND_SLUGS } from "@/lib/brands";
import { BrandLogo } from "./BrandLogo";
import { BrandGrid } from "./BrandGrid";
import { useCart } from "@/context/CartContext";
import { Icon } from "./Icon";

const fmt = (n: number) => `$${n.toFixed(2)}`;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const OCCASION_DESIGNS = [
  { id: "standard", label: "Classic Brand", badge: "", gradient: "" },
  { id: "Holidays & Christmas", label: "🎄 Happy Holidays", badge: "HAPPY HOLIDAYS", gradient: "linear-gradient(135deg, #7f1d1d, #b91c1c, #065f46)" },
  { id: "Winter Wonderland", label: "❄️ Winter Wishes", badge: "SEASON'S GREETINGS", gradient: "linear-gradient(135deg, #0c4a6e, #0284c7, #38bdf8)" },
  { id: "Birthday", label: "🎂 Happy Birthday", badge: "HAPPY BIRTHDAY", gradient: "linear-gradient(135deg, #581c87, #9333ea, #ec4899)" },
  { id: "Thank You", label: "✨ Thank You", badge: "THANK YOU", gradient: "linear-gradient(135deg, #064e3b, #0f8c66, #d97706)" },
  { id: "Celebration", label: "🥂 Congratulations", badge: "CONGRATS!", gradient: "linear-gradient(135deg, #1e293b, #334155, #eab308)" },
];

export function ProductDetail({ brand: b }: { brand: Brand }) {
  const { add } = useCart();
  const [amount, setAmount] = useState<number>(b.denominations[1] ?? b.denominations[0]);
  const [custom, setCustom] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [qty, setQty] = useState(1);
  const [deliveryType, setDeliveryType] = useState<"egift" | "physical">(b.type === "physical" ? "physical" : "egift");
  const [added, setAdded] = useState(false);

  // Gift personalization state (Giftcards.com-style)
  const [whoFor, setWhoFor] = useState<"gift" | "self">("gift");
  const [designId, setDesignId] = useState<string>("standard");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const amt = isCustom ? Number(custom) || 0 : amount;
  const valid = amt >= b.min && amt <= b.max && !photoUploading;
  const chargeAmt = b.discountPercent ? Math.round(amt * (1 - b.discountPercent / 100) * 100) / 100 : amt;

  const activeDesign = OCCASION_DESIGNS.find((d) => d.id === designId) ?? OCCASION_DESIGNS[0];
  const relatedBrands = BRANDS.filter((x) => x.category === b.category && x.slug !== b.slug).slice(0, 5);

  const onPhotoSelected = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Please upload a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image must be under 8MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    setPhotoUrl(null);
    setPhotoUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPhotoUrl(data.url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed — try again.");
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cardImage = photoPreview;
  const cardBackground = cardImage
    ? "#000"
    : activeDesign.gradient || `linear-gradient(140deg, ${b.color}ee, ${b.color}bb)`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center gap-1.5 text-sm text-ink-400 mb-6">
        <Link href="/" className="hover:text-brand-600 transition">Home</Link>
        <Icon name="chevronRight" size={14} />
        <Link href="/catalog" className="hover:text-brand-600 transition">All Brands</Link>
        <Icon name="chevronRight" size={14} />
        <Link href={`/catalog?category=${encodeURIComponent(b.category)}`} className="hover:text-brand-600 transition">{b.category}</Link>
        <Icon name="chevronRight" size={14} />
        <span className="text-ink-700 font-medium">{b.name}</span>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Left column: Sticky Card Preview + Gift Details */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
          <div
            className="rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center min-h-[340px] border border-ink-100 relative overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${b.color}14, ${b.color}05)` }}
          >
            <div
              className="w-full max-w-[330px] aspect-[1.586/1] rounded-2xl flex items-center justify-center relative overflow-hidden shadow-2xl transition-all duration-300"
              style={{ background: cardBackground }}
            >
              {cardImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cardImage} alt="Your uploaded photo" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
              {cardImage && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />}
              {!cardImage && (
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }}
                />
              )}
              {!cardImage && <BrandLogo domain={b.domain} name={b.name} size={76} radius={16} bg="rgba(255,255,255,0.95)" />}
              {cardImage && (
                <div className="absolute top-4 right-5">
                  <BrandLogo domain={b.domain} name={b.name} size={36} radius={8} bg="rgba(255,255,255,0.95)" />
                </div>
              )}
              <div className="absolute top-4 left-5 flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider text-white/90 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {activeDesign.badge || (deliveryType === "egift" ? "eGIFT CARD" : "GIFT CARD")}
                </span>
              </div>
              {amt > 0 && (
                <div className="absolute bottom-4 left-5">
                  <div className="text-2xl font-extrabold text-white drop-shadow">{fmt(amt)}</div>
                  {whoFor === "gift" && recipientName && (
                    <div className="text-[11px] font-medium text-white/85 truncate max-w-[180px]">
                      For {recipientName}
                    </div>
                  )}
                </div>
              )}
              <div className="absolute bottom-4 right-5 text-[11px] font-bold text-white/85 truncate max-w-[120px]">
                {b.name}
              </div>
              {!!b.discountPercent && (
                <span className="absolute top-4 right-5 bg-accent-500 text-ink-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                  {b.discountPercent}% OFF
                </span>
              )}
            </div>

            {whoFor === "gift" && giftMessage && (
              <div className="mt-6 w-full max-w-[330px] bg-white/90 backdrop-blur border border-ink-100 rounded-xl p-3.5 text-xs text-ink-700 italic shadow-sm">
                &ldquo;{giftMessage}&rdquo;
                {senderName && <div className="not-italic font-bold text-ink-900 mt-1 text-right">— {senderName}</div>}
              </div>
            )}
          </div>

          <div className="bg-white border border-ink-100 rounded-2xl p-5 space-y-3 text-xs text-ink-600">
            <div className="font-bold text-ink-900 text-sm">Card Details & Redemption</div>
            <p className="leading-relaxed">{b.description}</p>
            <ul className="space-y-1.5 pt-1 text-ink-500">
              <li className="flex items-center gap-2">
                <Icon name="checkCircle" size={14} className="text-brand-600 flex-shrink-0" />
                Funds never expire and carry $0 purchase fees on merchant cards
              </li>
              <li className="flex items-center gap-2">
                <Icon name="zap" size={14} className="text-brand-600 flex-shrink-0" />
                Instant digital claim link delivered via email immediately after checkout
              </li>
              <li className="flex items-center gap-2">
                <Icon name="shield" size={14} className="text-brand-600 flex-shrink-0" />
                Backed by our 100% Purchase Protection Guarantee
              </li>
            </ul>
            {HOUSE_BRAND_SLUGS.includes(b.slug) && (
              <div className="pt-3 mt-3 border-t border-ink-100 flex items-center justify-between gap-2">
                <span className="font-bold text-ink-800">Already have this card?</span>
                <Link
                  href="/redeem"
                  className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-white font-extrabold text-xs hover:bg-brand-700 transition"
                >
                  Redeem / Swap Card &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Configuration & Personalization */}
        <div className="lg:col-span-7 bg-white border border-ink-100 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              {b.category}
            </span>
            {b.badge && (
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                {b.badge}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold mb-2">{b.name} Gift Card</h1>
          <p className="text-sm text-ink-600 mb-7 leading-relaxed">{b.description}</p>

          {/* Step 1: Card Theme / Holiday Occasion */}
          <div className="mb-7">
            <div className="text-sm font-bold mb-2.5 flex items-center justify-between">
              <span>1. Choose a Card Design & Occasion</span>
              <span className="text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">Holiday Themes Available</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {OCCASION_DESIGNS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDesignId(d.id)}
                  className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold text-left transition flex items-center gap-2 ${
                    designId === d.id
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-ink-100 text-ink-700 hover:border-brand-200"
                  }`}
                >
                  <span className="truncate">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Method */}
          {b.type === "both" && (
            <div className="mb-7">
              <div className="text-sm font-bold mb-2.5">2. Delivery Format</div>
              <div className="flex border border-ink-100 rounded-xl overflow-hidden">
                {(["egift", "physical"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDeliveryType(v)}
                    className={`flex-1 py-3.5 text-sm font-bold flex flex-col items-center gap-1 transition ${
                      deliveryType === v ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon name={v === "egift" ? "zap" : "package"} size={15} />
                      {v === "egift" ? "eGift Card (Digital)" : "Physical Plastic Card"}
                    </span>
                    <span className="text-[11px] font-normal opacity-75">
                      {v === "egift" ? "Instant delivery via email" : "Ships via USPS in 5–7 business days"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Photo Upload */}
          {b.supportsCustomPhoto && (
            <div className="mb-7">
              <div className="text-sm font-bold mb-2.5">Personalize with Your Own Photo (optional)</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPhotoSelected(e.target.files?.[0])}
              />
              {!photoPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 border-2 border-dashed border-ink-200 rounded-xl text-sm font-semibold text-ink-500 hover:border-brand-400 hover:text-brand-600 transition flex flex-col items-center gap-2"
                >
                  <Icon name="package" size={20} />
                  Click to upload a custom photo for the card face
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-ink-50 border-2 border-ink-100 rounded-xl p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-sm">
                    {photoUploading ? (
                      <span className="flex items-center gap-1.5 text-ink-500">
                        <Icon name="loader" size={14} className="animate-spin" /> Uploading…
                      </span>
                    ) : photoUrl ? (
                      <span className="flex items-center gap-1.5 text-green-700 font-semibold">
                        <Icon name="checkCircle" size={14} /> Photo ready
                      </span>
                    ) : (
                      <span className="text-red-600">Upload failed</span>
                    )}
                  </div>
                  <button type="button" onClick={removePhoto} className="text-ink-400 hover:text-red-500 transition flex-shrink-0">
                    <Icon name="x" size={18} />
                  </button>
                </div>
              )}
              {photoError && <div className="text-red-600 text-xs mt-2">{photoError}</div>}
              <p className="text-xs text-ink-400 mt-1.5">JPEG, PNG, or WEBP up to 8MB.</p>
            </div>
          )}

          {/* Step 3: Select Amount */}
          <div className="mb-7">
            <div className="text-sm font-bold mb-3 flex items-center gap-2">
              <span>{b.type === "both" ? "3." : "2."} Select Gift Amount</span>
              {!!b.discountPercent && (
                <span className="bg-accent-500 text-ink-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  SAVE {b.discountPercent}%
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {b.denominations.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setAmount(v);
                    setIsCustom(false);
                    setAdded(false);
                  }}
                  className={`px-5 py-3 rounded-xl border-2 font-extrabold flex flex-col items-center transition ${
                    !isCustom && amount === v ? "border-brand-600 bg-brand-50 text-brand-600" : "border-ink-100 hover:border-brand-200"
                  }`}
                >
                  {b.discountPercent ? (
                    <>
                      <span className="text-[11px] font-semibold line-through opacity-50 leading-none">{fmt(v)}</span>
                      <span className="leading-tight">{fmt(Math.round(v * (1 - b.discountPercent / 100) * 100) / 100)}</span>
                    </>
                  ) : (
                    fmt(v)
                  )}
                </button>
              ))}
              {b.min !== b.max && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setAdded(false);
                  }}
                  className={`px-5 py-3 rounded-xl border-2 font-bold text-sm transition ${
                    isCustom ? "border-brand-600 bg-brand-50 text-brand-600" : "border-ink-100 text-ink-600 hover:border-brand-200"
                  }`}
                >
                  Custom (${b.min}–${b.max})
                </button>
              )}
            </div>
            {isCustom && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  min={b.min}
                  max={b.max}
                  placeholder={`${b.min} – ${b.max}`}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-48 px-4 py-3 border-2 border-ink-100 rounded-xl font-bold outline-none focus:border-brand-500"
                />
                <span className="text-xs text-ink-400">Enter whole dollar amount between ${b.min} and ${b.max}</span>
              </div>
            )}
          </div>

          {/* Step 4: Who is this gift for? */}
          <div className="mb-7">
            <div className="text-sm font-bold mb-2.5">{b.type === "both" ? "4." : "3."} Who is this card for?</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setWhoFor("gift")}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition ${
                  whoFor === "gift" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink-100 text-ink-600"
                }`}
              >
                <Icon name="gift" size={16} />
                Send as a Gift
              </button>
              <button
                type="button"
                onClick={() => setWhoFor("self")}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition ${
                  whoFor === "self" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink-100 text-ink-600"
                }`}
              >
                <Icon name="wallet" size={16} />
                For Myself
              </button>
            </div>

            {whoFor === "gift" && (
              <div className="bg-ink-50/80 border border-ink-100 rounded-2xl p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-ink-600 uppercase block mb-1">Recipient Name (optional)</label>
                    <input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-white text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-600 uppercase block mb-1">Recipient Email (optional)</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-white text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-600 uppercase block mb-1">From / Sender Name</label>
                    <input
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-white text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-600 uppercase block mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-white text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-600 uppercase block mb-1">
                    Personal Gift Message <span className="text-ink-400 font-normal">({giftMessage.length}/200)</span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Wishing you a joyful holiday season and a wonderful New Year!"
                    className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-white text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm font-bold mb-1">Quantity</div>
              <div className="text-xs text-ink-400">Need 10+ cards? <Link href="/business" className="text-brand-600 font-semibold hover:underline">Order in bulk</Link></div>
            </div>
            <div className="inline-flex border border-ink-100 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-12 h-11 bg-ink-50 text-xl font-bold hover:bg-ink-100 transition">−</button>
              <span className="w-14 flex items-center justify-center font-extrabold text-base">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} className="w-12 h-11 bg-ink-50 text-xl font-bold hover:bg-ink-100 transition">+</button>
            </div>
          </div>

          {/* Add to Cart Bar */}
          <div className="flex items-center gap-6 pt-6 border-t border-ink-100">
            <div>
              <div className="text-xs text-ink-400">Total</div>
              {b.discountPercent ? (
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-extrabold">{fmt(chargeAmt * qty)}</div>
                  <div className="text-sm font-semibold text-ink-400 line-through">{fmt(amt * qty)}</div>
                </div>
              ) : (
                <div className="text-3xl font-extrabold">{fmt(amt * qty)}</div>
              )}
              <div className="text-[11px] text-ink-400 mt-0.5">
                {b.discountPercent
                  ? `Card value: ${fmt(amt * qty)} — you save ${fmt((amt - chargeAmt) * qty)}`
                  : "Card value: full amount, $0 fees"}
              </div>
            </div>
            <button
              type="button"
              disabled={!valid}
              onClick={() => {
                add({
                  brandSlug: b.slug,
                  brandName: b.name,
                  domain: b.domain,
                  color: b.color,
                  amount: amt,
                  qty,
                  deliveryType,
                  customPhotoUrl: photoUrl ?? undefined,
                  ...(whoFor === "gift"
                    ? {
                        recipientName: recipientName.trim() || undefined,
                        recipientEmail: recipientEmail.trim() || undefined,
                        senderName: senderName.trim() || undefined,
                        giftMessage: giftMessage.trim() || undefined,
                        occasion: designId !== "standard" ? designId : undefined,
                        deliveryDate,
                      }
                    : {}),
                });
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }}
              className={`flex-1 py-4 rounded-2xl font-extrabold text-white transition shadow-lg shadow-brand-600/15 ${
                added ? "bg-green-600" : "bg-brand-600 hover:bg-brand-700 disabled:opacity-40"
              }`}
            >
              {added ? (
                <span className="flex items-center justify-center gap-2"><Icon name="checkCircle" size={18} />Added to Cart</span>
              ) : photoUploading ? (
                "Uploading photo…"
              ) : (
                "Add to Cart"
              )}
            </button>
          </div>
        </div>
      </div>

      {relatedBrands.length > 0 && (
        <div className="mt-14 pt-8 border-t border-ink-100">
          <BrandGrid items={relatedBrands} title={`More in ${b.category}`} />
        </div>
      )}
    </div>
  );
}
