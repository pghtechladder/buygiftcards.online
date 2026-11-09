import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateEnterpriseRequest } from "@/lib/enterprise-auth";
import { POST as issueGiftCardPost } from "@/app/api/v1/giftcards/issue/route";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/orders
 * List, filter, and track gift card orders for an enterprise account.
 */
export async function GET(req: NextRequest) {
  const auth = authenticateEnterpriseRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: auth.error,
        documentation: "https://api.buygiftcards.online/docs/reference/orders",
      },
      { status: 401 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const statusParam = searchParams.get("status")?.toUpperCase();
  const emailParam = searchParams.get("customerEmail") || searchParams.get("email");
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};
  if (statusParam === "FULFILLED" || statusParam === "PENDING" || statusParam === "CANCELLED") {
    whereClause.status = statusParam;
  }
  if (emailParam) {
    whereClause.customerEmail = { contains: emailParam, mode: "insensitive" };
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            codes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.order.count({ where: whereClause }),
  ]);

  return NextResponse.json({
    status: "success",
    page,
    limit,
    totalCount,
    hasMore: skip + orders.length < totalCount,
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      createdAt: o.createdAt,
      totalAmount: o.totalCents / 100,
      currency: o.currency.toUpperCase(),
      customerEmail: o.customerEmail,
      items: o.items.map((i) => ({
        brandName: i.brandName,
        brandSlug: i.brandSlug,
        denomination: i.denomCents / 100,
        quantity: i.quantity,
        deliveryType: i.deliveryType,
        codes: i.codes.map((c) => ({
          code: c.code,
          pin: c.pin,
          isDemo: c.isDemo,
        })),
      })),
    })),
  });
}

/**
 * POST /api/v1/orders
 * Standard alias for creating an order (forwards to issue handler).
 */
export async function POST(req: NextRequest) {
  return issueGiftCardPost(req);
}

