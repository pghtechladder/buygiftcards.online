"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PASSWORD_RULE_TEXT } from "@/lib/passwordRules";

// Reads useSearchParams, so it's isolated behind Suspense — same pattern
// Nav.tsx uses for its own searchParams usage.
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="checkCircle" size={26} className="text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold mb-1.5">Password updated</h1>
        <p className="text-sm text-ink-500 mb-8">Your password has been reset. You can now sign in with your new password.</p>
        <Link
          href="/"
          className="inline-block w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="lock" size={26} className="text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold">Reset Your Password</h1>
        <p className="text-sm text-ink-500 mt-1.5">Choose a new password for your account.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
          />
          <p className="text-xs text-ink-400 mt-1.5">{PASSWORD_RULE_TEXT}</p>
        </div>
        <div>
          <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={loading} className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50">
          {loading ? "Updating…" : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white border border-ink-100 rounded-3xl p-10 shadow-sm">
        <Suspense fallback={<div className="text-center text-sm text-ink-400 py-10">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
