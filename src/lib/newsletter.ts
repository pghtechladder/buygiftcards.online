// Kit.com (formerly ConvertKit) v4 API integration for:
// 1. Newsletter signups (subscribeToKit)
// 2. Post-Purchase Trustpilot Review Invitation Workflow (triggerKitTrustpilotWorkflow)
//
// Every completed order (PayPal & Stripe) is synced to Kit.com with custom fields
// (`order_number`, `trustpilot_link`, `last_order_date`) and enrolled into the
// Kit.com Trustpilot Review Sequence / Tag, which waits 1–3 days after delivery
// and sends the compliant Trustpilot review invitation email.

import { writeTransactionLog } from "./logger";

export const TRUSTPILOT_REVIEW_URL = "https://www.trustpilot.com/review/buygiftcards.online";

export function deriveCustomerFirstName(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const first = name.trim().split(/\s+/)[0];
    if (first && !first.includes("@")) {
      return first.charAt(0).toUpperCase() + first.slice(1);
    }
  }
  if (email && email.includes("@")) {
    const local = email.split("@")[0].replace(/[._\-0-9]+/g, " ").trim();
    const first = local.split(/\s+/)[0];
    if (first && first.length >= 2) {
      return first.charAt(0).toUpperCase() + first.slice(1);
    }
  }
  return "there";
}

export async function subscribeToKit(email: string): Promise<{ synced: boolean }> {
  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;

  if (!apiKey) {
    console.warn(`[newsletter] KIT_API_KEY not set — ${email} saved locally only, not synced to Kit.com`);
    return { synced: false };
  }

  const subRes = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify({ email_address: email }),
  });

  if (!subRes.ok) {
    const body = await subRes.text().catch(() => "");
    throw new Error(`Kit.com subscribe failed (${subRes.status}): ${body}`);
  }

  if (formId) {
    const formRes = await fetch(`https://api.kit.com/v4/forms/${formId}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey,
      },
      body: JSON.stringify({ email_address: email }),
    });
    if (!formRes.ok) {
      const body = await formRes.text().catch(() => "");
      console.error(`[newsletter] Subscribed ${email} to Kit but failed attaching to form ${formId} (${formRes.status}): ${body}`);
    }
  }

  return { synced: true };
}

export type KitTrustpilotOrderPayload = {
  email: string;
  firstName?: string | null;
  orderNumber: string;
};

/**
 * Enrolls EVERY completed order into the Kit.com Trustpilot Review Invitation workflow.
 * Per Trustpilot guidelines:
 * - Triggered on EVERY completed order without filtering by order value, customer type, or support history.
 * - Populates Kit.com subscriber `first_name` and custom fields (`order_number`, `trustpilot_link`)
 *   so the Kit.com sequence email (delayed 1–3 days after delivery) renders:
 *     Subject: How was your order from BuyGiftCards.online?
 *     Hi {{ subscriber.first_name | default: "there" }},
 *     Thanks for your recent order ({{ subscriber.order_number }})...
 */
export async function triggerKitTrustpilotWorkflow(
  payload: KitTrustpilotOrderPayload
): Promise<{ synced: boolean; subscriberId?: number; reason?: string }> {
  const apiKey = process.env.KIT_API_KEY;
  const sequenceId = process.env.KIT_TRUSTPILOT_SEQUENCE_ID;
  const tagId = process.env.KIT_TRUSTPILOT_TAG_ID;
  const formId = process.env.KIT_TRUSTPILOT_FORM_ID || process.env.KIT_FORM_ID;

  const firstName = deriveCustomerFirstName(payload.firstName, payload.email);
  const email = payload.email.trim().toLowerCase();

  writeTransactionLog({
    phase: "PROCESS_START",
    process: "Kit.TrustpilotReviewWorkflow",
    orderNumber: payload.orderNumber,
    method: "POST",
    apiUrl: "https://api.kit.com/v4/subscribers",
    requestPayload: {
      email_address: email,
      first_name: firstName,
      fields: {
        order_number: payload.orderNumber,
        trustpilot_link: TRUSTPILOT_REVIEW_URL,
      },
      sequenceId: sequenceId || null,
      tagId: tagId || null,
    },
  });

  if (!apiKey) {
    console.info(
      `[kit-trustpilot] KIT_API_KEY not configured — order ${payload.orderNumber} (${email}) queued for scheduled 1–3 day Trustpilot review email cron.`
    );
    return { synced: false, reason: "KIT_API_KEY not set" };
  }

  try {
    // 1. Upsert subscriber in Kit.com v4 with first_name & custom order fields
    const subRes = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey,
      },
      body: JSON.stringify({
        email_address: email,
        first_name: firstName,
        state: "active",
        fields: {
          order_number: payload.orderNumber,
          trustpilot_link: TRUSTPILOT_REVIEW_URL,
          last_order_date: new Date().toISOString().slice(0, 10),
        },
      }),
    });

    const subData = await subRes.json().catch(() => ({}));
    if (!subRes.ok) {
      throw new Error(`Kit v4 upsert subscriber failed (${subRes.status}): ${JSON.stringify(subData)}`);
    }

    const subscriberId: number | undefined = subData?.subscriber?.id;

    // 2. Enroll in Kit.com Trustpilot Review Sequence (1–3 day delay automation)
    if (sequenceId) {
      const seqRes = await fetch(`https://api.kit.com/v4/sequences/${encodeURIComponent(sequenceId)}/subscribers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": apiKey,
        },
        body: JSON.stringify({ email_address: email }),
      });
      if (!seqRes.ok) {
        const errText = await seqRes.text().catch(() => "");
        console.warn(`[kit-trustpilot] Sequence ${sequenceId} enrollment warning (${seqRes.status}): ${errText}`);
      }
    }

    // 3. Apply Kit.com Tag (e.g. "trustpilot-review-invite" / "completed-order") to trigger Visual Automations
    if (tagId) {
      const tagRes = await fetch(`https://api.kit.com/v4/tags/${encodeURIComponent(tagId)}/subscribers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": apiKey,
        },
        body: JSON.stringify({ email_address: email }),
      });
      if (!tagRes.ok) {
        const errText = await tagRes.text().catch(() => "");
        console.warn(`[kit-trustpilot] Tag ${tagId} attach warning (${tagRes.status}): ${errText}`);
      }
    }

    // 4. Optional Form attachment
    if (formId) {
      await fetch(`https://api.kit.com/v4/forms/${encodeURIComponent(formId)}/subscribers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": apiKey,
        },
        body: JSON.stringify({ email_address: email }),
      }).catch(() => {});
    }

    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: "Kit.TrustpilotReviewWorkflow",
      orderNumber: payload.orderNumber,
      method: "POST",
      apiUrl: "https://api.kit.com/v4/subscribers",
      statusCode: 200,
      responseBody: { synced: true, subscriberId },
    });

    return { synced: true, subscriberId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[kit-trustpilot] Error syncing order ${payload.orderNumber} to Kit.com:`, message);
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "Kit.TrustpilotReviewWorkflow",
      orderNumber: payload.orderNumber,
      method: "POST",
      apiUrl: "https://api.kit.com/v4/subscribers",
      error: message,
    });
    return { synced: false, reason: message };
  }
}
