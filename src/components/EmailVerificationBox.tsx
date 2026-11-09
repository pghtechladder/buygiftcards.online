"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/Icon";
import { getTurnstileToken } from "@/lib/turnstile-client";

interface EmailVerificationBoxProps {
  initialEmail?: string;
  onVerified: (email: string, token: string) => void;
  isVerified?: boolean;
}

export function EmailVerificationBox({
  initialEmail = "",
  onVerified,
  isVerified: externalVerified = false,
}: EmailVerificationBoxProps) {
  const { data: session } = useSession();

  const [email, setEmail] = useState(
    initialEmail || (session?.user?.email ?? "")
  );
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verified, setVerified] = useState(externalVerified);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // Sync session email when session loads
  useEffect(() => {
    if (session?.user?.email && !email) {
      setEmail(session.user.email);
    }
    // Check if session user already has verified email
    const isSessionVerified = (session?.user as unknown as { emailVerified?: boolean })?.emailVerified;
    if (isSessionVerified && session?.user?.email) {
      setVerified(true);
      setVerifiedEmail(session.user.email);
      onVerified(session.user.email, "session_verified");
    }
  }, [session, email, onVerified]);

  // Check stored verification token in localStorage
  useEffect(() => {
    if (verified) return;
    try {
      const activeEmail = (email || session?.user?.email || "").trim().toLowerCase();
      if (!activeEmail) return;

      const storedToken = localStorage.getItem(`bgc_verified_token_${activeEmail}`);
      if (storedToken) {
        // Double check status with server
        fetch(`/api/auth/verification-status?email=${encodeURIComponent(activeEmail)}&token=${encodeURIComponent(storedToken)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.emailVerified) {
              setVerified(true);
              setVerifiedEmail(activeEmail);
              onVerified(activeEmail, storedToken);
            }
          })
          .catch(() => null);
      }
    } catch {
      // Ignore storage errors
    }
  }, [email, session?.user?.email, verified, onVerified]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtp = async () => {
    setError(null);
    setSuccessMsg(null);
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const turnstileToken = await getTurnstileToken("verify_email");
      const res = await fetch("/api/auth/send-verification-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(turnstileToken ? { "x-turnstile-token": turnstileToken } : {}),
        },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      setCodeSent(true);
      setResendCooldown(60);
      setSuccessMsg(`We just sent a 6-digit code to ${targetEmail}. Please check your inbox.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setSuccessMsg(null);
    const targetEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, otp: cleanOtp }),
      });

      const data = await res.json();
      if (!res.ok || !data.verificationToken) {
        throw new Error(data.error || "Invalid verification code");
      }

      setVerified(true);
      setVerifiedEmail(targetEmail);
      try {
        localStorage.setItem(`bgc_verified_token_${targetEmail}`, data.verificationToken);
      } catch {
        // Ignore storage errors
      }
      onVerified(targetEmail, data.verificationToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Icon name="checkCircle" size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Email Verified</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                  Ready to Pay
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                Digital gift cards will be sent to <strong>{verifiedEmail}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setVerified(false);
              setCodeSent(false);
              setOtp("");
            }}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline flex-shrink-0"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-4 sm:p-5 space-y-3.5 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="shield" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink-950">
              Step 1: Verify Your Email Address
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Required for Checkout
            </span>
          </div>
          <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">
            To prevent fraud and guarantee delivery of your gift cards, please verify your email before selecting a payment method.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2 font-medium">
          <Icon name="x" size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && !error && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 font-medium">
          <Icon name="checkCircle" size={14} className="flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {!codeSent ? (
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="relative flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email (e.g. name@example.com)"
              disabled={loading}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium border-2 border-brand-200 focus:border-brand-600 focus:outline-none rounded-xl bg-white text-ink-950 placeholder-ink-400"
            />
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={loading || !email.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
          >
            {loading ? (
              <span className="inline-block animate-spin">⌛</span>
            ) : (
              <Icon name="mail" size={14} />
            )}
            <span>Send Verification Code</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code (e.g. 123456)"
                disabled={loading}
                autoFocus
                className="w-full px-3.5 py-2.5 text-center sm:text-left text-sm font-extrabold tracking-widest border-2 border-brand-300 focus:border-brand-600 focus:outline-none rounded-xl bg-white text-ink-950 placeholder-ink-300 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading || otp.trim().length !== 6}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
            >
              {loading ? (
                <span className="inline-block animate-spin">⌛</span>
              ) : (
                <Icon name="checkCircle" size={14} />
              )}
              <span>Verify & Unlock Checkout</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-ink-500 pt-1">
            <span>
              Sent to <strong>{email}</strong>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCodeSent(false)}
                className="text-ink-400 hover:text-ink-700 underline"
              >
                Change email
              </button>
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading || resendCooldown > 0}
                className="font-bold text-brand-600 hover:text-brand-700 disabled:opacity-40"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
