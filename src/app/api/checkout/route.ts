import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { getBrand, isValidDenomination, chargeAmountCents } from "@/lib/brands";
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
const BodySchema = z.object({
  items: z.array(CartItemSchema).min(1).max(20),
  // Generated once per checkout attempt on the client and reused on retry,
  // so a double-click or a flaky network retry can't create two Stripe
  // Checkout Sessions (and charge the card twice) for the same cart.
  idempotencyKey: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  try {
    // If the customer is signed in, we link the resulting order to their
    // account (and pre-fill their email at Stripe Checkout) — but guest
    // checkout (no session) keeps working exactly as before.
    const authSession = await auth();
    const rawBody = await req.json();
    writeTransactionLog({
      phase: "PROCESS_START",
      process: "Checkout.CreateSession",
      method: "POST",
      apiUrl,
      requestPayload: rawBody,
    });

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      writeTransactionLog({
        phase: "PROCESS_ERROR",
        process: "Checkout.CreateSession",
        method: "POST",
        apiUrl,
        statusCode: 400,
        error: "Invalid cart payload",
      });
      return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin || "https://buygiftcards.online";
    const line_items: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; images?: string[]; metadata: Record<string, string> };
        unit_amount: number;
      };
      quantity: number;
    }> = [];
    // Parallel array (by index) of validated photo URLs per cart line, used
    // below to build the metadata Stripe sends back on the webhook.
    const photoByLine: (string | undefined)[] = [];

    // Every line item is re-priced from the server-side catalog. The client
    // cart is a convenience UI — it is never trusted for what gets charged.
    for (const item of parsed.data.items) {
      const brand = getBrand(item.brandSlug);
      if (!brand) return NextResponse.json({ error: `Unknown brand: ${item.brandSlug}` }, { status: 400 });
      if (brand.type !== "both" && brand.type !== item.deliveryType) {
        return NextResponse.json({ error: `${brand.name} does not support ${item.deliveryType} delivery` }, { status: 400 });
      }
      const amountCents = Math.round(item.amount * 100);
      if (!isValidDenomination(brand, amountCents)) {
        return NextResponse.json({ error: `Invalid amount for ${brand.name}` }, { status: 400 });
      }
      // What we actually charge can be less than face value (e.g. Starbucks'
      // 5% discount) — the customer still receives a gift card worth the
      // full face amount; we just collect less for it. Face value (item.amount)
      // is what gets recorded/issued, computed below and carried in metadata.
      const chargeCents = chargeAmountCents(brand, item.amount);
      // Only trust a custom photo for brands that actually support it, and
      // only if it's really hosted on our own Blob storage — never pass an
      // arbitrary client-supplied URL through to Stripe/our DB unchecked.
      let customPhotoUrl: string | undefined;
      if (item.customPhotoUrl) {
        if (!brand.supportsCustomPhoto) {
          return NextResponse.json({ error: `${brand.name} does not support custom photos` }, { status: 400 });
        }
        if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(item.customPhotoUrl)) {
          return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
        }
        customPhotoUrl = item.customPhotoUrl;
      }

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${brand.name} ${item.deliveryType === "egift" ? "eGift" : "Physical"} Card — $${item.amount}${
              brand.discountPercent ? ` (${brand.discountPercent}% off)` : ""
            }`,
            images: customPhotoUrl ? [customPhotoUrl] : undefined,
            metadata: { brandSlug: brand.slug, amount: String(item.amount), deliveryType: item.deliveryType },
          },
          unit_amount: chargeCents,
        },
        quantity: item.qty,
      });
      photoByLine.push(customPhotoUrl);
    }

    const stripeUrl = "https://api.stripe.com/v1/checkout/sessions";
    writeTransactionLog({
      phase: "BEFORE_API_HIT",
      process: "Stripe.CreateCheckoutSession",
      method: "POST",
      apiUrl: stripeUrl,
      requestPayload: {
        mode: "payment",
        line_items,
        idempotencyKey: parsed.data.idempotencyKey,
      },
    });
    const stripeStart = Date.now();

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/catalog`,
        customer_creation: "always",
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        ...(authSession?.user?.email ? { customer_email: authSession.user.email } : {}),
        metadata: {
          cart: JSON.stringify(
            parsed.data.items.map((i, idx) => ({
              s: i.brandSlug,
              a: i.amount,
              q: i.qty,
              d: i.deliveryType,
              ...(photoByLine[idx] ? { p: photoByLine[idx] } : {}),
              ...(i.recipientEmail ? { re: i.recipientEmail } : {}),
              ...(i.recipientName ? { rn: i.recipientName } : {}),
              ...(i.senderName ? { sn: i.senderName } : {}),
              ...(i.giftMessage ? { gm: i.giftMessage.slice(0, 120) } : {}),
              ...(i.occasion ? { oc: i.occasion } : {}),
            }))
          ),
          ...(authSession?.user?.id ? { u: authSession.user.id } : {}),
        },
      },
      parsed.data.idempotencyKey ? { idempotencyKey: parsed.data.idempotencyKey } : undefined
    );

    writeTransactionLog({
      phase: "AFTER_API_HIT",
      process: "Stripe.CreateCheckoutSession",
      transactionId: session.id,
      method: "POST",
      apiUrl: stripeUrl,
      statusCode: 200,
      durationMs: Date.now() - stripeStart,
      responseBody: {
        sessionId: session.id,
        url: session.url,
        amountTotal: session.amount_total,
      },
    });

    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: "Checkout.CreateSession",
      transactionId: session.id,
      method: "POST",
      apiUrl,
      statusCode: 200,
      responseBody: { url: session.url },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[/api/checkout]", err);
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "Checkout.CreateSession",
      method: "POST",
      apiUrl,
      statusCode: 500,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
