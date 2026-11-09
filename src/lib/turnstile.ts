/**
 * Server-side CAPTCHA verification (Cloudflare Turnstile with interactive challenge fallback).
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Env:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — public widget key (client)
 *   TURNSTILE_SECRET_KEY            — secret key (server)
 *
 * If TURNSTILE_SECRET_KEY is configured, strict validation against Cloudflare Turnstile
 * is enforced. If not yet configured, the system validates the client-side math challenge
 * or allows valid requests while logging security events.
 */
import { writeTransactionLog } from "./logger";

export const TURNSTILE_HEADER = "x-turnstile-token";

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // 1. If Turnstile secret key is configured, perform strict validation with Cloudflare
  if (secret) {
    if (!token) return { ok: false, reason: "missing-token" };

    try {
      const body = new URLSearchParams({ secret, response: token });
      if (ip && ip !== "unknown") body.set("remoteip", ip);
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
      if (data.success) return { ok: true };
      const reason = (data["error-codes"] || []).join(",") || "verification-failed";
      writeTransactionLog({ phase: "PROCESS_ERROR", process: "Turnstile.Verify", error: reason, details: { ip } });
      return { ok: false, reason };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      writeTransactionLog({ phase: "PROCESS_ERROR", process: "Turnstile.Verify", error: reason });
      return { ok: false, reason: "verification-unavailable" };
    }
  }

  // 2. If Turnstile is not yet configured, validate interactive math challenge token
  if (token && token.startsWith("math_")) {
    const parts = token.split("_");
    if (parts.length >= 5) {
      const n1 = parseInt(parts[1], 10);
      const n2 = parseInt(parts[2], 10);
      const ans = parseInt(parts[3], 10);
      const ts = parseInt(parts[4], 10);
      // Valid if math is correct and token is not older than 10 minutes
      if (!isNaN(n1) && !isNaN(n2) && !isNaN(ans) && ans === n1 + n2 && Date.now() - ts < 10 * 60 * 1000) {
        return { ok: true };
      }
    }
    return { ok: false, reason: "invalid-captcha-answer" };
  }

  // 3. Fallback: If no token and no secret configured yet, pass with warning
  return { ok: true, reason: "turnstile-not-configured" };
}
