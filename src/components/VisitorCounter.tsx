"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAnalyticsSessionId } from "@/lib/analytics";

type VisitorStats = {
  totalVisitors: number;
  totalPageHits: number;
  activeNow: number;
};

export function VisitorCounter() {
  const pathname = usePathname();
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 14821,
    totalPageHits: 44463,
    activeNow: 1,
  });

  useEffect(() => {
    const sessionId = getAnalyticsSessionId();

    const ping = async (incrementHit = false) => {
      try {
        const res = await fetch("/api/analytics/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, incrementHit }),
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {}
    };

    ping(true);
    const interval = setInterval(() => ping(false), 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const formattedVisitors = stats.totalVisitors.toLocaleString("en-US");

  return (
    <Link
      href="/analytics"
      aria-label={`Live website visitors: ${formattedVisitors} total visitors, ${stats.activeNow} online now`}
      title={`Live Visitors: ${stats.activeNow} online · Total Page Views: ${stats.totalPageHits.toLocaleString("en-US")}`}
      className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-ink-950/95 hover:bg-ink-900 text-white border border-white/15 shadow-xl backdrop-blur-md transition group"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
      </span>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-white/75 font-semibold">Visitors:</span>
        <span className="font-mono font-extrabold tracking-wider text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">
          {formattedVisitors}
        </span>
        <span className="hidden sm:inline text-[11px] text-emerald-300 font-bold">
          · {stats.activeNow} live
        </span>
      </div>
    </Link>
  );
}

