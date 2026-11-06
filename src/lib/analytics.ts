"use client";

import { parseDeviceFromUserAgent } from "./device";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-BGC2026RETAIL";

export type RetailEventItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  discount?: number;
};

export type RetailEventName =
  | "page_view"
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_payment_info"
  | "purchase"
  | "search"
  | "sign_up"
  | "login"
  | "redeem_lookup"
  | "redeem_exchange"
  | "reveal_gift_code"
  | "copy_gift_code"
  | "web_vitals"
  | "client_error";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SESSION_STORAGE_KEY = "bgc_analytics_session_id";
const LOCAL_BUFFER_KEY = "bgc_retail_events_v1";

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return "anon-session";
  }
}

/**
 * Tracks a retail e-commerce, user behavior, or performance event across:
 *   1. Google Analytics 4 (`window.gtag` / `window.dataLayer`)
 *   2. First-party Retail Analytics API (`POST /api/analytics/collect`)
 *   3. Local browser telemetry buffer (`localStorage`) for instant inspection
 */
export function trackRetailEvent(
  eventName: RetailEventName,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;

  const device = parseDeviceFromUserAgent(navigator.userAgent);
  const sessionId = getAnalyticsSessionId();
  const timestamp = new Date().toISOString();

  const enrichedParams: Record<string, unknown> = {
    ...params,
    session_id: sessionId,
    page_path: window.location.pathname,
    page_Search: window.location.search,
    page_title: document.title,
    device_type: device.deviceType,
    device_os: device.os,
    device_browser: device.browser,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timestamp,
  };

  // 1. Dispatch to Google Analytics 4 (gtag.js / GTM dataLayer)
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, enrichedParams);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...enrichedParams,
      });
    }
  } catch {
    // Never break user flow over analytics
  }

  // 2. Store in local rolling telemetry buffer (last 100 events)
  try {
    const raw = localStorage.getItem(LOCAL_BUFFER_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ event: eventName, ...enrichedParams });
    if (list.length > 100) list.length = 100;
    localStorage.setItem(LOCAL_BUFFER_KEY, JSON.stringify(list));
  } catch {}

  // 3. Send non-blocking beacon / fetch to first-party Retail Analytics collector
  try {
    const payload = JSON.stringify({
      event: eventName,
      sessionId,
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || undefined,
      device,
      params: enrichedParams,
      timestamp,
    });

    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/collect", blob);
    } else {
      fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}
