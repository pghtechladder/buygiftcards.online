import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateEnterpriseRequest } from "@/lib/enterprise-auth";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const ResendSchema = z.object({
  recipientEmail: z.string().email().optional(),
});

/**
 * POST /api/v1/orders/:orderNumber/resend
 * Resends the digital voucher email for an order.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const auth = authenticateEnterpriseRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized", message: auth.error }, { status: 401 });
  }

  const { orderNumber } = await params;
  if (!orderNumber) {
    return NextResponse.json({ error: "Missing orderNumber parameter" }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional
  }

  const parsed = ResendSchema.safeParse(body);
  const targetEmail = parsed.success ? parsed.data.recipientEmail : undefined;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          codes: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const emailToUse = targetEmail || order.customerEmail;

  try {
    const orderToSend = { ...order, customerEmail: emailToUse };
    const result = await sendOrderConfirmationEmail(orderToSend);
    if (!result.sent) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 502 }
      );
    }
    return NextResponse.json({
      status: "SENT",
      orderNumber: order.orderNumber,
      resentTo: emailToUse,
      emailSentAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to send email", message: msg },
      { status: 500 }
    );
  }
}
