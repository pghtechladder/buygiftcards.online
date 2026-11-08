import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/fulfill-order";
import { fulfillPayPalOrderById } from "@/lib/paypal";
import { resolveCountryFromHostOrEnv } from "@/lib/country-config";
import { writeTransactionLog } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  const cookieCountry = req.cookies.get("bgc-country")?.value;
  const activeCountry = resolveCountryFromHostOrEnv(hostHeader, cookieCountry);
  const paypalToken = req.nextUrl.searchParams.get("token");
  const rawSessionId = req.nextUrl.searchParams.get("session_id");
  const sessionId = rawSessionId || (paypalToken ? `paypal_${paypalToken}` : null);
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  writeTransactionLog({
    phase: "PROCESS_START",
    process: "Checkout.SessionCheck",
    transactionId: sessionId,
    method: "GET",
    apiUrl,
  });

  if (sessionId.startsWith("paypal_")) {
    const paypalOrderId = sessionId.replace(/^paypal_/, "");
    try {
      const fulfilled = await fulfillPayPalOrderById(paypalOrderId, activeCountry);
      writeTransactionLog({
        phase: "PROCESS_COMPLETE",
        process: "Checkout.SessionCheck",
        transactionId: sessionId,
        orderNumber: fulfilled.orderNumber,
        method: "GET",
        apiUrl,
        statusCode: 200,
        responseBody: { pending: false, order: fulfilled },
      });
      return NextResponse.json({ pending: false, order: fulfilled });
    } catch (err) {
      console.error(`[checkout/session] PayPal fulfillment check failed for ${paypalOrderId}:`, err);
      writeTransactionLog({
        phase: "PROCESS_ERROR",
        process: "Checkout.SessionCheck",
        transactionId: sessionId,
        method: "GET",
        apiUrl,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ pending: true });
    }
  }

  let order = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    select: { orderNumber: true, customerEmail: true, status: true },
  });

  // In local development (or if a webhook is delayed), fulfill on-demand when
  // Stripe confirms the session is paid. `fulfillOrder` is idempotent on
  // `stripeCheckoutSessionId`.
  if (!order) {
    try {
      const stripeRetrieveUrl = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`;
      writeTransactionLog({
        phase: "BEFORE_API_HIT",
        process: "Stripe.RetrieveCheckoutSession",
        transactionId: sessionId,
        method: "GET",
        apiUrl: stripeRetrieveUrl,
      });
      const start = Date.now();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      writeTransactionLog({
        phase: "AFTER_API_HIT",
        process: "Stripe.RetrieveCheckoutSession",
        transactionId: sessionId,
        method: "GET",
        apiUrl: stripeRetrieveUrl,
        statusCode: 200,
        durationMs: Date.now() - start,
        responseBody: {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status,
          amount_total: session.amount_total,
        },
      });
      if (session.payment_status === "paid") {
        await fulfillOrder(session);
        order = await prisma.order.findUnique({
          where: { stripeCheckoutSessionId: sessionId },
          select: { orderNumber: true, customerEmail: true, status: true },
        });
      }
    } catch (err) {
      console.error(`[checkout/session] On-demand fulfillment check failed for ${sessionId}:`, err);
      writeTransactionLog({
        phase: "PROCESS_ERROR",
        process: "Checkout.SessionCheck",
        transactionId: sessionId,
        method: "GET",
        apiUrl,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!order) {
    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: "Checkout.SessionCheck",
      transactionId: sessionId,
      method: "GET",
      apiUrl,
      statusCode: 200,
      responseBody: { pending: true },
    });
    return NextResponse.json({ pending: true });
  }

  writeTransactionLog({
    phase: "PROCESS_COMPLETE",
    process: "Checkout.SessionCheck",
    transactionId: sessionId,
    orderNumber: order.orderNumber,
    method: "GET",
    apiUrl,
    statusCode: 200,
    responseBody: { pending: false, order },
  });
  return NextResponse.json({ pending: false, order });
}
