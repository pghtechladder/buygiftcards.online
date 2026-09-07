import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getBrand } from "@/lib/brands";
import { generateOrderNumber } from "@/lib/order";
import { giftCardProvider } from "@/lib/giftcard-provider";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Signature verification failed` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillOrder(session);
  }

  return NextResponse.json({ received: true });
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const existing = await prisma.order.findUnique({ where: { stripeCheckoutSessionId: session.id } });
  if (existing) return; // idempotent — Stripe may retry webhooks

  const cartRaw = session.metadata?.cart;
  if (!cartRaw || !session.customer_details?.email) return;
  const cart = JSON.parse(cartRaw) as Array<{ s: string; a: number; q: number; d: "egift" | "physical"; p?: string }>;
  // Populated only when the customer was signed in at checkout (see
  // src/app/api/checkout/route.ts) — links the order to their account.
  // Guest checkouts have no "u" key, so userId stays undefined.
  const userId = session.metadata?.u;

  const address = session.customer_details.address;
  const taxCents = session.total_details?.amount_tax;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerEmail: session.customer_details.email,
      status: "PAID",
      subtotalCents: session.amount_subtotal ?? 0,
      totalCents: session.amount_total ?? 0,
      taxCents: taxCents ?? undefined,
      currency: session.currency ?? "usd",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      billingLine1: address?.line1 ?? undefined,
      billingLine2: address?.line2 ?? undefined,
      billingCity: address?.city ?? undefined,
      billingState: address?.state ?? undefined,
      billingPostalCode: address?.postal_code ?? undefined,
      billingCountry: address?.country ?? undefined,
      userId: userId ?? undefined,
    },
  });

  for (const line of cart) {
    const brand = getBrand(line.s);
    if (!brand) continue;
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        brandSlug: brand.slug,
        brandName: brand.name,
        denomCents: Math.round(line.a * 100),
        quantity: line.q,
        deliveryType: line.d === "egift" ? "EGIFT" : "PHYSICAL",
        customPhotoUrl: line.p,
      },
    });

    for (let i = 0; i < line.q; i++) {
      const issued = await giftCardProvider.issue({ brandSlug: brand.slug, amountCents: Math.round(line.a * 100) });
      await prisma.giftCardCode.create({
        data: { orderItemId: orderItem.id, code: issued.code, pin: issued.pin, isDemo: issued.isDemo },
      });
    }
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "FULFILLED" } });

  // Fulfillment (payment recorded, codes issued) is already done and
  // committed at this point regardless of what happens next — a failed
  // confirmation email should never undo that or make the webhook return an
  // error (which would just make Stripe retry and re-run all of the above
  // against an already-fulfilled order). It's tracked separately below.
  const full = await prisma.order.findUnique({ where: { id: order.id }, include: { items: { include: { codes: true } } } });
  if (full) {
    try {
      const result = await sendOrderConfirmationEmail(full);
      await prisma.order.update({
        where: { id: order.id },
        data: result.sent ? { emailSentAt: new Date(), emailError: null } : { emailError: result.error },
      });
    } catch (err) {
      console.error(`[webhook] Unexpected error sending confirmation for order ${order.orderNumber}:`, err);
      await prisma.order.update({
        where: { id: order.id },
        data: { emailError: err instanceof Error ? err.message : String(err) },
      });
    }
  }
}
