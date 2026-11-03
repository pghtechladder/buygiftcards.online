import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBrand, isValidDenomination, chargeAmountCents } from "@/lib/brands";
import { generateOrderNumber } from "@/lib/order";
import { isFulfillableBrand } from "@/lib/giftcard-provider";
import { createPayPalOrder, fulfillPayPalOrderById } from "@/lib/paypal";
import { auth } from "@/lib/auth";
import { writeTransactionLog } from "@/lib/logger";

const CartItemSchema = z.object({
  brandSlug: z.string(),
  amount: z.number().positive(),
  qty: z.number().int().min(1).max(10),
  deliveryType: z.enum(["egift", "physical"]),
  customPhotoUrl: z.string().url().optional(),
  recipientName: z.string().max(80).optional(),
  recipientEmail: z.string().email().max(120).optional().or(z.literal("")),
  senderName: z.string().max(80).optional(),
  giftMessage: z.string().max(240).optional(),
  occasion: z.string().max(40).optional(),
  deliveryDate: z.string().max(20).optional(),
});

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    items: z.array(CartItemSchema).min(1).max(20),
    idempotencyKey: z.string().optional(),
  }),
  z.object({
    action: z.literal("capture"),
    paypalOrderId: z.string().min(3),
  }),
]);

export async function POST(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  try {
    const authSession = await auth();
    if (!authSession?.user?.email) {
      writeTransactionLog({
        phase: "PROCESS_ERROR",
        process: "PayPal.Checkout",
        method: "POST",
        apiUrl,
        statusCode: 401,
        error: "Authentication required to checkout",
      });
      return NextResponse.json(
        { error: "Please sign in or create an account before checking out." },
        { status: 401 }
      );
    }

    const rawBody = await req.json();

    writeTransactionLog({
      phase: "PROCESS_START",
      process: `PayPal.${rawBody?.action === "capture" ? "CaptureAndFulfill" : "CreateCheckoutOrder"}`,
      transactionId: rawBody?.paypalOrderId,
      method: "POST",
      apiUrl,
      requestPayload: rawBody,
    });

    const parsed = ActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      writeTransactionLog({
        phase: "PROCESS_ERROR",
        process: "PayPal.Checkout",
        method: "POST",
        apiUrl,
        statusCode: 400,
        error: "Invalid PayPal request payload",
      });
      return NextResponse.json({ error: "Invalid PayPal checkout payload" }, { status: 400 });
    }

    const reqOrigin = req.nextUrl.origin;
    const siteUrl =
      reqOrigin && reqOrigin.includes("localhost")
        ? reqOrigin
        : process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";

    // 1. CREATE PAYPAL ORDER
    if (parsed.data.action === "create") {
      const { items } = parsed.data;
      let subtotalCents = 0;

      const validatedLines: Array<{
        item: z.infer<typeof CartItemSchema>;
        brandName: string;
        denomCents: number;
        chargeCents: number;
        customPhotoUrl?: string;
      }> = [];

      for (const item of items) {
        const brand = getBrand(item.brandSlug);
        if (!brand) {
          return NextResponse.json({ error: `Unknown brand: ${item.brandSlug}` }, { status: 400 });
        }
        if (!isFulfillableBrand(brand.slug)) {
          return NextResponse.json(
            { error: `${brand.name} is temporarily unavailable. Please choose another brand.` },
            { status: 400 }
          );
        }
        if (brand.type !== "both" && brand.type !== item.deliveryType) {
          return NextResponse.json(
            { error: `${brand.name} does not support ${item.deliveryType} delivery` },
            { status: 400 }
          );
        }
        const denomCents = Math.round(item.amount * 100);
        if (!isValidDenomination(brand, denomCents)) {
          return NextResponse.json({ error: `Invalid amount for ${brand.name}` }, { status: 400 });
        }
        const chargeCents = chargeAmountCents(brand, item.amount);
        subtotalCents += chargeCents * item.qty;

        let customPhotoUrl: string | undefined;
        if (item.customPhotoUrl && brand.supportsCustomPhoto) {
          if (/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(item.customPhotoUrl)) {
            customPhotoUrl = item.customPhotoUrl;
          }
        }

        validatedLines.push({
          item,
          brandName: brand.name,
          denomCents,
          chargeCents,
          customPhotoUrl,
        });
      }

      const orderNumber = generateOrderNumber();

      const paypalOrder = await createPayPalOrder({
        totalCents: subtotalCents,
        customId: orderNumber,
        returnUrl: `${siteUrl}/checkout/success?provider=paypal`,
        cancelUrl: `${siteUrl}/catalog`,
        items: validatedLines.map((line) => ({
          name: `${line.brandName} ${line.item.deliveryType === "egift" ? "eGift" : "Physical"} Card ($${line.item.amount})`,
          description: line.item.recipientEmail
            ? `Gift for ${line.item.recipientName || line.item.recipientEmail}`
            : `Digital Gift Card`,
          unitAmountCents: line.chargeCents,
          quantity: line.item.qty,
          sku: `${line.item.brandSlug}-${line.item.amount}`,
        })),
      });

      const sessionKey = `paypal_${paypalOrder.id}`;
      const initialEmail =
        authSession?.user?.email ||
        items.find((i) => i.recipientEmail)?.recipientEmail ||
        "pending@buygiftcards.online";

      await prisma.order.create({
        data: {
          orderNumber,
          customerEmail: initialEmail,
          status: "PENDING",
          subtotalCents,
          totalCents: subtotalCents,
          currency: "usd",
          stripeCheckoutSessionId: sessionKey,
          stripePaymentIntentId: JSON.stringify(
            validatedLines.map((l) => ({
              s: l.item.brandSlug,
              a: l.item.amount,
              q: l.item.qty,
              d: l.item.deliveryType,
              p: l.customPhotoUrl,
              re: l.item.recipientEmail,
              rn: l.item.recipientName,
              sn: l.item.senderName,
              gm: l.item.giftMessage,
              oc: l.item.occasion,
            }))
          ),
          userId: authSession?.user?.id ?? undefined,
          items: {
            create: validatedLines.map((l) => ({
              brandSlug: l.item.brandSlug,
              brandName: l.brandName,
              denomCents: l.denomCents,
              quantity: l.item.qty,
              deliveryType: l.item.deliveryType === "egift" ? "EGIFT" : "PHYSICAL",
              customPhotoUrl: l.customPhotoUrl,
            })),
          },
        },
      });

      writeTransactionLog({
        phase: "PROCESS_COMPLETE",
        process: "PayPal.CreateCheckoutOrder",
        transactionId: paypalOrder.id,
        orderNumber,
        method: "POST",
        apiUrl,
        statusCode: 200,
        responseBody: {
          paypalOrderId: paypalOrder.id,
          orderNumber,
          approveUrl: paypalOrder.approveUrl,
        },
      });

      return NextResponse.json({
        paypalOrderId: paypalOrder.id,
        orderNumber,
        url: paypalOrder.approveUrl,
        approveUrl: paypalOrder.approveUrl,
      });
    }

    // 2. CAPTURE PAYPAL ORDER & FULFILL GIFT CARDS
    const { paypalOrderId } = parsed.data;
    const result = await fulfillPayPalOrderById(paypalOrderId);

    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: "PayPal.CaptureAndFulfill",
      transactionId: paypalOrderId,
      orderNumber: result.orderNumber,
      method: "POST",
      apiUrl,
      statusCode: 200,
      responseBody: { order: result },
    });

    return NextResponse.json({ order: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal checkout failed";
    console.error("[/api/checkout/paypal]", err);
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "PayPal.Checkout",
      method: "POST",
      apiUrl,
      statusCode: 500,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
