import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";

const isServerless = Boolean(
  process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.cwd().startsWith("/var/task")
);
const LOG_DIR = isServerless
  ? path.join(os.tmpdir(), "buygiftcards-logs")
  : path.join(process.cwd(), "logs");
const VISITOR_FILE = path.join(LOG_DIR, "visitors-state.json");

// Seed baseline for retail storefront social proof + real tracked increments
const BASELINE_VISITORS = 14820;

type VisitorState = {
  totalVisitors: number;
  totalPageHits: number;
  seenSessions: string[];
  activeHeartbeats: Record<string, number>;
};

let memoryState: VisitorState = {
  totalVisitors: BASELINE_VISITORS,
  totalPageHits: BASELINE_VISITORS * 3,
  seenSessions: [],
  activeHeartbeats: {},
};

let loadedFromDisk = false;

function loadState(): VisitorState {
  if (loadedFromDisk) return memoryState;
  loadedFromDisk = true;
  try {
    if (fs.existsSync(VISITOR_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VISITOR_FILE, "utf8"));
      if (parsed && typeof parsed.totalVisitors === "number") {
        memoryState = {
          totalVisitors: Math.max(BASELINE_VISITORS, parsed.totalVisitors),
          totalPageHits: Math.max(BASELINE_VISITORS * 3, parsed.totalPageHits || 0),
          seenSessions: Array.isArray(parsed.seenSessions) ? parsed.seenSessions.slice(-2000) : [],
          activeHeartbeats: parsed.activeHeartbeats || {},
        };
      }
    }
  } catch {}
  return memoryState;
}

function saveState(state: VisitorState) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.writeFileSync(VISITOR_FILE, JSON.stringify(state), "utf8");
  } catch {}
}

function pruneAndCountActive(state: VisitorState): number {
  const now = Date.now();
  const cutoff = now - 5 * 60 * 1000; // active within last 5 minutes
  let activeCount = 0;
  for (const [sid, ts] of Object.entries(state.activeHeartbeats)) {
    if (ts < cutoff) {
      delete state.activeHeartbeats[sid];
    } else {
      activeCount += 1;
    }
  }
  return Math.max(1, activeCount);
}

export async function POST(req: NextRequest) {
  const state = loadState();
  const body = await req.json().catch(() => ({}));
  const sessionId = String(body.sessionId || "anon").slice(0, 80);
  const isNewHit = Boolean(body.incrementHit);

  state.activeHeartbeats[sessionId] = Date.now();

  if (!state.seenSessions.includes(sessionId)) {
    state.seenSessions.push(sessionId);
    if (state.seenSessions.length > 2000) {
      state.seenSessions = state.seenSessions.slice(-2000);
    }
    state.totalVisitors += 1;
  }

  if (isNewHit) {
    state.totalPageHits += 1;
  }

  const activeNow = pruneAndCountActive(state);
  saveState(state);

  return NextResponse.json({
    totalVisitors: state.totalVisitors,
    totalPageHits: state.totalPageHits,
    activeNow,
  });
}

export async function GET() {
  const state = loadState();
  const activeNow = pruneAndCountActive(state);
  return NextResponse.json({
    totalVisitors: state.totalVisitors,
    totalPageHits: state.totalPageHits,
    activeNow,
  });
}
