import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBrand, HOUSE_BRAND_SLUGS } from "@/lib/brands";
import { giftCardProvider } from "@/lib/giftcard-provider";
import { generateDemoCode, generateDemoPin } from "@/lib/order";
import { sendRedemptionConfirmationEmail } from "@/lib/email";

const SelectionSchema = z.object({
  brandSlug: z.string().min(1),
  amountDollars: z.number().int().min(5).max(500),
  quantity: z.number().int().min(1).max(10).default(1),
});

const ExchangeSchema = z.object({
  cardId: z.string().min(1),
  code: z.string().min(4),
  pin: z.string().optional(),
  email: z.string().email(),
  selections: z.array(SelectionSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ExchangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please select at least one merchant brand and provide a valid delivery email." },
        { status: 400 }
      );
    }

    const { cardId, pin, email, selections } = parsed.data;

    const sourceCard = await prisma.giftCardCode.findUnique({
      where: { id: cardId },
      include: {
        orderItem: {
          include: { order: true },
        },
      },
    });

    if (!sourceCard) {
      return NextResponse.json({ error: "Source gift card not found." }, { status: 404 });
    }

    if (sourceCard.pin.startsWith("REDEEMED")) {
      return NextResponse.json(
        { error: "This gift card has already been redeemed." },
        { status: 400 }
      );
    }

    if (sourceCard.pin && pin && sourceCard.pin !== pin.trim()) {
      return NextResponse.json(
        { error: "Invalid PIN for this gift card." },
        { status: 403 }
      );
    }

    // Validate all requested merchant brands and compute total cents
    let totalRequestedCents = 0;
    const validatedSelections: {
      brandSlug: string;
      brandName: string;
      amountCents: number;
      quantity: number;
    }[] = [];

    for (const sel of selections) {
      if (HOUSE_BRAND_SLUGS.includes(sel.brandSlug)) {
        return NextResponse.json(
          { error: "Please choose retail, dining, or entertainment merchant brands to swap your balance into." },
          { status: 400 }
        );
      }
      const brand = getBrand(sel.brandSlug);
      if (!brand) {
        return NextResponse.json(
          { error: `Unknown brand "${sel.brandSlug}".` },
          { status: 400 }
        );
      }
      const amountCents = Math.round(sel.amountDollars * 100);
      if (sel.amountDollars < brand.min || sel.amountDollars > brand.max) {
        return NextResponse.json(
          { error: `${brand.name} requires an amount between $${brand.min} and $${brand.max}.` },
          { status: 400 }
        );
      }
      totalRequestedCents += amountCents * sel.quantity;
      validatedSelections.push({
        brandSlug: brand.slug,
        brandName: brand.name,
        amountCents,
        quantity: sel.quantity,
      });
    }

    const availableBalanceCents = sourceCard.orderItem.denomCents;
    if (totalRequestedCents > availableBalanceCents) {
      return NextResponse.json(
        {
          error: `Selected brands total $${(totalRequestedCents / 100).toFixed(2)}, which exceeds your available card balance of $${(availableBalanceCents / 100).toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const order = sourceCard.orderItem.order;
    const redeemedItems: {
      id: string;
      brandSlug: string;
      brandName: string;
      amountCents: number;
      code: string;
      pin: string;
      isDemo: boolean;
    }[] = [];

    // Issue each selected merchant gift card via giftCardProvider (Giftbit live direct_links for mapped brands)
    for (const sel of validatedSelections) {
      for (let i = 0; i < sel.quantity; i++) {
        const issued = await giftCardProvider.issue({
          brandSlug: sel.brandSlug,
          amountCents: sel.amountCents,
          deliveryType: "egift",
        });

        const newOrderItem = await prisma.orderItem.create({
          data: {
            orderId: order.id,
            brandSlug: sel.brandSlug,
            brandName: `${sel.brandName} (Redeemed from ${sourceCard.orderItem.brandName})`,
            denomCents: sel.amountCents,
            quantity: 1,
            deliveryType: "EGIFT",
            codes: {
              create: {
                code: issued.code,
                pin: issued.pin,
                isDemo: issued.isDemo,
              },
            },
          },
          include: { codes: true },
        });

        const createdCode = newOrderItem.codes[0];
        redeemedItems.push({
          id: createdCode.id,
          brandSlug: sel.brandSlug,
          brandName: sel.brandName,
          amountCents: sel.amountCents,
          code: createdCode.code,
          pin: createdCode.pin,
          isDemo: createdCode.isDemo,
        });
      }
    }

    // Handle remaining balance if the user didn't spend the entire card
    const remainingCents = availableBalanceCents - totalRequestedCents;
    let remainingCard: { amountCents: number; code: string; pin: string } | undefined;

    if (remainingCents > 0) {
      const remCode = generateDemoCode();
      const remPin = generateDemoPin();
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          brandSlug: sourceCard.orderItem.brandSlug,
          brandName: `${sourceCard.orderItem.brandName} (Remaining Balance)`,
          denomCents: remainingCents,
          quantity: 1,
          deliveryType: "EGIFT",
          codes: {
            create: {
              code: remCode,
              pin: remPin,
              isDemo: false,
            },
          },
        },
      });
      remainingCard = {
        amountCents: remainingCents,
        code: remCode,
        pin: remPin,
      };
    }

    // Mark original card as REDEEMED so it cannot be double-spent
    const redDate = new Date().toISOString().slice(0, 10);
    await prisma.giftCardCode.update({
      where: { id: sourceCard.id },
      data: {
        pin: `REDEEMED (${redDate})`,
      },
    });

    const cleanDigits = sourceCard.code.replace(/[\s-]/g, "");
    const maskedSource = `•••• •••• •••• ${cleanDigits.slice(-4)}`;

    // Send confirmation email via Zoho SMTP
    const emailResult = await sendRedemptionConfirmationEmail({
      email: email.trim(),
      sourceBrandName: sourceCard.orderItem.brandName,
      sourceCardMasked: maskedSource,
      orderNumber: order.orderNumber,
      redeemedItems,
      remainingCard,
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      email: email.trim(),
      emailSent: emailResult.sent,
      emailError: emailResult.error,
      sourceBrandName: sourceCard.orderItem.brandName,
      sourceCardMasked: maskedSource,
      redeemedItems,
      remainingCard,
    });
  } catch (err) {
    console.error("[redeem/exchange] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to complete gift card redemption." },
      { status: 500 }
    );
  }
}

