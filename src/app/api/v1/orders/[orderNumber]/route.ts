import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateEnterpriseRequest } from "@/lib/enterprise-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const auth = authenticateEnterpriseRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: "Unauthorized", message: auth.error },
      { status: 401 }
    );
  }

  const { orderNumber } = await params;
  if (!orderNumber) {
    return NextResponse.json({ error: "Missing orderNumber parameter" }, { status: 400 });
  }

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

  return NextResponse.json({
    status: order.status,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    totalAmount: order.totalCents / 100,
    currency: order.currency.toUpperCase(),
    customerEmail: order.customerEmail,
    items: order.items.map((item) => ({
      brandName: item.brandName,
      brandSlug: item.brandSlug,
      denomination: item.denomCents / 100,
      quantity: item.quantity,
      deliveryType: item.deliveryType,
      codes: item.codes.map((c) => ({
        code: c.code,
        pin: c.pin,
        isDemo: c.isDemo,
      })),
    })),
  });
}
