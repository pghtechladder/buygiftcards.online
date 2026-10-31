import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-[#5c0f14] via-[#7f1d1d] to-[#0a4738] text-white text-xs font-semibold text-center py-2 px-4 border-b border-white/10">
      🎄 <span className="text-amber-300 font-extrabold">Holiday Gifting Special:</span> Save up to 10% on select gift cards + instant eGift delivery on all 180+ brands.{" "}
      <Link href="/deals" className="underline text-amber-200 hover:text-white ml-1">
        Shop Holiday Deals &rarr;
      </Link>{" "}
      ·{" "}
      <Link href="/redeem" className="underline text-white/90 hover:text-white">
        Redeem Gift Card
      </Link>
    </div>
  );
}
