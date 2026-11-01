import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const FAQ_KNOWLEDGE_BASE = [
  {
    topic: "delivery",
    keywords: ["delivery", "time", "fast", "instant", "when", "receive", "email", "link", "claim"],
    answer: "Digital eGift cards are generated instantly upon payment confirmation. You will see your card codes & claim links immediately on your Order Confirmation screen and receive them via email within 1–2 minutes.",
  },
  {
    topic: "redemption",
    keywords: ["redeem", "claim", "how to use", "barcode", "pin", "instructions", "card number"],
    answer: "To redeem your gift card, click 'Reveal Claim Link' or view details on your Order Detail page or confirmation email. You can also visit our Redeem page (/redeem) for step-by-step brand redemption instructions.",
  },
  {
    topic: "balance",
    keywords: ["balance", "check balance", "how much", "remaining", "funds", "money left"],
    answer: "You can check your remaining gift card balance anytime on our Check Balance page (/balance) or directly through the official brand merchant portal.",
  },
  {
    topic: "payment",
    keywords: ["payment", "paypal", "stripe", "credit card", "pay", "debit card", "method"],
    answer: "We support PayPal (PayPal Balance, Pay in 4, Linked Bank & Cards) and secure credit/debit card checkouts with bank-grade encryption.",
  },
  {
    topic: "expiry_fees",
    keywords: ["expire", "expiry", "expiration", "fee", "hidden fee", "charge", "cost"],
    answer: "Merchant gift cards sold on buygiftcards.online have $0 purchase fees and standard retail gift card funds never expire.",
  },
  {
    topic: "track_order",
    keywords: ["track", "status", "order number", "where is my order", "lookup", "find order"],
    answer: "You can track your order status anytime at /track-order by entering your Order Number (e.g. BGC-...) and email address.",
  },
  {
    topic: "gifting",
    keywords: ["gift", "send to friend", "recipient", "holiday", "birthday", "message"],
    answer: "Yes! Select 'Send as a Gift' on any product page to choose a festive holiday or greeting card design, enter recipient email, and include a custom message.",
  },
  {
    topic: "refunds",
    keywords: ["refund", "cancel", "return", "money back"],
    answer: "Because digital gift cards are delivered and revealed immediately with live redemption credentials, digital codes are generally non-refundable once delivered. If you encounter any technical issue with a code, our live support team will resolve it or replace it immediately.",
  },
];

const RequestSchema = z.object({
  message: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const userMsg = parsed.data.message.toLowerCase().trim();

    // 1. Check for greeting
    if (/^(hi|hello|hey|good morning|good evening|howdy|sup)\b/.test(userMsg) && userMsg.length < 25) {
      return NextResponse.json({
        reply: "Hello! Welcome to Customer Support. How can I assist you today? You can ask me about delivery times, order tracking, card balances, or connect directly with our live support team on WhatsApp!",
        suggestedActions: [
          { label: "📦 Track an order", query: "How do I track my order?" },
          { label: "⚡ Delivery speed", query: "How quickly are eGift cards delivered?" },
          { label: "💳 Check card balance", query: "How do I check my card balance?" },
          { label: "💬 Connect with Live Agent on WhatsApp", whatsapp: true },
        ],
      });
    }

    // 2. Score FAQ matches
    let bestMatch: (typeof FAQ_KNOWLEDGE_BASE)[0] | null = null;
    let highestScore = 0;

    for (const item of FAQ_KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of item.keywords) {
        if (userMsg.includes(kw)) {
          score += kw.length; // weight longer keyword matches more
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && highestScore > 0) {
      return NextResponse.json({
        reply: bestMatch.answer,
        matchedTopic: bestMatch.topic,
        suggestedActions: [
          { label: "💬 Connect with Live Agent on WhatsApp", whatsapp: true },
        ],
      });
    }

    // 3. Fallback answer directing to WhatsApp support without exposing raw phone number
    return NextResponse.json({
      reply: "Thank you for reaching out! For this inquiry or specific order assistance, our dedicated support team is available on WhatsApp to reply to you immediately.",
      suggestedActions: [
        { label: "💬 Connect with Live Agent on WhatsApp", whatsapp: true },
      ],
    });
  } catch (err) {
    console.error("[/api/chat/faq]", err);
    return NextResponse.json({ error: "Internal error processing support query" }, { status: 500 });
  }
}
