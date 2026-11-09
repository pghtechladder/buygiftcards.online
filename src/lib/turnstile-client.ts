"use client";

/**
 * Client helper: obtains a Cloudflare Turnstile token or renders interactive widget.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_ID = "cf-turnstile-script";

let scriptPromise: Promise<void> | null = null;

export function isTurnstileConfigured(): boolean {
  return Boolean(SITE_KEY && SITE_KEY.trim().length > 0);
}

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load security check. Please disable blockers and retry."));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export async function renderTurnstileWidget(
  container: HTMLElement,
  options: {
    action?: string;
    onSuccess: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
  }
): Promise<string> {
  if (!isTurnstileConfigured()) return "";
  await loadTurnstileScript();

  if (!window.turnstile) return "";

  return window.turnstile.render(container, {
    sitekey: SITE_KEY,
    action: options.action || "form",
    callback: options.onSuccess,
    "error-callback": options.onError,
    "expired-callback": options.onExpire,
  });
}

export function removeTurnstileWidget(widgetId: string): void {
  try {
    if (widgetId && window.turnstile) {
      window.turnstile.remove(widgetId);
    }
  } catch {}
}

export async function getTurnstileToken(action = "checkout"): Promise<string> {
  if (!SITE_KEY || typeof window === "undefined") return "";
  await loadTurnstileScript();

  return new Promise<string>((resolve, reject) => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.bottom = "12px";
    host.style.right = "12px";
    host.style.zIndex = "2147483647";
    document.body.appendChild(host);

    let widgetId = "";
    const cleanup = () => {
      try {
        if (widgetId) window.turnstile?.remove(widgetId);
      } catch {}
      host.remove();
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Security check timed out. Please try again."));
    }, 20_000);

    widgetId = window.turnstile!.render(host, {
      sitekey: SITE_KEY,
      action,
      appearance: "interaction-only", // invisible unless Cloudflare needs a human interaction
      callback: (token: string) => {
        clearTimeout(timer);
        cleanup();
        resolve(token);
      },
      "error-callback": () => {
        clearTimeout(timer);
        cleanup();
        reject(new Error("Security check failed. Please refresh and try again."));
      },
    });
  });
}
