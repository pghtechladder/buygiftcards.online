"use client";

import { useState } from "react";
import { BRANDS } from "@/lib/brands";
import { BrandLogo } from "@/components/BrandLogo";
import { useCart } from "@/context/CartContext";
import { Icon } from "@/components/Icon";

type Contributor = { name: string; amount: number; message: string };

export default function GroupGiftsPage() {
  const { add } = useCart();
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [occasion, setOccasion] = useState("🎄 Office Holiday Gift");
  const [brandSlug, setBrandSlug] = useState("one4all");
  const [contributors, setContributors] = useState<Contributor[]>([
    { name: "Organizer (You)", amount: 50, message: "Happy Holidays from the whole team!" },
    { name: "Team Member 2", amount: 25, message: "Thank you for an amazing year!" },
    { name: "Team Member 3", amount: 25, message: "Wishing you the best this holiday season!" },
  ]);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("25");
  const [newMessage, setNewMessage] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);

  const selectedBrand = BRANDS.find((b) => b.slug === brandSlug) ?? BRANDS[0];
  const rawTotal = contributors.reduce((s, c) => s + c.amount, 0);
  const clampedTotal = Math.max(selectedBrand.min, Math.min(selectedBrand.max, Math.round(rawTotal)));

  const addContributor = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.max(5, Math.min(500, Math.round(Number(newAmount) || 0)));
    if (!newName.trim()) return;
    setContributors((prev) => [...prev, { name: newName.trim(), amount: amt, message: newMessage.trim() }]);
    setNewName("");
    setNewAmount("25");
    setNewMessage("");
  };

  const removeContributor = (idx: number) => {
    setContributors((prev) => prev.filter((_, i) => i !== idx));
  };

  const launchGroupCheckout = () => {
    const combinedNotes = contributors
      .map((c) => `${c.name}: ${c.message || "Best wishes!"}`)
      .join(" | ")
      .slice(0, 200);

    add({
      brandSlug: selectedBrand.slug,
      brandName: selectedBrand.name,
      domain: selectedBrand.domain,
      color: selectedBrand.color,
      amount: clampedTotal,
      qty: 1,
      deliveryType: "egift",
      recipientName: recipientName.trim() || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
      senderName: `${contributors.length} Group Contributors`,
      giftMessage: combinedNotes,
      occasion,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0a4738] via-brand-700 to-[#5c0f14] text-white p-8 sm:p-12 mb-8 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-3">
            🎁 Group Gifting Campaign
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Pool together for one unforgettable gift</h1>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed">
            Perfect for holiday boss gifts, teachers, coaches, weddings, and team milestones. Combine contributions
            and messages from everyone into a single high-value eGift card or One4all Multi-Brand choice link.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Campaign Setup & Contributors */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-xl font-extrabold">1. Recipient &amp; Gift Card Choice</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-ink-600 uppercase block mb-1">Recipient Name</label>
                <input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-ink-50 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-600 uppercase block mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-ink-50 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-600 uppercase block mb-1">Occasion</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-ink-50 text-sm outline-none focus:border-brand-500"
                >
                  <option>🎄 Office Holiday Gift</option>
                  <option>🍎 Teacher Appreciation</option>
                  <option>🎂 Milestone Birthday</option>
                  <option>🥂 Wedding / Baby Shower</option>
                  <option>👋 Farewell / Retirement</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-ink-600 uppercase block mb-1">Gift Card Brand</label>
                <select
                  value={brandSlug}
                  onChange={(e) => setBrandSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-ink-50 text-sm outline-none focus:border-brand-500"
                >
                  {BRANDS.filter((b) => b.min !== b.max).map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name} (${b.min}–${b.max})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">2. Group Contributors &amp; Signatures ({contributors.length})</h2>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopiedShare(true);
                  setTimeout(() => setCopiedShare(false), 2000);
                }}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Icon name={copiedShare ? "checkCircle" : "copy"} size={13} />
                {copiedShare ? "Invite link copied!" : "Copy invite link"}
              </button>
            </div>

            <div className="space-y-3">
              {contributors.map((c, idx) => (
                <div key={idx} className="bg-ink-50 border border-ink-100 rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm">
                      {c.name} <span className="text-brand-700 font-extrabold ml-1.5">+${c.amount}</span>
                    </div>
                    {c.message && <div className="text-xs text-ink-500 italic mt-0.5">&ldquo;{c.message}&rdquo;</div>}
                  </div>
                  {contributors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContributor(idx)}
                      className="text-ink-400 hover:text-red-600 transition"
                    >
                      <Icon name="x" size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={addContributor} className="pt-4 border-t border-ink-100 space-y-3">
              <div className="text-xs font-bold text-ink-600 uppercase">Add Another Contributor / Greeting Card Signer</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contributor Name"
                  className="px-3.5 py-2.5 border border-ink-100 rounded-xl bg-ink-50 text-sm"
                />
                <input
                  required
                  type="number"
                  min={5}
                  max={500}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Amount ($)"
                  className="px-3.5 py-2.5 border border-ink-100 rounded-xl bg-ink-50 text-sm font-bold"
                />
                <button className="py-2.5 px-4 rounded-xl bg-ink-950 text-white text-xs font-extrabold hover:bg-ink-800 transition">
                  + Add Signer
                </button>
              </div>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Personal note for the group greeting card (optional)"
                className="w-full px-3.5 py-2.5 border border-ink-100 rounded-xl bg-ink-50 text-sm"
              />
            </form>
          </div>
        </div>

        {/* Right: Pooled Card Summary */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 bg-white border border-ink-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="rounded-2xl p-6 text-white flex flex-col justify-between min-h-[190px] shadow-xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${selectedBrand.color}, #0a4738)` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/25 px-2.5 py-1 rounded-full">
                {occasion}
              </span>
              <BrandLogo domain={selectedBrand.domain} name={selectedBrand.name} size={42} radius={10} bg="#fff" />
            </div>
            <div>
              <div className="text-3xl font-extrabold">${clampedTotal.toFixed(2)}</div>
              <div className="text-xs text-white/85 mt-0.5">
                {selectedBrand.name} · For {recipientName || "Your Recipient"}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-500">
              <span>Contributors</span>
              <span className="font-bold text-ink-900">{contributors.length} people</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Pooled Gift Card Value</span>
              <span className="font-extrabold text-ink-900">${clampedTotal.toFixed(2)}</span>
            </div>
            {rawTotal !== clampedTotal && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg">
                Adjusted to fit {selectedBrand.name}&apos;s allowed range (${selectedBrand.min}–${selectedBrand.max}).
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={launchGroupCheckout}
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold transition shadow-lg shadow-brand-600/15"
          >
            Add Group Gift (${clampedTotal}) to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

