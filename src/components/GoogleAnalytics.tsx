"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GA_MEASUREMENT_ID, trackRetailEvent } from "@/lib/analytics";

function RouteAndPerformanceTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Track route changes (`page_view` & `search`)
  useEffect(() => {
    const query = searchParams.toString();
    const fullUrl = query ? `${pathname}?${query}` : pathname;

    trackRetailEvent("page_view", {
      page_location: typeof window !== "undefined" ? window.location.href : fullUrl,
      page_path: fullUrl,
    });

    const searchQ = searchParams.get("q");
    if (searchQ) {
      trackRetailEvent("search", {
        search_term: searchQ,
        category: searchParams.get("category") || undefined,
      });
    }
  }, [pathname, searchParams]);

  // 2. Track Core Web Vitals (FCP, LCP, CLS, INP, TTFB) & Navigation Timing
  useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

    const observers: PerformanceObserver[] = [];

    try {
      // Navigation timing (TTFB & DOM Complete)
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        if (nav.responseStart > 0) {
          trackRetailEvent("web_vitals", {
            metric_name: "TTFB",
            value: Math.round(nav.responseStart),
            unit: "ms",
          });
        }
      }
    } catch {}

    try {
      // Paint timing (FCP)
      const paintObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            trackRetailEvent("web_vitals", {
              metric_name: "FCP",
              value: Math.round(entry.startTime),
              unit: "ms",
            });
          }
        }
      });
      paintObs.observe({ type: "paint", buffered: true });
      observers.push(paintObs);
    } catch {}

    try {
      // Largest Contentful Paint (LCP)
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          trackRetailEvent("web_vitals", {
            metric_name: "LCP",
            value: Math.round(last.startTime),
            unit: "ms",
          });
        }
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcpObs);
    } catch {}

    try {
      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput?: boolean; value?: number })[]) {
          if (!entry.hadRecentInput && typeof entry.value === "number") {
            clsValue += entry.value;
          }
        }
        trackRetailEvent("web_vitals", {
          metric_name: "CLS",
          value: Math.round(clsValue * 1000) / 1000,
          unit: "score",
        });
      });
      clsObs.observe({ type: "layout-shift", buffered: true });
      observers.push(clsObs);
    } catch {}

    // 3. Global Client Runtime Error & Unhandled Rejection Monitoring
    const onError = (event: ErrorEvent) => {
      trackRetailEvent("client_error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      });
    };
    window.addEventListener("error", onError);

    return () => {
      observers.forEach((o) => o.disconnect());
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}

export function GoogleAnalytics() {
  return (
    <>
      <Script
        id="ga4-gtag-js"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              send_page_view: false,
              anonymize_ip: true,
              allow_google_signals: true
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <RouteAndPerformanceTracker />
      </Suspense>
    </>
  );
}
