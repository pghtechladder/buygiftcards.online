import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { AnalyticsLiveClient } from "./AnalyticsLiveClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Retail Data & Performance Analytics Dashboard — buygiftcards.online",
  description: "Google Analytics 4 e-commerce funnel, Core Web Vitals performance telemetry, and live retail sales analytics.",
};

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default async function RetailAnalyticsDashboardPage() {
  // Query live retail database metrics
  let totalOrders = 0;
  let fulfilledOrders = 0;
  let totalRevenueCents = 0;
  let totalUsers = 0;
  let topBrandsSold: Array<{ brandName: string; brandSlug: string; qty: number; revenueCents: number }> = [];
  let recentOrders: Array<{
    orderNumber: string;
    customerEmail: string;
    totalCents: number;
    status: string;
    createdAt: string;
    itemCount: number;
  }> = [];

  try {
    const [orders, usersCount] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { items: true },
      }),
      prisma.user.count(),
    ]);

    totalUsers = usersCount;
    totalOrders = orders.length;

    const brandStats = new Map<string, { brandName: string; brandSlug: string; qty: number; revenueCents: number }>();

    for (const o of orders) {
      if (o.status === "FULFILLED" || o.status === "PAID") {
        fulfilledOrders += 1;
        totalRevenueCents += o.totalCents;

        for (const it of o.items) {
          const prev = brandStats.get(it.brandSlug) || {
            brandName: it.brandName,
            brandSlug: it.brandSlug,
            qty: 0,
            revenueCents: 0,
          };
          prev.qty += it.quantity;
          prev.revenueCents += it.denomCents * it.quantity;
          brandStats.set(it.brandSlug, prev);
        }
      }
    }

    topBrandsSold = Array.from(brandStats.values())
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 10);

    recentOrders = orders.slice(0, 10).map((o) => ({
      orderNumber: o.orderNumber,
      customerEmail: o.customerEmail,
      totalCents: o.totalCents,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    }));
  } catch (err) {
    console.warn("[/analytics] DB query warning:", err);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="bg-ink-950 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-extrabold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Google Analytics 4 ({GA_MEASUREMENT_ID}) + First-Party Retail Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Retail Data, E-Commerce Funnel &amp; Performance Analytics
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Real-time tracking of page views, product impressions, cart actions, PayPal checkouts, redemptions, device/browser breakdown, and Core Web Vitals.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/qa-dashboard"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold transition"
          >
            Fulfillment QA Dashboard
          </Link>
          <Link
            href="/catalog"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold transition"
          >
            Open Retail Store &rarr;
          </Link>
        </div>
      </div>

      {/* Database Retail KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-400">Gross Gift Card Volume</div>
          <div className="mt-2 text-2xl font-extrabold text-brand-700">{fmt(totalRevenueCents)}</div>
          <div className="mt-2 text-xs text-ink-500">
            Across <strong>{fulfilledOrders}</strong> fulfilled / paid orders
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Retail Orders</div>
          <div className="mt-2 text-2xl font-extrabold text-ink-950">{totalOrders}</div>
          <div className="mt-2 text-xs text-ink-500">
            Average Order Value:{" "}
            <strong>
              {fulfilledOrders > 0 ? fmt(Math.round(totalRevenueCents / fulfilledOrders)) : "$0.00"}
            </strong>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-400">Registered Customer Accounts</div>
          <div className="mt-2 text-2xl font-extrabold text-ink-950">{totalUsers}</div>
          <div className="mt-2 text-xs text-ink-500">
            Pre-checkout &amp; post-PayPal verified accounts
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-400">GA4 E-Commerce Stream</div>
          <div className="mt-2 text-xl font-mono font-extrabold text-emerald-600">{GA_MEASUREMENT_ID}</div>
          <div className="mt-2 text-xs text-ink-500">
            Tracking 15 retail &amp; Web Vitals event types
          </div>
        </div>
      </div>

      {/* Live Client Telemetry Stream, Funnel, Device/Browser & Web Vitals */}
      <AnalyticsLiveClient topBrandsSold={topBrandsSold} recentOrders={recentOrders} />
    </div>
  );
}

