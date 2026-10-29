import Link from "next/link";

export function DemoBanner() {
  const isLiveGiftbit = Boolean(process.env.GIFTBIT_API_KEY);
  const isTestbed = (process.env.GIFTBIT_API_BASE_URL || "").includes("testbed");

  if (isLiveGiftbit && !isTestbed) {
    return (
      <div className="bg-gradient-to-r from-[#5c0f14] via-[#7f1d1d] to-[#0a4738] text-white text-xs font-semibold text-center py-2 px-4">
        🎄 <span className="text-amber-300 font-extrabold">Holiday Gifting Special:</span> Save up to 10% on select gift cards + instant eGift delivery on all 165+ brands.{" "}
        <Link href="/deals" className="underline text-amber-200 hover:text-white ml-1">Shop Holiday Deals &rarr;</Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#5c0f14] via-ink-950 to-[#0a4738] text-white text-xs font-medium text-center py-2 px-4 border-b border-white/10">
      <span className="text-amber-300 font-extrabold">🎄 Holiday Sandbox Active:</span> Connected to{" "}
      <span className="font-bold text-white">Giftbit Testbed API</span> + Stripe Test Mode + Zoho SMTP.{" "}
      <Link href="/occasions?occasion=holidays" className="underline text-amber-300 hover:text-white ml-1">
        Explore Holiday Shop
      </Link>{" "}
      ·{" "}
      <Link href="/about" className="underline text-white/80 hover:text-white">
        About Fulfillment
      </Link>
    </div>
  );
}
