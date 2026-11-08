import { NextRequest, NextResponse } from "next/server";
import { EGifterPhysicalProvider, isEGifterActive } from "@/lib/egifter";
import { resolveCountryFromHostOrEnv } from "@/lib/country-config";
import { writeTransactionLog } from "@/lib/logger";

/**
 * Webhook receiver for eGifter Merchandise Return API (`webhookSettings.fulfillmentComplete`).
 *
 * Per OpenAPI spec (`OrderRequestWebhookSettings.fulfillmentComplete`):
 *   Applicable for orders of types `Codes` or `PhysicalDelivery`.
 *   Sample request body:
 *   ```json
 *   {
 *     "Action": "FulfillmentComplete",
 *     "OrderId": "BLK-123456789",
 *     "PONumber": "SomeCustomerId-123456789",
 *     "Timestamp": "06/19/2019 11:58:00 AM"
 *   }
 *   ```
 */
export async function POST(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.Action || body?.action;
    const orderId = body?.OrderId || body?.orderId || body?.id;
    const poNumber = body?.PONumber || body?.poNumber;
    const timestamp = body?.Timestamp || body?.timestamp;

    writeTransactionLog({
      phase: "PROCESS_START",
      process: "EGifter.Webhook.FulfillmentComplete",
      transactionId: orderId || poNumber,
      method: "POST",
      apiUrl,
      requestPayload: body,
    });

    if (!orderId) {
      return NextResponse.json({ error: "Missing OrderId in eGifter webhook payload" }, { status: 400 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const country = resolveCountryFromHostOrEnv(host);

    let orderDetails = null;
    if (isEGifterActive(country)) {
      try {
        const egifter = new EGifterPhysicalProvider(country);
        orderDetails = await egifter.getOrder(String(orderId));
      } catch (err) {
        console.warn(`[eGifter Webhook] Could not fetch GET /v1/Orders/${orderId}:`, err);
      }
    }

    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: "EGifter.Webhook.FulfillmentComplete",
      transactionId: String(orderId),
      method: "POST",
      apiUrl,
      statusCode: 200,
      details: {
        action,
        orderId,
        poNumber,
        timestamp,
        orderStatus: orderDetails?.status,
      },
    });

    return NextResponse.json({
      received: true,
      action: action || "FulfillmentComplete",
      orderId,
      poNumber,
      status: orderDetails?.status || "Completed",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "EGifter.Webhook.FulfillmentComplete",
      method: "POST",
      apiUrl,
      statusCode: 500,
      error: msg,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

