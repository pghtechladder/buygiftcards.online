"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuthModal } from "@/context/AuthModalContext";
import { Icon } from "./Icon";
import { PASSWORD_RULE_TEXT, isValidPassword } from "@/lib/passwordRules";

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
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

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
    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div onClick={close} className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-[420px] w-full max-h-[90vh] overflow-y-auto p-8 animate-slide-in">
        <button onClick={close} aria-label="Close" className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 transition">
          <Icon name="x" size={20} />
        </button>

        <div className="flex gap-6 border-b border-ink-100 mb-6">
          <button
            onClick={() => open("signin")}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              mode === "signin" ? "text-brand-600 border-brand-500" : "text-ink-400 border-transparent hover:text-ink-600"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => open("register")}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              mode === "register" ? "text-brand-600 border-brand-500" : "text-ink-400 border-transparent hover:text-ink-600"
            }`}
          >
            Register
          </button>
        </div>

        {mode === "register" && (
          <div className="bg-brand-50 rounded-xl p-4 mb-6">
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

        {oauthProviders.length > 0 && (
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

        {mode === "signin" ? (
          <form onSubmit={submitSignin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Email</label>
              <input
                type="email"
                value={signinEmail}
                onChange={(e) => setSigninEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Password</label>
              <input
                type="password"
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div className="text-right">
              <Link href="/reset-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>

            {signinError && <div className="text-red-600 text-sm">{signinError}</div>}

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
        ) : (
          <form onSubmit={submitRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5">First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Phone (optional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1.5">Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
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
                className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

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

            {regError && <div className="text-red-600 text-sm">{regError}</div>}

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
