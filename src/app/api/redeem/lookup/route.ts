import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/order";

const LookupSchema = z.object({
  code: z.string().min(4),
  pin: z.string().optional(),
});

function normalizeDigits(val: string): string {
  return val.replace(/[\s-]/g, "").trim();
}

function format16Digits(digits: string): string {
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

const DEMO_HOUSE_CARD_DIGITS = "8888202612250100";
const DEMO_HOUSE_CARD_FORMATTED = "8888 2026 1225 0100";
const DEMO_HOUSE_CARD_PIN = "20261225";

async function ensureSampleHouseCard() {
  const existing = await prisma.giftCardCode.findFirst({
    where: {
      OR: [
        { code: DEMO_HOUSE_CARD_FORMATTED },
        { code: DEMO_HOUSE_CARD_DIGITS },
      ],
    },
    include: {
      orderItem: {
        include: { order: true },
      },
    },
  });

  if (existing && !existing.pin.startsWith("REDEEMED")) {
    return existing;
  }

  // Create or reset the sample $100 BuyGiftCards.online Gift Card so the user can test redemption anytime
  const orderNumber = generateOrderNumber();
  const createdOrder = await prisma.order.create({
    data: {
      orderNumber,
      customerEmail: "sri@techladder.io",
      status: "FULFILLED",
      subtotalCents: 9500,
      totalCents: 9500,
      stripeCheckoutSessionId: `cs_redeem_sample_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      emailSentAt: new Date(),
      items: {
        create: {
          brandSlug: "buygiftcards",
          brandName: "BuyGiftCards.online Gift Card",
          denomCents: 10000,
          quantity: 1,
          deliveryType: "EGIFT",
          codes: {
            create: {
              code: existing ? `${DEMO_HOUSE_CARD_FORMATTED}` : DEMO_HOUSE_CARD_FORMATTED,
              pin: DEMO_HOUSE_CARD_PIN,
              isDemo: false,
            },
          },
        },
      },
    },
    include: {
      items: {
        include: { codes: true },
      },
    },
  });

  // If an old redeemed sample existed, archive its code string so the fresh sample matches cleanly
  if (existing && existing.pin.startsWith("REDEEMED")) {
    await prisma.giftCardCode.update({
      where: { id: existing.id },
      data: { code: `${existing.code} (SWAPPED)` },
    });
  }

  const newCode = createdOrder.items[0].codes[0];
  return {
    ...newCode,
    orderItem: {
      ...createdOrder.items[0],
      order: createdOrder,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid 16-digit BuyGiftCards.online Card Number and PIN." },
        { status: 400 }
      );
    }

    const inputDigits = normalizeDigits(parsed.data.code);
    const inputPin = (parsed.data.pin || "").trim();

    if (/^https?:\/\//i.test(parsed.data.code.trim())) {
      return NextResponse.json(
        {
          error:
            "This is already a direct Giftbit reward claim link! Open the link directly in your browser to claim your gift card.",
        },
        { status: 400 }
      );
    }

    // Check if the user entered the sample test house card
    if (inputDigits === DEMO_HOUSE_CARD_DIGITS) {
      const sample = await ensureSampleHouseCard();
      return NextResponse.json({
        card: {
          id: sample.id,
          code: sample.code,
          maskedCode: `•••• •••• •••• ${inputDigits.slice(-4)}`,
          brandSlug: sample.orderItem.brandSlug,
          brandName: sample.orderItem.brandName,
          balanceCents: sample.orderItem.denomCents,
          customerEmail: sample.orderItem.order.customerEmail,
          orderNumber: sample.orderItem.order.orderNumber,
          alreadyRedeemed: false,
        },
      });
    }

    const formatted = inputDigits.length === 16 ? format16Digits(inputDigits) : parsed.data.code.trim();

    // Find matching GiftCardCode in DB
    const candidates = await prisma.giftCardCode.findMany({
      where: {
        OR: [
          { code: { equals: parsed.data.code.trim(), mode: "insensitive" } },
          { code: { equals: formatted, mode: "insensitive" } },
          { code: { equals: inputDigits, mode: "insensitive" } },
        ],
      },
      include: {
        orderItem: {
          include: { order: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const match = candidates[0];
    if (!match) {
      return NextResponse.json(
        {
          error:
            "Card number not found. Check your 16-digit card number or click 'Load $100 Sample BuyGiftCards.online Card' below to test the redemption flow.",
        },
        { status: 404 }
      );
    }

    const alreadyRedeemed = match.pin.startsWith("REDEEMED");
    if (alreadyRedeemed) {
      return NextResponse.json(
        {
          error: "This gift card has already been redeemed and swapped for merchant eGift cards.",
          alreadyRedeemed: true,
          orderNumber: match.orderItem.order.orderNumber,
        },
        { status: 400 }
      );
    }

    if (match.pin && inputPin && match.pin !== inputPin) {
      return NextResponse.json(
        { error: "The PIN entered does not match this card number. Please check your order confirmation and try again." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      card: {
        id: match.id,
        code: match.code,
        maskedCode: `•••• •••• •••• ${inputDigits.slice(-4)}`,
        brandSlug: match.orderItem.brandSlug,
        brandName: match.orderItem.brandName,
        balanceCents: match.orderItem.denomCents,
        customerEmail: match.orderItem.order.customerEmail,
        orderNumber: match.orderItem.order.orderNumber,
        alreadyRedeemed: false,
      },
    });
  } catch (err) {
    console.error("[redeem/lookup] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to verify gift card" },
      { status: 500 }
    );
  }
}

