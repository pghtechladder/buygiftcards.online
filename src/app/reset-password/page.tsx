"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PASSWORD_RULE_TEXT } from "@/lib/passwordRules";
import { CaptchaChallenge } from "@/components/CaptchaChallenge";

function RequestResetLinkForm() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Please enter your account email address.");
      return;
    }
    if (!captchaToken) {
      setError("Please solve the security check (CAPTCHA) below to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-turnstile-token": captchaToken,
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process password reset.");
        return;
      }
      setSuccess(
        data.message || "If an account with that email exists, we've sent a password reset link to your inbox."
      );
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="mail" size={26} className="text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-ink-900">Forgot Password</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          Enter your email address and we’ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleRequestReset} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Account Email</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
          />
        </div>

        {/* Security verification */}
        <CaptchaChallenge
          action="forgot_password"
          onVerify={(tok) => setCaptchaToken(tok)}
        />

        {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
        {success && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Icon name="checkCircle" size={16} className="text-green-600" />
              Reset Link Sent
            </div>
            {success}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Icon name="loader" size={16} className="animate-spin" />}
          {loading ? "Sending reset link…" : "Send Reset Link"}
        </button>

        <div className="text-center text-sm text-ink-600 pt-2">
          Remembered your password?{" "}
          <Link href="/" className="font-bold text-brand-600 hover:text-brand-700">
            Sign In
          </Link>
        </div>
      </form>
    </>
  );
}

// Reads useSearchParams, so it's isolated behind Suspense
function ResetPasswordWithTokenForm({ token }: { token: string }) {
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
          Back to Home & Sign In
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
            required
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
            required
            className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
          />
        </div>
        {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
        <button disabled={loading} className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50">
          {loading ? "Updating…" : "Reset Password"}
        </button>
      </form>
    </>
  );
}

function ResetPasswordContainer() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  if (token) {
    return <ResetPasswordWithTokenForm token={token} />;
  }
  return <RequestResetLinkForm />;
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white border border-ink-100 rounded-3xl p-8 sm:p-10 shadow-sm">
        <Suspense fallback={<div className="text-center text-sm text-ink-400 py-10">Loading…</div>}>
          <ResetPasswordContainer />
        </Suspense>
      </div>
    </div>
  );
}
