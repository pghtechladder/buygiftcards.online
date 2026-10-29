import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { fulfillOrder } from "@/app/api/webhooks/stripe/route";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  let order = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    select: { orderNumber: true, customerEmail: true, status: true },
  });

  // In local development (or if a webhook is delayed), fulfill on-demand when
  // Stripe confirms the session is paid. `fulfillOrder` is idempotent on
  // `stripeCheckoutSessionId`.
  if (!order) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await fulfillOrder(session);
        order = await prisma.order.findUnique({
          where: { stripeCheckoutSessionId: sessionId },
          select: { orderNumber: true, customerEmail: true, status: true },
        });
      }
    } catch (err) {
      console.error(`[checkout/session] On-demand fulfillment check failed for ${sessionId}:`, err);
    }
  }

  if (!order) return NextResponse.json({ pending: true });
  return NextResponse.json({ pending: false, order });
}
