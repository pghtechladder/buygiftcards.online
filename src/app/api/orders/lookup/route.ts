import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { writeTransactionLog } from "@/lib/logger";

const Schema = z.object({ orderNumber: z.string().min(3), email: z.string().email() });

export async function POST(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  const rawBody = await req.json();
  writeTransactionLog({
    phase: "PROCESS_START",
    process: "Orders.Lookup",
    method: "POST",
    apiUrl,
    requestPayload: rawBody,
  });

  const parsed = Schema.safeParse(rawBody);
  if (!parsed.success) {
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "Orders.Lookup",
      method: "POST",
      apiUrl,
      statusCode: 400,
      error: "Invalid order lookup payload",
    });
    return NextResponse.json({ error: "Enter a valid order number and email" }, { status: 400 });
  }

  let order = await prisma.order.findFirst({
    where: {
      orderNumber: parsed.data.orderNumber.trim(),
      customerEmail: { equals: parsed.data.email.trim(), mode: "insensitive" },
    },
    include: { items: { include: { codes: true } } },
  });

  if (!order) {
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "Orders.Lookup",
      orderNumber: parsed.data.orderNumber.trim(),
      method: "POST",
      apiUrl,
      statusCode: 404,
      error: "No matching order found",
    });
    return NextResponse.json({ error: "No matching order found" }, { status: 404 });
  }

  // If confirmation email previously failed (e.g. missing Vercel env vars before fallback),
  // automatically retry sending via Zoho SMTP and update the order record.
  if (!order.emailSentAt && (order.status === "FULFILLED" || order.status === "PAID")) {
    try {
      const emailRes = await sendOrderConfirmationEmail(order);
      order = await prisma.order.update({
        where: { id: order.id },
        data: emailRes.sent
          ? { emailSentAt: new Date(), emailError: null }
          : { emailError: emailRes.error || order.emailError },
        include: { items: { include: { codes: true } } },
      });
    } catch (err) {
      console.warn(`[orders/lookup] Retry confirmation email failed for ${order.orderNumber}:`, err);
    }
  }

  writeTransactionLog({
    phase: "PROCESS_COMPLETE",
    process: "Orders.Lookup",
    orderNumber: order.orderNumber,
    method: "POST",
    apiUrl,
    statusCode: 200,
    details: { status: order.status, itemCount: order.items.length, emailSentAt: order.emailSentAt },
  });
  return NextResponse.json({ order });
}
