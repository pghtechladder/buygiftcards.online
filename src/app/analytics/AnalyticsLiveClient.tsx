"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type TelemetryData = {
  totalEventsTracked: number;
  eventCounts: Record<string, number>;
  deviceCounts: Record<string, number>;
  browserCounts: Record<string, number>;
  osCounts: Record<string, number>;
  topPages: Record<string, number>;
  webVitals: Record<string, number>;
  recentEvents: Array<{
    id: string;
    event: string;
    sessionId: string;
    path: string;
    deviceType: string;
    os: string;
    browser: string;
    params: Record<string, unknown>;
    timestamp: string;
  }>;
};

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function AnalyticsLiveClient({
  topBrandsSold,
  recentOrders,
}: {
  topBrandsSold: Array<{ brandName: string; brandSlug: string; qty: number; revenueCents: number }>;
  recentOrders: Array<{
    orderNumber: string;
    customerEmail: string;
    totalCents: number;
    status: string;
    createdAt: string;
    itemCount: number;
  }>;
}) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/collect", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const timer = setInterval(fetchAnalytics, 4000);
    return () => clearInterval(timer);
  }, []);

  const counts = data?.eventCounts || {};
  const funnelSteps = [
    { key: "page_view", label: "Page Views", count: counts.page_view || 0 },
    { key: "view_item", label: "Product Views", count: counts.view_item || 0 },
    { key: "add_to_cart", label: "Added to Cart", count: counts.add_to_cart || 0 },
    { key: "begin_checkout", label: "PayPal Checkout Started", count: counts.begin_checkout || 0 },
    { key: "purchase", label: "Purchases Completed", count: counts.purchase || 0 },
    { key: "sign_up", label: "Account Sign-Ups", count: counts.sign_up || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Real-Time E-Commerce Conversion Funnel */}
      <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-ink-950">
              Live Retail E-Commerce Funnel &amp; Activity Counts
            </h2>
            <p className="text-xs text-ink-500">
              Auto-refreshes every 4 seconds · Captures GA4 + First-Party Retail Events
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-2 rounded-xl bg-ink-50 hover:bg-ink-100 text-xs font-bold text-ink-700 transition flex items-center gap-1.5"
          >
            <Icon name="loader" size={14} className={loading ? "animate-spin" : ""} />
            Refresh Telemetry ({data?.totalEventsTracked ?? 0} events)
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {funnelSteps.map((s) => (
            <div key={s.key} className="p-4 rounded-2xl bg-ink-50/70 border border-ink-100">
              <div className="text-[11px] font-bold text-ink-500 uppercase tracking-wide">{s.label}</div>
              <div className="text-2xl font-extrabold text-ink-950 mt-1">{s.count}</div>
              <div className="text-[10px] font-mono text-brand-700 mt-1">{s.key}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Web Vitals & Device / Browser Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Core Web Vitals */}
        <div className="bg-white border border-ink-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-ink-950 mb-1">Core Web Vitals (Performance)</h3>
          <p className="text-xs text-ink-500 mb-4">Real User Monitoring (RUM) averages</p>
          <div className="space-y-3">
            {[
              { metric: "TTFB", label: "Time to First Byte", unit: "ms", good: 600 },
              { metric: "FCP", label: "First Contentful Paint", unit: "ms", good: 1800 },
              { metric: "LCP", label: "Largest Contentful Paint", unit: "ms", good: 2500 },
              { metric: "CLS", label: "Cumulative Layout Shift", unit: "", good: 0.1 },
            ].map((m) => {
              const val = data?.webVitals?.[m.metric];
              const isGood = val !== undefined ? val <= m.good : true;
              return (
                <div
                  key={m.metric}
                  className="flex items-center justify-between p-3 rounded-xl bg-ink-50 border border-ink-100"
                >
                  <div>
                    <div className="text-xs font-extrabold text-ink-900">
                      {m.metric} — {m.label}
                    </div>
                    <div className="text-[11px] text-ink-500">Target &le; {m.good}{m.unit}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold ${
                      isGood ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {val !== undefined ? `${val}${m.unit}` : "Measuring…"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device & OS Breakdown */}
        <div className="bg-white border border-ink-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-ink-950 mb-1">Device &amp; OS Traffic Split</h3>
          <p className="text-xs text-ink-500 mb-4">Mobile Express vs Desktop sessions</p>
          <div className="space-y-2.5 text-xs">
            <div className="font-bold text-ink-400 uppercase tracking-wider text-[10px]">By Device Type</div>
            {Object.entries(data?.deviceCounts || { mobile: 0, tablet: 0, desktop: 0 }).map(([dev, cnt]) => (
              <div key={dev} className="flex items-center justify-between py-1.5 border-b border-ink-50">
                <span className="font-bold capitalize text-ink-800">{dev}</span>
                <span className="font-mono font-extrabold text-brand-700">{cnt} events</span>
              </div>
            ))}
            <div className="font-bold text-ink-400 uppercase tracking-wider text-[10px] pt-2">By Operating System &amp; Browser</div>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(data?.osCounts || {}).map(([os, cnt]) => (
                <span key={os} className="px-2.5 py-1 rounded-lg bg-ink-50 border border-ink-100 font-semibold text-ink-700">
                  OS: {os.toUpperCase()} ({cnt})
                </span>
              ))}
              {Object.entries(data?.browserCounts || {}).map(([br, cnt]) => (
                <span key={br} className="px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-100 font-semibold text-brand-800">
                  Browser: {br} ({cnt})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Selling Brands */}
        <div className="bg-white border border-ink-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-ink-950 mb-1">Top Selling Gift Card Brands</h3>
          <p className="text-xs text-ink-500 mb-4">Ranked by fulfilled dollar volume</p>
          <div className="space-y-2.5 text-xs">
            {topBrandsSold.length === 0 ? (
              <div className="text-ink-400 py-6 text-center">No fulfilled orders recorded yet.</div>
            ) : (
              topBrandsSold.map((b, i) => (
                <div key={b.brandSlug} className="flex items-center justify-between py-1.5 border-b border-ink-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-ink-100 text-ink-700 font-extrabold text-[10px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-bold text-ink-900 truncate">{b.brandName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-extrabold text-brand-700">{fmt(b.revenueCents)}</span>
                    <span className="text-ink-400 ml-1.5">({b.qty} sold)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Retail Activity Stream Table */}
      <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-extrabold text-ink-950 mb-1">Live Customer Activity Stream</h3>
        <p className="text-xs text-ink-500 mb-4">
          Every shopper interaction (page views, searches, product views, cart additions, PayPal checkouts, redemptions)
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-100 text-ink-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 pr-3">Time</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Page / Path</th>
                <th className="py-2.5 px-3">Device / Browser</th>
                <th className="py-2.5 pl-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {(data?.recentEvents || []).slice(0, 25).map((ev) => (
                <tr key={ev.id} className="hover:bg-ink-50/50">
                  <td className="py-2.5 pr-3 font-mono text-[11px] text-ink-500 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 font-mono font-bold text-[11px]">
                      {ev.event}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-ink-800 max-w-[200px] truncate">
                    {ev.path}
                  </td>
                  <td className="py-2.5 px-3 text-ink-600 whitespace-nowrap">
                    {ev.deviceType} · {ev.os} · {ev.browser}
                  </td>
                  <td className="py-2.5 pl-3 font-mono text-[11px] text-ink-500 max-w-[320px] truncate">
                    {ev.params?.search_term
                      ? `search="${ev.params.search_term}"`
                      : ev.params?.metric_name
                        ? `${ev.params.metric_name}=${ev.params.value}${ev.params.unit || ""}`
                        : ev.params?.value !== undefined
                          ? `$${ev.params.value} ${ev.params.currency || "USD"}`
                          : ev.params?.page_title
                            ? String(ev.params.page_title)
                            : ""}
                  </td>
                </tr>
              ))}
              {(!data?.recentEvents || data.recentEvents.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-400">
                    Collecting live retail events…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Database Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white border border-ink-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-extrabold text-ink-950 mb-4">Recent Retail Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-ink-100 text-ink-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 pr-3">Order #</th>
                  <th className="py-2 px-3">Customer Email</th>
                  <th className="py-2 px-3">Cards</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 pl-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {recentOrders.map((o) => (
                  <tr key={o.orderNumber}>
                    <td className="py-2.5 pr-3 font-mono font-bold text-ink-900">{o.orderNumber}</td>
                    <td className="py-2.5 px-3 text-ink-600">{o.customerEmail}</td>
                    <td className="py-2.5 px-3 text-ink-700">{o.itemCount}</td>
                    <td className="py-2.5 px-3 font-extrabold text-ink-900">{fmt(o.totalCents)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-ink-400">{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
