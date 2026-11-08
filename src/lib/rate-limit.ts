/**
 * Sliding-window rate limiter used by `src/middleware.ts` to throttle abuse-prone
 * endpoints (checkout / carding, login / credential stuffing, gift-card redeem brute force).
 *
 * NOTE: state lives in memory per edge/serverless instance. It reliably stops bursts from a
 * single IP hitting one instance, but is NOT a global counter across all Vercel regions.
 * For a global limit, put Cloudflare / Vercel WAF rate-limiting rules in front (see SECURITY.md).
 */

export type RateLimitRule = {
  /** Bucket name (used in the key + logs) */
  name: string;
  /** Path prefixes the rule applies to */
  prefixes: string[];
  /** Max requests per window */
  limit: number;
  /** Window size in ms */
  windowMs: number;
  /** Only count these methods (default: all) */
  methods?: string[];
};

export const RATE_LIMIT_RULES: RateLimitRule[] = [
  // Credential stuffing: login, register, password reset
  {
    name: "auth",
    prefixes: [
      "/api/auth/callback/credentials",
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
    ],
    limit: 5,
    windowMs: 60_000,
    methods: ["POST"],
  },
  // Carding: creating / capturing payment orders
  {
    name: "checkout",
    prefixes: ["/api/checkout"],
    limit: 10,
    windowMs: 60_000,
    methods: ["POST"],
  },
  // Gift-card number/PIN brute force
  {
    name: "redeem",
    prefixes: ["/api/redeem", "/api/orders/lookup"],
    limit: 10,
    windowMs: 60_000,
  },
  // Form spam / uploads
  {
    name: "forms",
    prefixes: ["/api/support", "/api/subscribe", "/api/tickets", "/api/business/quote", "/api/upload-photo", "/api/chat"],
    limit: 15,
    windowMs: 60_000,
    methods: ["POST"],
  },
  // Generic API ceiling (scraping)
  {
    name: "api",
    prefixes: ["/api/"],
    limit: 120,
    windowMs: 60_000,
  },
];

// Never throttle signed provider callbacks
const EXEMPT_PREFIXES = ["/api/webhooks/"];

const hits = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, stamps] of hits) {
    const fresh = stamps.filter((t) => now - t < 10 * 60_000);
    if (fresh.length) hits.set(key, fresh);
    else hits.delete(key);
  }
}

export function findRule(pathname: string, method: string): RateLimitRule | null {
  if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  for (const rule of RATE_LIMIT_RULES) {
    if (rule.methods && !rule.methods.includes(method)) continue;
    if (rule.prefixes.some((p) => pathname.startsWith(p))) return rule;
  }
  return null;
}

export function checkRateLimit(
  ip: string,
  rule: RateLimitRule,
  now = Date.now()
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  sweep(now);
  const key = `${rule.name}:${ip}`;
  const stamps = (hits.get(key) || []).filter((t) => now - t < rule.windowMs);
  if (stamps.length >= rule.limit) {
    hits.set(key, stamps);
    const retryAfterSec = Math.max(1, Math.ceil((rule.windowMs - (now - stamps[0])) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }
  stamps.push(now);
  hits.set(key, stamps);
  return { allowed: true, remaining: rule.limit - stamps.length, retryAfterSec: 0 };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

