"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  actions?: Array<{ label: string; query?: string; whatsapp?: boolean }>;
}

const WHATSAPP_NUMBER = "917305022840";
const WHATSAPP_DISPLAY = "+91 73050 22840";

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-1",
      sender: "bot",
      text: "👋 Hi! Welcome to buygiftcards.online. How can we help you today? Ask our AI assistant or chat with us directly on WhatsApp!",
      time: "Just now",
      actions: [
        { label: "💬 Chat on WhatsApp", whatsapp: true },
        { label: "📦 How to track order?", query: "How do I track my order?" },
        { label: "⚡ Delivery speed?", query: "How fast is delivery?" },
        { label: "💳 Check balance", query: "How to check my balance?" },
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
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const openWhatsApp = (customText?: string) => {
    const defaultText = "Hello buygiftcards.online team! I have a question regarding my gift card order.";
    const textToSend = encodeURIComponent(customText || defaultText);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${textToSend}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
        text: data.reply || "Thanks for your question! Connect with our team on WhatsApp for instant assistance.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: `📲 Chat on WhatsApp (${WHATSAPP_DISPLAY})`, whatsapp: true },
          ...(data.suggestedActions || []),
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
          text: "Thanks for your message! Our team responds instantly on WhatsApp. Click below to continue our chat there.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actions: [{ label: `💬 Open WhatsApp (${WHATSAPP_DISPLAY})`, whatsapp: true }],
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Widget Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">
        {!isOpen && (
          <div className="bg-white border border-ink-100 shadow-xl rounded-2xl p-3 max-w-[260px] text-xs text-ink-700 animate-bounce duration-1000 hidden sm:flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span>Need help or have questions? Chat with us live!</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Quick WhatsApp Button */}
          <button
            onClick={() => openWhatsApp()}
            aria-label="Direct WhatsApp Chat"
            title="Chat directly on WhatsApp"
            className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:bg-[#20ba59] hover:scale-105 active:scale-95 transition"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 2C6.516 2 2.031 6.484 2.031 12c0 1.945.556 3.766 1.522 5.309L2 22l4.858-1.517A9.94 9.94 0 0 0 12.031 22c5.516 0 10-4.484 10-10s-4.484-10-10-10zm0 18.25c-1.636 0-3.176-.46-4.502-1.258l-.323-.193-2.887.901.918-2.812-.211-.334A8.196 8.196 0 0 1 3.781 12c0-4.551 3.699-8.25 8.25-8.25s8.25 3.699 8.25 8.25-3.699 8.25-8.25 8.25zm4.516-6.195c-.247-.123-1.464-.723-1.691-.806-.227-.083-.393-.123-.559.123-.166.246-.643.806-.788.971-.144.166-.289.185-.536.062s-1.047-.386-1.994-1.231c-.737-.657-1.235-1.469-1.38-1.716s-.015-.38.108-.503c.111-.111.247-.289.37-.433s.166-.247.248-.412c.083-.166.041-.309-.021-.433s-.559-1.347-.765-1.844c-.201-.484-.405-.418-.559-.426l-.476-.008c-.166 0-.434.062-.661.309s-.868.848-.868 2.069.889 2.4 1.013 2.565c.124.165 1.75 2.673 4.238 3.748.592.256 1.054.409 1.414.524.594.189 1.135.162 1.563.098.477-.071 1.464-.599 1.671-1.176.207-.577.207-1.072.144-1.176-.062-.103-.227-.165-.474-.288z" />
            </svg>
          </button>

          {/* AI Chat Drawer Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Open AI Assistant & Support Chat"
            className="h-12 px-4 rounded-full bg-brand-600 text-white flex items-center gap-2 shadow-xl hover:bg-brand-700 hover:scale-105 active:scale-95 transition font-semibold text-sm"
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
                <span>Support &amp; FAQ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Slide-out / Modal Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] h-[550px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-ink-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-brand-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                🤖
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  AI Support &amp; Help Desk
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <div className="text-[11px] text-white/80">Instant answers + WhatsApp live support</div>
              </div>
            </div>
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

          {/* Quick WhatsApp Bar */}
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <span className="font-bold">WhatsApp:</span> {WHATSAPP_DISPLAY}
            </div>
            <button
              onClick={() => openWhatsApp()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-full shadow-sm hover:bg-emerald-100 transition"
            >
              <span>Chat Now</span>
              <span className="text-xs">↗</span>
            </button>
          </div>

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
                      action.whatsapp ? (
                        <button
                          key={i}
                          onClick={() => openWhatsApp(userTextContext(messages))}
                          className="text-xs font-semibold bg-[#25D366] text-white hover:bg-[#20ba59] px-3 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-sm"
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
            <Link href="/track-order" className="hover:text-brand-600 transition">
              📦 Track Order
            </Link>
            <span className="text-ink-300">•</span>
            <Link href="/balance" className="hover:text-brand-600 transition">
              💳 Check Balance
            </Link>
            <span className="text-ink-300">•</span>
            <Link href="/support" className="hover:text-brand-600 transition">
              📧 Email Support
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
              placeholder="Ask an FAQ or type a message..."
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
        </div>
      )}
    </>
  );
}

function userTextContext(messages: Message[]): string {
  const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
  if (lastUserMsg) {
    return `Hello buygiftcards.online team! I need help with: "${lastUserMsg.text}"`;
  }
  return "Hello buygiftcards.online team! I have a question regarding digital gift cards.";
}

