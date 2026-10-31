import { NextRequest, NextResponse } from "next/server";
import { POST as paypalCheckoutPost } from "@/app/api/checkout/paypal/route";

export async function POST(req: NextRequest) {
  // PayPal is enabled as the primary checkout provider instead of Stripe.
  const body = await req.json();
  const forwardedReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({
      action: "create",
      ...body,
    }),
  });
  return paypalCheckoutPost(forwardedReq);
}
