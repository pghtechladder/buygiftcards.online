"use client";

/**
 * Client helper: obtains an invisible Cloudflare Turnstile token right before a sensitive
 * request (checkout, register, password reset). Returns "" when no site key is configured.
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

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
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

export async function getTurnstileToken(action = "checkout"): Promise<string> {
  if (!SITE_KEY || typeof window === "undefined") return "";
  await loadScript();

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

