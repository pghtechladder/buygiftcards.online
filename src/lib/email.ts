import { Resend } from "resend";
import type { Order, OrderItem, GiftCardCode } from "@prisma/client";

type FullOrder = Order & { items: (OrderItem & { codes: GiftCardCode[] })[] };

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export type EmailResult = { sent: boolean; error?: string };

export async function sendOrderConfirmationEmail(order: FullOrder): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email for order ${order.orderNumber}`);
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const resend = new Resend(apiKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const orderUrl = `${siteUrl}/orders/${order.orderNumber}?email=${encodeURIComponent(order.customerEmail)}`;
  const hasDemoCodes = order.items.some((i) => i.codes.some((c) => c.isDemo));

  const itemsHtml = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;">
          ${item.customPhotoUrl ? `<img src="${item.customPhotoUrl}" width="32" height="32" style="width:32px;height:32px;border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:8px;" alt="" />` : ""}
          ${item.brandName} × ${item.quantity}
        </td>
        <td style="padding:8px 0;text-align:right;">${fmt(item.denomCents * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const addressLines = [
    order.billingLine1,
    order.billingLine2,
    [order.billingCity, order.billingState, order.billingPostalCode].filter(Boolean).join(", "),
    order.billingCountry,
  ].filter(Boolean);

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${siteUrl}/logo-full.png" alt="buygiftcards.online" width="220" style="max-width:220px;height:auto;" />
      </div>
      <h2 style="color:#0f8c66;">Order confirmed — ${order.orderNumber}</h2>
      ${hasDemoCodes ? `<p style="background:#fff3cd;padding:12px;border-radius:8px;color:#7a5b00;font-size:13px;">Demo mode: the codes on this order are randomly generated placeholders, not real redeemable gift cards.</p>` : ""}
      <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;border-top:1px solid #eee;">
        <tr><td style="padding:6px 0;color:#666;">Subtotal</td><td style="padding:6px 0;text-align:right;">${fmt(order.subtotalCents)}</td></tr>
        ${order.taxCents ? `<tr><td style="padding:6px 0;color:#666;">Tax</td><td style="padding:6px 0;text-align:right;">${fmt(order.taxCents)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;font-weight:bold;">Total paid</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${fmt(order.totalCents)}</td></tr>
      </table>
      ${addressLines.length ? `<p style="color:#666;font-size:13px;margin-top:16px;">Billing address:<br>${addressLines.join("<br>")}</p>` : ""}
      <p style="margin-top:20px;"><a href="${orderUrl}" style="background:#0f8c66;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">View your gift card codes</a></p>
    </div>
  `;

  try {
    // resend.emails.send() does NOT throw on API-level rejection (bad
    // recipient, unverified domain, etc.) — it returns { data, error }. We
    // were never checking .error, so a silently-rejected send still looked
    // like a success. Check both this and thrown exceptions (network
    // failures, invalid API key) so the order record reflects reality.
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "orders@buygiftcards.online",
      to: order.customerEmail,
      subject: `Your buygiftcards.online order ${order.orderNumber}`,
      html,
    });

    if (error) {
      console.error(`[email] Resend rejected order ${order.orderNumber}:`, error);
      return { sent: false, error: error.message || JSON.stringify(error) };
    }
    console.log(`[email] Sent order ${order.orderNumber} confirmation, Resend id ${data?.id}`);
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] Failed to send order ${order.orderNumber} confirmation:`, err);
    return { sent: false, error: message };
  }
}

// "Forgot password" email — same Resend call pattern/error-checking as
// sendOrderConfirmationEmail above (check both the thrown-exception path and
// the returned { data, error } field, since Resend doesn't throw on
// API-level rejection).
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping password reset email for ${email}`);
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const resend = new Resend(apiKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${siteUrl}/logo-full.png" alt="buygiftcards.online" width="220" style="max-width:220px;height:auto;" />
      </div>
      <h2 style="color:#0f8c66;">Reset your password</h2>
      <p style="color:#333;">We received a request to reset the password on your buygiftcards.online account. This link expires in 1 hour.</p>
      <p style="margin-top:20px;"><a href="${resetUrl}" style="background:#0f8c66;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
      <p style="color:#666;font-size:13px;margin-top:20px;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "orders@buygiftcards.online",
      to: email,
      subject: "Reset your buygiftcards.online password",
      html,
    });

    if (error) {
      console.error(`[email] Resend rejected password reset for ${email}:`, error);
      return { sent: false, error: error.message || JSON.stringify(error) };
    }
    console.log(`[email] Sent password reset to ${email}, Resend id ${data?.id}`);
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] Failed to send password reset to ${email}:`, err);
    return { sent: false, error: message };
  }
}
