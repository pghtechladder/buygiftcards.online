"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { VisitorCounter } from "./VisitorCounter";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  actions?: Array<{ label: string; query?: string; openTicket?: boolean }>;
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);

  // Ticket Form States
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketOrder, setTicketOrder] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Order Issue");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-1",
      sender: "bot",
      text: "👋 Hi! Welcome to Customer Support. You can get instant automated answers to your questions, or open a support ticket and our team at support@buygiftcards.online will resolve it for you!",
      time: "Just now",
      actions: [
        { label: "🎫 Open a Support Ticket", openTicket: true },
        { label: "📦 Track an order", query: "How do I track my order?" },
        { label: "⚡ Delivery speed", query: "How quickly are eGift cards delivered?" },
        { label: "💳 Check balance", query: "How do I check my card balance?" },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !showTicketForm) {
      scrollToBottom();
    }
  }, [messages, isOpen, showTicketForm]);

  const handleSend = async (textToSend?: string) => {
    const userText = (textToSend || inputValue).trim();
    if (!userText) return;

    if (!textToSend) {
      setInputValue("");
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();

      setIsTyping(false);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply || "Thanks for reaching out! You can open a support ticket to have our team look into this.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          ...(data.suggestedActions || [{ label: "🎫 Open a Support Ticket", openTicket: true }]),
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Thanks for your question! If you'd like our team to investigate, please submit a quick support ticket.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actions: [{ label: "🎫 Open a Support Ticket", openTicket: true }],
        },
      ]);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitting(true);
    setTicketError(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ticketName,
          email: ticketEmail,
          orderNumber: ticketOrder || null,
          subject: ticketSubject || `${ticketCategory} issue`,
          issueType: ticketCategory,
          description: ticketDescription,
          priority: "HIGH",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket");

      setTicketSuccess(data.ticket.ticketNumber);
      setTicketSubmitting(false);

      // Add success confirmation message into chat history
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "bot",
          text: `✅ Ticket #${data.ticket.ticketNumber} created successfully! Our support desk has received your issue details at support@buygiftcards.online and we will reply to ${ticketEmail} promptly.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setTicketSubmitting(false);
      setTicketError(err instanceof Error ? err.message : "Something went wrong creating your ticket.");
    }
  };

  return (
    <>
      {/* Floating Widget Trigger Button + Bottom-Right Website Visitor Counter */}
      <div className="fixed bottom-20 md:bottom-5 right-4 sm:right-6 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <div className="bg-white border border-ink-100 shadow-xl rounded-2xl p-3 max-w-[260px] text-xs text-ink-700 animate-bounce duration-1000 hidden sm:flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span>Need help or have an issue? Chat with support!</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Quick Ticket Action Button */}
          <button
            onClick={() => {
              setIsOpen(true);
              setShowTicketForm(true);
            }}
            aria-label="Create Support Ticket"
            title="Create a support ticket"
            className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg hover:bg-brand-700 hover:scale-105 active:scale-95 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </button>

          {/* AI Chat Drawer Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Open AI Assistant & Support Chat"
            className="h-11 px-4 rounded-full bg-ink-900 text-white flex items-center gap-2 shadow-xl hover:bg-ink-800 hover:scale-105 active:scale-95 transition font-semibold text-xs sm:text-sm"
          >
            {isOpen ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span>Help &amp; Support</span>
              </>
            )}
          </button>
        </div>

        {/* Website Visitor Counter at Bottom-Right */}
        <VisitorCounter />
      </div>

      {/* Slide-out / Modal Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-ink-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-brand-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                🎫
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  Customer Help Desk
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <div className="text-[11px] text-white/80">
                  {showTicketForm ? "Submit an Issue Ticket" : "Instant FAQ & Ticket Management"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {showTicketForm && (
                <button
                  onClick={() => setShowTicketForm(false)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                >
                  ← Back to Chat
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Ticket Action Bar */}
          {!showTicketForm && (
            <div className="bg-brand-50 px-4 py-2 border-b border-brand-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-brand-900 font-medium">
                <span className="w-2 h-2 rounded-full bg-brand-600" />
                <span>Support Desk: <strong>support@buygiftcards.online</strong></span>
              </div>
              <button
                onClick={() => setShowTicketForm(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1 rounded-full shadow-sm transition"
              >
                <span>Create Ticket</span>
                <span className="text-xs">+</span>
              </button>
            </div>
          )}

          {/* Body Content: Either Ticket Submission Form or Chat History */}
          {showTicketForm ? (
            <div className="flex-1 p-5 overflow-y-auto bg-ink-50/30 text-sm">
              {ticketSuccess ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-extrabold text-ink-900 mb-1">Ticket Submitted!</h3>
                  <div className="inline-block bg-brand-50 text-brand-700 font-mono font-bold text-sm px-3 py-1 rounded-full mb-3">
                    {ticketSuccess}
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed mb-6">
                    Your request has been routed directly to our support engineers at <strong>support@buygiftcards.online</strong>. We have also sent a confirmation to your email.
                  </p>
                  <button
                    onClick={() => {
                      setTicketSuccess(null);
                      setShowTicketForm(false);
                      setTicketSubject("");
                      setTicketDescription("");
                    }}
                    className="bg-brand-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-brand-700 transition"
                  >
                    Return to Chat
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateTicket} className="space-y-3.5">
                  <div className="bg-white border border-brand-200 rounded-2xl p-3.5 text-xs text-ink-700 mb-2">
                    Describe your issue below. Our team will investigate immediately and reply to your email address.
                  </div>

                  {ticketError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                      {ticketError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-ink-600 uppercase block mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white border border-ink-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-ink-600 uppercase block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full bg-white border border-ink-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-ink-600 uppercase block mb-1">Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full bg-white border border-ink-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
                      >
                        <option value="Order & Delivery">Order &amp; Delivery</option>
                        <option value="Card Redemption">Card Redemption</option>
                        <option value="Payment Issue">Payment Issue</option>
                        <option value="Balance Inquiry">Balance Inquiry</option>
                        <option value="General Question">General Question</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-ink-600 uppercase block mb-1">Order # (optional)</label>
                      <input
                        type="text"
                        value={ticketOrder}
                        onChange={(e) => setTicketOrder(e.target.value)}
                        placeholder="BGC-..."
                        className="w-full bg-white border border-ink-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase block mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief summary of the issue"
                      className="w-full bg-white border border-ink-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase block mb-1">Details &amp; Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Please provide full details so we can resolve this immediately..."
                      className="w-full bg-white border border-ink-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTicketForm(false)}
                      className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={ticketSubmitting}
                      className="px-5 py-2.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl shadow transition"
                    >
                      {ticketSubmitting ? "Creating Ticket..." : "Submit Ticket"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-ink-50/40 text-sm">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        msg.sender === "user"
                          ? "bg-brand-600 text-white rounded-tr-none shadow-sm"
                          : "bg-white text-ink-900 border border-ink-100 rounded-tl-none shadow-sm leading-relaxed"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-ink-400 mt-1 px-1">{msg.time}</span>

                    {/* Interactive Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                        {msg.actions.map((action, i) =>
                          action.openTicket ? (
                            <button
                              key={i}
                              onClick={() => setShowTicketForm(true)}
                              className="text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-sm"
                            >
                              {action.label}
                            </button>
                          ) : (
                            <button
                              key={i}
                              onClick={() => handleSend(action.query)}
                              className="text-xs font-medium bg-white hover:bg-ink-100 text-brand-700 border border-ink-200 px-3 py-1 rounded-full transition shadow-2xs"
                            >
                              {action.label}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1 text-ink-400 text-xs px-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px]">Assistant is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Links Footer */}
              <div className="bg-white px-3 py-1.5 border-t border-ink-100 flex items-center justify-around text-[11px] text-ink-500">
                <button
                  onClick={() => setShowTicketForm(true)}
                  className="text-brand-600 font-semibold hover:underline"
                >
                  🎫 Open Ticket
                </button>
                <span className="text-ink-300">•</span>
                <Link href="/track-order" className="hover:text-brand-600 transition">
                  📦 Track Order
                </Link>
                <span className="text-ink-300">•</span>
                <Link href="/balance" className="hover:text-brand-600 transition">
                  💳 Check Balance
                </Link>
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 bg-white border-t border-ink-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question or describe an issue..."
                  className="flex-1 bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                  className="w-9 h-9 rounded-xl bg-brand-600 disabled:opacity-40 text-white flex items-center justify-center hover:bg-brand-700 transition flex-shrink-0"
                >
                  <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
