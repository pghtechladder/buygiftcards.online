"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const STORAGE_KEY = "bgc_newsletter_dismissed_v1";

export function NewsletterModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    const t = setTimeout(() => setVisible(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("done");
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (!visible) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="newsletter-modal-title" className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div onClick={dismiss} className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-slide-in">
        <button onClick={dismiss} aria-label="Close newsletter dialog" className="absolute top-4 right-4 text-ink-500 hover:text-ink-900 transition">
          <Icon name="x" size={20} />
        </button>

        {status === "done" ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="checkCircle" size={26} className="text-green-600" />
            </div>
            <h2 id="newsletter-modal-title" className="text-lg font-extrabold mb-2">You&apos;re in</h2>
            <p className="text-sm text-ink-600">We&apos;ll email you about deals and new brands.</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
              <Icon name="mail" size={26} className="text-brand-600" />
            </div>
            <h2 id="newsletter-modal-title" className="text-xl font-extrabold mb-2">Get gift card deals in your inbox</h2>
            <p className="text-sm text-ink-600 mb-5">
              Subscribe for discounts, promotions, and new brand drops. No spam — unsubscribe anytime.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <input
                required
                type="email"
                aria-label="Email address for gift card deals"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                disabled={status === "loading"}
                className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50"
              >
                {status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
            <button onClick={dismiss} className="w-full text-center text-xs text-ink-600 mt-3 hover:text-ink-900 transition">
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
