import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || "https://buygiftcards.online";
  const isApiSubdomain = (req.headers.get("host") || "").toLowerCase().startsWith("api.");
  const baseUrl = isApiSubdomain ? `${origin}/api/v1` : `${origin}/api/v1`;

  const response = {
    api: "BuyGiftCards.online Enterprise Platform REST API",
    version: "v1",
    status: "healthy",
    timestamp: new Date().toISOString(),
    documentation: {
      overview: `${origin}/docs`,
      ordersReference: `${origin}/docs/reference/orders`,
      interactiveConsole: `${origin}/platform/api`,
    },
    authentication: {
      type: "Bearer Token",
      header: "Authorization: Bearer <API_KEY>",
      sandboxKey: "bgc_test_platform_2026",
    },
    endpoints: {
      catalog: {
        method: "GET",
        path: "/api/v1/catalog",
        url: `${baseUrl}/catalog`,
        description: "Fetch live real-time gift card catalog across 165+ brands with min/max denominations.",
      },
      orders: {
        list: {
          method: "GET",
          path: "/api/v1/orders",
          url: `${baseUrl}/orders`,
          description: "List historical orders with cursor-based pagination.",
        },
        create: {
          method: "POST",
          path: "/api/v1/orders",
          url: `${baseUrl}/orders`,
          description: "Synchronously issue a digital eGift card order with instant code, PIN, and redemption URL.",
        },
      },
      bulkOrders: {
        method: "POST",
        path: "/api/v1/orders/bulk",
        url: `${baseUrl}/orders/bulk`,
        description: "Issue up to 250 gift cards in a single atomic transaction.",
      },
      instantIssue: {
        method: "POST",
        path: "/api/v1/giftcards/issue",
        url: `${baseUrl}/giftcards/issue`,
        description: "Low-latency single-card issuance for employee rewards, rebates, and incentives.",
      },
      orderLookup: {
        method: "GET",
        path: "/api/v1/orders/{orderNumber}",
        url: `${baseUrl}/orders/{orderNumber}`,
        description: "Retrieve order details, status, and gift card credentials by order number.",
      },
      resendEmail: {
        method: "POST",
        path: "/api/v1/orders/{orderNumber}/resend",
        url: `${baseUrl}/orders/{orderNumber}/resend`,
        description: "Resend gift card email delivery to recipient or customer.",
      },
    },
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key",
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key",
      "Access-Control-Max-Age": "86400",
    },
  });
}
