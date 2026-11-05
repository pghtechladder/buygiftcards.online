"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Icon } from "./Icon";
import { PASSWORD_RULE_TEXT, isValidPassword } from "@/lib/passwordRules";

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-brand-50 text-brand-700",
  FULFILLED: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-ink-100 text-ink-600",
};

type Order = {
  orderNumber: string;
  customerEmail: string;
  hasAccount?: boolean;
  subtotalCents: number;
  totalCents: number;
  taxCents: number | null;
  status: string;
  createdAt: string;
  emailSentAt: string | null;
  emailError: string | null;
  billingLine1: string | null;
  billingLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  items: {
    id: string;
    brandName: string;
    denomCents: number;
    quantity: number;
    deliveryType: string;
    customPhotoUrl: string | null;
    codes: { id: string; code: string; pin: string; isDemo: boolean }[];
  }[];
};

export function OrderDetail({ orderNumber, email }: { orderNumber: string; email: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [enteredEmail, setEnteredEmail] = useState(email);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Post-payment account creation / sign-in state (locked to order.customerEmail)
  const [authTab, setAuthTab] = useState<"register" | "signin">("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lookup = async (e?: React.FormEvent, overrideEmail?: string) => {
    e?.preventDefault();
    const targetEmail = (overrideEmail ?? enteredEmail).trim();
    if (!targetEmail) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, email: targetEmail }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Order not found");
      return;
    }
    setOrder(data.order);
    if (data.order?.hasAccount) {
      setAuthTab("signin");
    } else {
      setAuthTab("register");
    }
  };

  useEffect(() => {
    if (email) {
      lookup(undefined, email);
    } else if (session?.user?.email && !order) {
      setEnteredEmail(session.user.email);
      lookup(undefined, session.user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, session?.user?.email]);

  const copyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code.replace(/\s/g, ""));
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {}
  };

  const handlePostPaymentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setAuthError(null);

    if (!firstName.trim() || !lastName.trim() || !password || !confirmPassword) {
      setAuthError("Please fill in all required fields to complete your account.");
      return;
    }
    if (!isValidPassword(password)) {
      setAuthError(PASSWORD_RULE_TEXT);
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: order.customerEmail,
          phone: phone.trim() || undefined,
          password,
          confirmPassword,
          marketingOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (String(data.error || "").toLowerCase().includes("already exists")) {
          setAuthTab("signin");
          setAuthError("An account with this email already exists. Please enter your password to sign in.");
        } else {
          setAuthError(data.error || "Could not create account.");
        }
        return;
      }

      const signInRes = await signIn("credentials", {
        email: order.customerEmail,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setAuthTab("signin");
        setAuthError("Account created! Please sign in with your password.");
      }
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePostPaymentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setAuthError(null);
    if (!password) {
      setAuthError("Please enter your password.");
      return;
    }
    setAuthLoading(true);
    try {
      const result = await signIn("credentials", {
        email: order.customerEmail,
        password,
        redirect: false,
      });
      if (result?.error) {
        setAuthError("Invalid password for this email account.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white border border-ink-100 rounded-3xl p-10 shadow-sm">
          <h1 className="text-xl font-extrabold mb-4">Confirm your email to view order {orderNumber}</h1>
          <form onSubmit={(e) => lookup(e)} className="space-y-4">
            <input
              value={enteredEmail}
              onChange={(e) => setEnteredEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button disabled={loading} className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50">
              {loading ? "Checking…" : "View Order"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const sessionEmail = session?.user?.email;
  const isSignedInAsBuyer =
    sessionStatus === "authenticated" &&
    typeof sessionEmail === "string" &&
    sessionEmail.trim().toLowerCase() === order.customerEmail.trim().toLowerCase();

  // If the customer completed PayPal checkout without signing in first,
  // present the Account Creation Page pre-filled and locked to the exact same PayPal email ID.
  if (sessionStatus !== "loading" && !isSignedInAsBuyer) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-white border border-ink-100 rounded-3xl p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200/80 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
              <Icon name="checkCircle" size={22} />
            </div>
            <div>
              <div className="text-sm font-extrabold text-green-950">
                PayPal Payment Completed · Order #{order.orderNumber}
              </div>
              <div className="text-xs text-green-800 mt-0.5">
                Total Paid: <strong>{fmt(order.totalCents)}</strong> · Linked to <strong>{order.customerEmail}</strong>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-ink-950 mb-1.5">
            {authTab === "register"
              ? "Create Your Account to Access Your Gift Cards"
              : "Sign In to Access Your Gift Cards"}
          </h1>
          <p className="text-sm text-ink-600 mb-6">
            {authTab === "register"
              ? "Complete your account setup below using the same email ID from your PayPal checkout to view and manage your gift cards."
              : "An account already exists for your PayPal email ID. Sign in below to access your order."}
          </p>

          <div className="flex gap-6 border-b border-ink-100 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthTab("register");
                setAuthError(null);
              }}
              className={`pb-3 text-sm font-bold border-b-2 transition ${
                authTab === "register"
                  ? "text-brand-600 border-brand-500"
                  : "text-ink-400 border-transparent hover:text-ink-600"
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab("signin");
                setAuthError(null);
              }}
              className={`pb-3 text-sm font-bold border-b-2 transition ${
                authTab === "signin"
                  ? "text-brand-600 border-brand-500"
                  : "text-ink-400 border-transparent hover:text-ink-600"
              }`}
            >
              Already Have an Account? Sign In
            </button>
          </div>

          {authTab === "register" ? (
            <form onSubmit={handlePostPaymentRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5">
                  Checkout Email ID (Matched from PayPal)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={order.customerEmail}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-ink-200 rounded-xl bg-ink-100/80 text-ink-700 font-semibold cursor-not-allowed outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                    Verified Email
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-600 mb-1.5">First name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    required
                    className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-600 mb-1.5">Last name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    required
                    className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                  />
                </div>
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
                <label className="block text-xs font-bold text-ink-600 mb-1.5">Create Password *</label>
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
                <label className="block text-xs font-bold text-ink-600 mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
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

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading && <Icon name="loader" size={16} className="animate-spin" />}
                {authLoading
                  ? "Creating Account & Linking Order…"
                  : `Create Account (${order.customerEmail}) & View Order`}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePostPaymentSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5">
                  Checkout Email ID (Matched from PayPal)
                </label>
                <input
                  type="email"
                  value={order.customerEmail}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-ink-200 rounded-xl bg-ink-100/80 text-ink-700 font-semibold cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                />
              </div>

              <div className="text-right">
                <Link href="/reset-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading && <Icon name="loader" size={16} className="animate-spin" />}
                {authLoading ? "Signing In…" : `Sign In (${order.customerEmail}) & View Order`}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Order {order.orderNumber}</h1>
          <div className="text-sm text-ink-400">{new Date(order.createdAt).toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-sm text-ink-600 mt-1.5">
            <Icon name="mail" size={14} className="text-ink-400" />
            {order.customerEmail}
          </div>
        </div>
        <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${STATUS_STYLE[order.status] || "bg-ink-100 text-ink-600"}`}>
          {order.status}
        </span>
      </div>

      <OrderStatusTimeline order={order} />

      {order.items.map((item) => (
        <div key={item.id} className="bg-white border border-ink-100 rounded-2xl p-6 mb-4">
          <div className="flex justify-between items-center mb-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {item.customPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.customPhotoUrl} alt="Your card photo" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <span className="font-extrabold truncate">{item.brandName}</span>
            </div>
            <span className="text-sm text-ink-600 flex-shrink-0">
              {fmt(item.denomCents)} × {item.quantity} · {item.deliveryType === "EGIFT" ? "eGift" : "Physical"}
            </span>
          </div>
          <div className="border-t border-ink-50 pt-3">
            {(() => {
              const orderCreatedAt = order ? new Date(order.createdAt).getTime() : 0;
              const unlockAt = orderCreatedAt + 5 * 60 * 1000;
              const remainingSecs = Math.max(0, Math.ceil((unlockAt - now) / 1000));
              const isLocked = remainingSecs > 0;
              const mins = Math.floor(remainingSecs / 60);
              const secs = remainingSecs % 60;
              const timeDisplay = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

              return item.codes.map((c) => {
                const isClaimUrl = /^https?:\/\//i.test(c.code);

                if (isLocked) {
                  return (
                    <div key={c.id} className="py-3 border-b border-dashed border-ink-100 last:border-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                            <Icon name="lock" size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-amber-950">
                              Security & Fraud Verification Window
                            </div>
                            <div className="text-[11px] text-amber-800">
                              Redemption link activates in <span className="font-mono font-extrabold text-amber-950">{timeDisplay}</span> (5 mins from order time)
                            </div>
                          </div>
                        </div>
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-200/70 text-amber-900 font-mono text-xs font-bold">
                          <span>Unlocks in {timeDisplay}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={c.id} className="py-3 border-b border-dashed border-ink-100 last:border-0">
                    {revealed[c.id] ? (
                      <div className="flex flex-wrap gap-3 items-center">
                        {isClaimUrl ? (
                          <>
                            <a
                              href={c.code}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition"
                            >
                              <Icon name="gift" size={16} />
                              Claim Gift Card
                            </a>
                            <button
                              onClick={() => copyCode(c.id, c.code)}
                              className="flex items-center gap-2 font-mono text-xs font-bold bg-ink-50 hover:bg-ink-100 px-3.5 py-2.5 rounded-lg transition max-w-full truncate"
                              title={c.code}
                            >
                              <span className="truncate max-w-[260px] sm:max-w-[360px]">{c.code}</span>
                              <Icon name={copiedId === c.id ? "checkCircle" : "copy"} size={14} className={copiedId === c.id ? "text-green-600" : "text-ink-400"} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => copyCode(c.id, c.code)}
                              className="flex items-center gap-2 font-mono font-bold bg-ink-50 hover:bg-ink-100 px-4 py-2 rounded-lg tracking-wider transition"
                            >
                              {c.code}
                              <Icon name={copiedId === c.id ? "checkCircle" : "copy"} size={14} className={copiedId === c.id ? "text-green-600" : "text-ink-400"} />
                            </button>
                            {c.pin && (
                              <div className="font-mono font-bold bg-ink-50 px-4 py-2 rounded-lg">PIN {c.pin}</div>
                            )}
                            {!c.pin.startsWith("REDEEMED") && (
                              <Link
                                href={`/redeem?code=${encodeURIComponent(c.code)}&pin=${encodeURIComponent(c.pin)}`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
                              >
                                <Icon name="gift" size={14} />
                                Redeem / Swap for Brand eGift Cards &rarr;
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-ink-400 tracking-widest">
                          {isClaimUrl ? "Claim Link ••••" : `•••• •••• •••• ${c.code.slice(-4)}`}
                        </span>
                        <button
                          onClick={() => setRevealed((p) => ({ ...p, [c.id]: true }))}
                          className="px-5 py-2 border-2 border-brand-600 text-brand-600 rounded-lg font-bold text-sm hover:bg-brand-600 hover:text-white transition"
                        >
                          {isClaimUrl ? "Reveal Claim Link" : "Reveal Code"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ))}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-ink-100 rounded-2xl p-6">
          <div className="flex justify-between text-sm text-ink-500 mb-1.5">
            <span>Subtotal</span>
            <span>{fmt(order.subtotalCents)}</span>
          </div>
          {!!order.taxCents && (
            <div className="flex justify-between text-sm text-ink-500 mb-1.5">
              <span>Tax</span>
              <span>{fmt(order.taxCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-lg pt-2 mt-2 border-t border-ink-100">
            <span>Total Paid</span>
            <span>{fmt(order.totalCents)}</span>
          </div>
        </div>
        {(order.billingLine1 || order.billingCity) && (
          <div className="bg-white border border-ink-100 rounded-2xl p-6">
            <div className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-2">Billing Address</div>
            <div className="text-sm text-ink-700 leading-relaxed">
              {order.billingLine1 && <div>{order.billingLine1}</div>}
              {order.billingLine2 && <div>{order.billingLine2}</div>}
              <div>{[order.billingCity, order.billingState, order.billingPostalCode].filter(Boolean).join(", ")}</div>
              {order.billingCountry && <div>{order.billingCountry}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type StepState = "done" | "failed" | "pending";

function StatusStep({ state, label, detail }: { state: StepState; label: string; detail?: string }) {
  const iconByState: Record<StepState, { name: "checkCircle" | "x" | "loader"; className: string; bg: string }> = {
    done: { name: "checkCircle", className: "text-green-600", bg: "bg-green-50" },
    failed: { name: "x", className: "text-red-600", bg: "bg-red-50" },
    pending: { name: "loader", className: "text-ink-400", bg: "bg-ink-100" },
  };
  const { name, className, bg } = iconByState[state];
  return (
    <div className="flex items-start gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon name={name} size={14} className={className} />
      </div>
      <div className="min-w-0">
        <div className={`text-sm font-bold ${state === "failed" ? "text-red-700" : "text-ink-900"}`}>{label}</div>
        {detail && <div className="text-xs text-ink-500 mt-0.5 break-words">{detail}</div>}
      </div>
    </div>
  );
}

function OrderStatusTimeline({ order }: { order: Order }) {
  const paymentOk = order.status !== "PENDING" && order.status !== "FAILED";
  const fulfilled = order.status === "FULFILLED" || order.status === "REFUNDED";

  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-6 mb-4 grid sm:grid-cols-4 gap-5">
      <StatusStep state="done" label="Order Placed" detail={new Date(order.createdAt).toLocaleString()} />
      <StatusStep
        state={order.status === "FAILED" ? "failed" : paymentOk ? "done" : "pending"}
        label="Payment"
        detail={order.status === "FAILED" ? "Payment failed" : paymentOk ? "Charged successfully" : "Awaiting payment"}
      />
      <StatusStep
        state={fulfilled ? "done" : "pending"}
        label="Gift Cards Issued"
        detail={fulfilled ? `${order.items.reduce((s, i) => s + i.quantity, 0)} code(s) generated` : "Not yet issued"}
      />
      <StatusStep
        state={order.emailSentAt ? "done" : order.emailError ? "failed" : "pending"}
        label="Confirmation Email"
        detail={
          order.emailSentAt
            ? `Sent ${new Date(order.emailSentAt).toLocaleString()}`
            : order.emailError
              ? `Failed: ${order.emailError}`
              : "Not sent yet"
        }
      />
    </div>
  );
}
