import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrustpilotReviewInviteEmail } from "@/lib/email";
import { triggerKitTrustpilotWorkflow, TRUSTPILOT_REVIEW_URL } from "@/lib/newsletter";
import { writeTransactionLog } from "@/lib/logger";

/**
 * Automated Trustpilot Review Invitation Workflow Endpoint (/api/workflows/trustpilot-invites)
 *
 * Compliance rules enforced:
 * 1. Sends to EVERY completed (FULFILLED) order 1–3 days (24h–72h) after delivery.
 * 2. Does NOT filter by order value, customer type, or support ticket history.
 * 3. Uses the exact neutral invitation template:
 *    Subject: How was your order from BuyGiftCards.online?
 *    Body: Hi {first_name}, Thanks for your recent order ({order_number})...
 * 4. Syncs with Kit.com v4 API (if KIT_API_KEY is configured) AND/OR sends directly via
 *    Zoho SMTP with optional Trustpilot AFS BCC (`TRUSTPILOT_AFS_EMAIL`) so reviews are
 *    marked "Verified".
 */
export async function GET(req: NextRequest) {
  return runTrustpilotWorkflow(req);
}

export async function POST(req: NextRequest) {
  return runTrustpilotWorkflow(req);
}

async function runTrustpilotWorkflow(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  try {
    // Allow optional manual test / single-order trigger via POST body or query params
    let targetOrderNumber = req.nextUrl.searchParams.get("orderNumber") || undefined;
    let forceSend = req.nextUrl.searchParams.get("force") === "1";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.orderNumber) targetOrderNumber = String(body.orderNumber);
      if (body?.force) forceSend = Boolean(body.force);
    }

    const now = Date.now();
    // 1 to 3 days (24 hours to 72 hours) after order fulfillment
    const minAgeDate = new Date(now - 24 * 60 * 60 * 1000); // 1 day ago
    const maxAgeDate = new Date(now - 72 * 60 * 60 * 1000); // 3 days ago

    const orders = await prisma.order.findMany({
      where: targetOrderNumber
        ? { orderNumber: targetOrderNumber, status: "FULFILLED" }
        : {
            status: "FULFILLED",
            createdAt: {
              gte: maxAgeDate,
              lte: minAgeDate,
            },
          },
      include: {
        user: {
          select: { firstName: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const processed: Array<{
      orderNumber: string;
      email: string;
      kitSynced: boolean;
      emailSent: boolean;
      skippedAlreadyInvited?: boolean;
    }> = [];

    for (const order of orders) {
      if (
        !order.customerEmail ||
        order.customerEmail === "pending@buygiftcards.online"
      ) {
        continue;
      }

      // Use `emailError` marker `[TRUSTPILOT_INVITED]` or check if already invited unless `forceSend` is true
      const alreadyInvited = Boolean(
        order.emailError && order.emailError.includes("[TRUSTPILOT_INVITED]")
      );
      if (alreadyInvited && !forceSend) {
        processed.push({
          orderNumber: order.orderNumber,
          email: order.customerEmail,
          kitSynced: false,
          emailSent: false,
          skippedAlreadyInvited: true,
        });
        continue;
      }

      const firstName = order.user?.firstName || undefined;

      // 1. Sync subscriber & custom fields (`order_number`, `trustpilot_link`) to Kit.com v4
      const kitResult = await triggerKitTrustpilotWorkflow({
        email: order.customerEmail,
        firstName,
        orderNumber: order.orderNumber,
      });

      // 2. If Kit.com sequence is not handling the send (or if forceSend / direct SMTP is enabled),
      // send the 1–3 day Trustpilot invitation email directly (with TRUSTPILOT_AFS_EMAIL BCC if configured)
      let emailSent = false;
      if (!kitResult.synced || forceSend || process.env.TRUSTPILOT_DIRECT_SMTP !== "0") {
        const smtpRes = await sendTrustpilotReviewInviteEmail({
          email: order.customerEmail,
          firstName,
          orderNumber: order.orderNumber,
          trustpilotLink: TRUSTPILOT_REVIEW_URL,
        });
        emailSent = smtpRes.sent;
      }

      if (kitResult.synced || emailSent) {
        const updatedMarker = order.emailError
          ? `${order.emailError} [TRUSTPILOT_INVITED]`
          : "[TRUSTPILOT_INVITED]";
        await prisma.order.update({
          where: { id: order.id },
          data: { emailError: updatedMarker },
        });
      }

      processed.push({
        orderNumber: order.orderNumber,
        email: order.customerEmail,
        kitSynced: kitResult.synced,
        emailSent,
      });
    }

    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: "Workflow.TrustpilotInvites",
      method: req.method,
      apiUrl,
      statusCode: 200,
      responseBody: {
        window: "1-3 days post-delivery",
        trustpilotProfileUrl: TRUSTPILOT_REVIEW_URL,
        eligibleCount: orders.length,
        processed,
      },
    });

    return NextResponse.json({
      ok: true,
      window: "1-3 days post-delivery (24h-72h)",
      trustpilotProfileUrl: TRUSTPILOT_REVIEW_URL,
      eligibleCount: orders.length,
      processed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "Workflow.TrustpilotInvites",
      method: req.method,
      apiUrl,
      statusCode: 500,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

