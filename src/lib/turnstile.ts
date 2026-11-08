/**
 * Server-side Cloudflare Turnstile verification (invisible behavioral CAPTCHA).
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Env:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — public widget key (client)
 *   TURNSTILE_SECRET_KEY            — secret key (server)
 *
 * If TURNSTILE_SECRET_KEY is not set, verification is skipped (logged) so the site keeps
 * working until keys are provisioned. Once set, requests without a valid token are rejected.
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
  if (!secret) return { ok: true, reason: "turnstile-not-configured" };
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
    // Fail closed: if Cloudflare is unreachable we do not let unverified traffic through.
    const reason = err instanceof Error ? err.message : String(err);
    writeTransactionLog({ phase: "PROCESS_ERROR", process: "Turnstile.Verify", error: reason });
    return { ok: false, reason: "verification-unavailable" };
  }
}

