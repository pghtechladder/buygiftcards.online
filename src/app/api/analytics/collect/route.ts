import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import { writeTransactionLog } from "@/lib/logger";
import { parseDeviceFromUserAgent } from "@/lib/device";

const isServerless = Boolean(
  process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.cwd().startsWith("/var/task")
);
const LOG_DIR = isServerless
  ? path.join(os.tmpdir(), "buygiftcards-logs")
  : path.join(process.cwd(), "logs");
export const RETAIL_ANALYTICS_JSONL_PATH = path.join(LOG_DIR, "retail-analytics.jsonl");

type StoredAnalyticsEvent = {
  id: string;
  event: string;
  sessionId: string;
  path: string;
  referrer?: string;
  deviceType: string;
  os: string;
  browser: string;
  params: Record<string, unknown>;
  timestamp: string;
};

// In-memory ring buffer so serverless instances can also return recent events immediately
const recentEventsBuffer: StoredAnalyticsEvent[] = [];
const MAX_BUFFER = 500;

function ensureDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ua = req.headers.get("user-agent") || "";
    const parsedDevice = body.device || parseDeviceFromUserAgent(ua);

    const record: StoredAnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      event: String(body.event || "unknown"),
      sessionId: String(body.sessionId || "anon"),
      path: String(body.path || "/"),
      referrer: body.referrer ? String(body.referrer) : undefined,
      deviceType: String(parsedDevice.deviceType || "desktop"),
      os: String(parsedDevice.os || "other"),
      browser: String(parsedDevice.browser || "other"),
      params: (body.params as Record<string, unknown>) || {},
      timestamp: String(body.timestamp || new Date().toISOString()),
    };

    recentEventsBuffer.unshift(record);
    if (recentEventsBuffer.length > MAX_BUFFER) {
      recentEventsBuffer.length = MAX_BUFFER;
    }

    try {
      ensureDir();
      fs.appendFileSync(RETAIL_ANALYTICS_JSONL_PATH, JSON.stringify(record) + "\n", "utf8");
    } catch {}

    // Log key retail conversion & checkout events into the main transaction log as well
    if (
      [
        "add_to_cart",
        "begin_checkout",
        "purchase",
        "sign_up",
        "login",
        "redeem_lookup",
        "redeem_exchange",
      ].includes(record.event)
    ) {
      writeTransactionLog({
        phase: "PROCESS_STEP",
        process: `RetailAnalytics.${record.event}`,
        details: {
          sessionId: record.sessionId,
          path: record.path,
          deviceType: record.deviceType,
          os: record.os,
          browser: record.browser,
          value: record.params?.value,
          currency: record.params?.currency,
          items: record.params?.items,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  let events: StoredAnalyticsEvent[] = [...recentEventsBuffer];

  try {
    if (fs.existsSync(RETAIL_ANALYTICS_JSONL_PATH)) {
      const lines = fs
        .readFileSync(RETAIL_ANALYTICS_JSONL_PATH, "utf8")
        .split("\n")
        .filter(Boolean)
        .slice(-300)
        .reverse();
      const diskEvents = lines
        .map((l) => {
          try {
            return JSON.parse(l) as StoredAnalyticsEvent;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as StoredAnalyticsEvent[];

      const seen = new Set(events.map((e) => e.id));
      for (const de of diskEvents) {
        if (!seen.has(de.id)) {
          events.push(de);
          seen.add(de.id);
        }
      }
    }
  } catch {}

  events = events.slice(0, 300);

  // Aggregate KPI summaries from collected telemetry
  const eventCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
  const browserCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};
  const topPages: Record<string, number> = {};
  const webVitals: Record<string, { sum: number; count: number }> = {};

  for (const e of events) {
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
    deviceCounts[e.deviceType] = (deviceCounts[e.deviceType] || 0) + 1;
    browserCounts[e.browser] = (browserCounts[e.browser] || 0) + 1;
    osCounts[e.os] = (osCounts[e.os] || 0) + 1;
    if (e.event === "page_view") {
      const cleanPath = e.path.split("?")[0] || "/";
      topPages[cleanPath] = (topPages[cleanPath] || 0) + 1;
    }
    if (e.event === "web_vitals" && typeof e.params?.metric_name === "string" && typeof e.params?.value === "number") {
      const m = e.params.metric_name;
      if (!webVitals[m]) webVitals[m] = { sum: 0, count: 0 };
      webVitals[m].sum += e.params.value;
      webVitals[m].count += 1;
    }
  }

  return NextResponse.json({
    totalEventsTracked: events.length,
    eventCounts,
    deviceCounts,
    browserCounts,
    osCounts,
    topPages,
    webVitals: Object.fromEntries(
      Object.entries(webVitals).map(([k, v]) => [k, Math.round((v.sum / v.count) * 100) / 100])
    ),
    recentEvents: events.slice(0, 60),
  });
}

