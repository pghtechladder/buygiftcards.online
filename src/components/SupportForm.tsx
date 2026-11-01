"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function SupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [category, setCategory] = useState("Order Issue");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          orderNumber: orderNumber || null,
          issueType: category,
          subject: subject || `${category} Inquiry`,
          description: message,
          priority: "HIGH",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create support ticket");
      setTicketNumber(data.ticket.ticketNumber);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="checkCircle" size={26} className="text-green-600" />
        </div>
        <h2 className="text-lg font-extrabold mb-1">Ticket Created</h2>
        {ticketNumber && (
          <div className="inline-block bg-brand-50 text-brand-700 font-mono font-bold text-xs px-3 py-1 rounded-full mb-3">
            {ticketNumber}
          </div>
        )}
        <p className="text-sm text-ink-600">
          Your issue details have been sent to <strong>support@buygiftcards.online</strong>. We'll get back to you at {email} promptly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Full Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Email Address *</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm"
          >
            <option value="Order Issue">Order Issue</option>
            <option value="Card Redemption">Card Redemption</option>
            <option value="Payment / Billing">Payment / Billing</option>
            <option value="Balance Check">Balance Check</option>
            <option value="Other">Other Question</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Order Number</label>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="BGC-..."
            className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Subject *</label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your inquiry"
          className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-ink-600 uppercase block mb-1.5">Issue Details *</label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please explain the issue or question in detail..."
          className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-xl bg-ink-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm text-sm"
      >
        {status === "loading" ? "Submitting Ticket..." : "Submit Support Ticket"}
      </button>
    </form>
  );
}
