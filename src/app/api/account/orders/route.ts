import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  // Summary-only shape — no internal ids or billing address leaked here.
  // customerEmail is included only so the client can link to the existing
  // /orders/[orderNumber]?email=... lookup page (it's the user's own email).
  const data = orders.map((order) => ({
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    status: order.status,
    totalCents: order.totalCents,
    currency: order.currency,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      brandName: item.brandName,
      denomCents: item.denomCents,
      quantity: item.quantity,
    })),
  }));

  return NextResponse.json({ orders: data });
}
