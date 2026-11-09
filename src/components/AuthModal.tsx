"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuthModal } from "@/context/AuthModalContext";
import { Icon } from "./Icon";
import { PASSWORD_RULE_TEXT, isValidPassword } from "@/lib/passwordRules";
import { getTurnstileToken } from "@/lib/turnstile-client";
import { CaptchaChallenge } from "./CaptchaChallenge";

type OAuthProviderId = "google" | "facebook" | "apple";

const OAUTH_LABELS: Record<OAuthProviderId, string> = {
  google: "Continue with Google",
  facebook: "Continue with Facebook",
  apple: "Continue with Apple",
};

export function AuthModal() {
  const { isOpen, mode, open, close } = useAuthModal();
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderId[]>([]);

  // Sign-in form state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinLoading, setSigninLoading] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);

  // Register form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [regCaptchaToken, setRegCaptchaToken] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCaptchaToken, setForgotCaptchaToken] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Email OTP verification state after registration
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyOtpInput, setVerifyOtpInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        const ids = Object.keys(data).filter((id) => id !== "credentials") as OAuthProviderId[];
        setOauthProviders(ids.filter((id) => id in OAUTH_LABELS));
      })
      .catch(() => setOauthProviders([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const submitSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninError(null);
    if (!signinEmail || !signinPassword) {
      setSigninError("Please enter your email and password.");
      return;
    }
    setSigninLoading(true);
    try {
      const result = await signIn("credentials", {
        email: signinEmail,
        password: signinPassword,
        redirect: false,
      });
      if (result?.error) {
        setSigninError("Invalid email or password");
        return;
      }
      close();
    } finally {
      setSigninLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!firstName || !lastName || !regEmail || !regPassword || !confirmPassword) {
      setRegError("Please fill in all required fields.");
      return;
    }
    if (!isValidPassword(regPassword)) {
      setRegError(PASSWORD_RULE_TEXT);
      return;
    }
    if (confirmPassword !== regPassword) {
      setRegError("Passwords don't match.");
      return;
    }
    if (!regCaptchaToken) {
      setRegError("Please solve the security check (CAPTCHA) below to continue.");
      return;
    }

    setRegLoading(true);
    try {
      // Use explicit captcha token from widget, or obtain turnstile background token
      const turnstileToken = regCaptchaToken || (await getTurnstileToken("register"));
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(turnstileToken ? { "x-turnstile-token": turnstileToken } : {}),
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: regEmail,
          phone: phone || undefined,
          password: regPassword,
          confirmPassword,
          marketingOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Something went wrong");
        return;
      }
      if (data.requiresVerification) {
        setVerifyMode(true);
        setResendCooldown(60);
        return;
      }
      const result = await signIn("credentials", {
        email: regEmail,
        password: regPassword,
        redirect: false,
      });
      if (result?.error) {
        setRegError("Account created — please sign in.");
        open("signin");
        return;
      }
      close();
    } catch {
      setRegError("Something went wrong");
    } finally {
      setRegLoading(false);
    }
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail) {
      setForgotError("Please enter your account email address.");
      return;
    }
    if (!forgotCaptchaToken) {
      setForgotError("Please solve the security check (CAPTCHA) below to continue.");
      return;
    }

    setForgotLoading(true);
    try {
      const turnstileToken = forgotCaptchaToken || (await getTurnstileToken("forgot_password"));
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(turnstileToken ? { "x-turnstile-token": turnstileToken } : {}),
        },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Failed to process password reset.");
        return;
      }
      setForgotSuccess(
        data.message || "If an account with that email exists, we've sent a password reset link to your inbox."
      );
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const submitVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    const cleanOtp = verifyOtpInput.trim();
    if (cleanOtp.length !== 6) {
      setVerifyError("Please enter all 6 digits of your verification code.");
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim().toLowerCase(), otp: cleanOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Verification failed. Please try again.");
        return;
      }
      // Successfully verified! Sign in automatically with credentials
      const result = await signIn("credentials", {
        email: regEmail,
        password: regPassword,
        redirect: false,
      });
      if (result?.error) {
        setVerifyError("Verified! Please sign in with your credentials.");
        setVerifyMode(false);
        open("signin");
        return;
      }
      setVerifyMode(false);
      close();
    } catch {
      setVerifyError("Something went wrong. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await fetch("/api/auth/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim().toLowerCase() }),
      });
      setResendCooldown(60);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div onClick={close} className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-[440px] w-full max-h-[90vh] overflow-y-auto p-7 animate-slide-in">
        <button onClick={close} aria-label="Close" className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 transition">
          <Icon name="x" size={20} />
        </button>

        {!verifyMode && mode !== "forgot" ? (
          <div className="flex gap-6 border-b border-ink-100 mb-6">
            <button
              onClick={() => { setVerifyMode(false); open("signin"); }}
              className={`pb-3 text-sm font-bold border-b-2 transition ${
                mode === "signin" ? "text-brand-600 border-brand-500" : "text-ink-400 border-transparent hover:text-ink-600"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setVerifyMode(false); open("register"); }}
              className={`pb-3 text-sm font-bold border-b-2 transition ${
                mode === "register" ? "text-brand-600 border-brand-500" : "text-ink-400 border-transparent hover:text-ink-600"
              }`}
            >
              Register
            </button>
          </div>
        ) : !verifyMode && mode === "forgot" ? (
          <div className="border-b border-ink-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => open("signin")}
                className="text-xs font-bold text-ink-400 hover:text-ink-700 flex items-center gap-1 transition"
              >
                &larr; Back to Sign in
              </button>
            </div>
            <h2 className="text-xl font-bold text-ink-900 mt-2">Reset Password</h2>
            <p className="text-xs text-ink-500 mt-1">
              Enter your email and we’ll send you a secure link to create a new password.
            </p>
          </div>
        ) : null}

        {mode === "register" && !verifyMode && (
          <div className="bg-brand-50 rounded-xl p-4 mb-5">
            <div className="text-xs font-bold text-brand-700 mb-2 uppercase tracking-wide">Benefits of registering</div>
            <ul className="space-y-1.5 text-sm text-ink-800">
              <li className="flex items-start gap-2">
                <Icon name="checkCircle" size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                View your order history in one place
              </li>
              <li className="flex items-start gap-2">
                <Icon name="checkCircle" size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                Faster checkout — your email is remembered
              </li>
              <li className="flex items-start gap-2">
                <Icon name="checkCircle" size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                Optional: get emailed about new brands and deals
              </li>
            </ul>
          </div>
        )}

        {!verifyMode && mode !== "forgot" && oauthProviders.length > 0 && (
          <>
            <div className="space-y-2.5 mb-5">
              {oauthProviders.map((id) => (
                <button
                  key={id}
                  onClick={() => signIn(id)}
                  className="w-full py-3 rounded-xl border-2 border-ink-100 font-semibold text-sm text-ink-800 hover:bg-ink-50 transition"
                >
                  {OAUTH_LABELS[id]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-ink-100" />
              <span className="text-xs text-ink-400">Or use your email</span>
              <div className="flex-1 h-px bg-ink-100" />
            </div>
          </>
        )}

        {verifyMode ? (
          <form onSubmit={submitVerifyOtp} className="space-y-4">
            <div className="text-center space-y-2 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Icon name="mail" size={24} />
              </div>
              <h2 className="text-xl font-extrabold text-ink-950">Verify Your Email</h2>
              <p className="text-xs text-ink-600 leading-relaxed max-w-sm mx-auto">
                We sent a 6-digit verification code to <strong>{regEmail}</strong>. Please enter the code below to complete your registration.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1.5 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={verifyOtpInput}
                onChange={(e) => setVerifyOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoFocus
                required
                className="w-full px-4 py-3 text-center text-2xl font-extrabold tracking-widest border-2 border-brand-200 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 font-mono transition"
              />
            </div>

            {verifyError && (
              <div className="text-red-600 text-xs font-semibold bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <Icon name="x" size={14} className="flex-shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifyLoading || verifyOtpInput.trim().length !== 6}
              className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-extrabold text-sm hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {verifyLoading && <Icon name="loader" size={16} className="animate-spin" />}
              <span>{verifyLoading ? "Verifying code…" : "Verify & Sign In"}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-ink-500 pt-2 border-t border-ink-100">
              <button
                type="button"
                onClick={() => setVerifyMode(false)}
                className="font-semibold text-ink-500 hover:text-ink-800 underline"
              >
                &larr; Back to registration
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="font-bold text-brand-600 hover:text-brand-700 disabled:opacity-40"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend Code"}
              </button>
            </div>
          </form>
        ) : mode === "signin" ? (
          <form onSubmit={submitSignin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Email</label>
              <input
                type="email"
                value={signinEmail}
                onChange={(e) => setSigninEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Password</label>
              <input
                type="password"
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(signinEmail);
                  open("forgot");
                }}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
              >
                Forgot password?
              </button>
            </div>

            {signinError && <div className="text-red-600 text-sm font-medium">{signinError}</div>}

            <button
              disabled={signinLoading}
              className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {signinLoading && <Icon name="loader" size={16} className="animate-spin" />}
              {signinLoading ? "Signing in…" : "Sign in"}
            </button>

            <div className="text-center text-sm text-ink-600">
              New here?{" "}
              <button type="button" onClick={() => open("register")} className="font-bold text-brand-600 hover:text-brand-700">
                Register
              </button>
            </div>
          </form>
        ) : mode === "forgot" ? (
          <form onSubmit={submitForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Your Account Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            {/* Interactive CAPTCHA challenge */}
            <CaptchaChallenge
              action="forgot_password"
              onVerify={(token) => setForgotCaptchaToken(token)}
            />

            {forgotError && <div className="text-red-600 text-sm font-medium">{forgotError}</div>}
            {forgotSuccess && (
              <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Icon name="checkCircle" size={16} className="text-green-600" />
                  Email Dispatched
                </div>
                {forgotSuccess}
              </div>
            )}

            <button
              disabled={forgotLoading}
              className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {forgotLoading && <Icon name="loader" size={16} className="animate-spin" />}
              {forgotLoading ? "Sending reset link…" : "Send Reset Link"}
            </button>

            <div className="text-center text-sm text-ink-600">
              Remembered your password?{" "}
              <button type="button" onClick={() => open("signin")} className="font-bold text-brand-600 hover:text-brand-700">
                Sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5">First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Phone (optional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
              <p className="text-xs text-ink-400 mt-1.5">{PASSWORD_RULE_TEXT}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            {/* Interactive CAPTCHA check for account creation */}
            <CaptchaChallenge
              action="register"
              onVerify={(token) => setRegCaptchaToken(token)}
            />

            <label className="flex items-start gap-2.5 text-xs text-ink-600">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Sign me up for emails about deals and new brands. By registering you agree to the{" "}
                <Link href="/terms" className="font-semibold text-brand-600 hover:text-brand-700">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-semibold text-brand-600 hover:text-brand-700">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {regError && <div className="text-red-600 text-sm font-medium">{regError}</div>}

            <button
              disabled={regLoading}
              className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {regLoading && <Icon name="loader" size={16} className="animate-spin" />}
              {regLoading ? "Creating account…" : "Create account"}
            </button>

            <div className="text-center text-sm text-ink-600">
              Already have an account?{" "}
              <button type="button" onClick={() => open("signin")} className="font-bold text-brand-600 hover:text-brand-700">
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
