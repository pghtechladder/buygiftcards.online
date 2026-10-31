import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/fulfill-order";
import { writeTransactionLog } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "Stripe.Webhook",
      method: "POST",
      apiUrl,
      statusCode: 400,
      error: "Stripe webhook signature verification failed",
    });
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  writeTransactionLog({
    phase: "PROCESS_START",
    process: "Stripe.Webhook",
    transactionId: event.id,
    method: "POST",
    apiUrl,
    details: { eventType: event.type },
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillOrder(session);
  }

  writeTransactionLog({
    phase: "PROCESS_COMPLETE",
    process: "Stripe.Webhook",
    transactionId: event.id,
    method: "POST",
    apiUrl,
    statusCode: 200,
    responseBody: { received: true },
  });

  return NextResponse.json({ received: true });
}
