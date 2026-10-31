import type { Order, OrderItem, GiftCardCode } from "@prisma/client";
import { sendSmtpMail } from "./smtp";

type FullOrder = Order & { items: (OrderItem & { codes: GiftCardCode[] })[] };

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export type EmailResult = { sent: boolean; error?: string };

async function sendViaSmtp(opts: { to: string; subject: string; html: string; label: string }): Promise<EmailResult> {
  try {
    const res = await sendSmtpMail({
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (res.skipped) {
      return {
        sent: false,
        error: "SMTP_HOST / SMTP_USER / SMTP_PASS are not fully configured",
      };
    }
    console.log(`[email] Sent ${opts.label} via Zoho SMTP to ${opts.to}`);
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] Failed to send ${opts.label} via Zoho SMTP:`, err);
    return { sent: false, error: message };
  }
}

export async function sendOrderConfirmationEmail(order: FullOrder): Promise<EmailResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";
  const orderUrl = `${siteUrl}/orders/${order.orderNumber}?email=${encodeURIComponent(order.customerEmail)}`;

  const itemsHtml = order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;font-size:14px;color:#111827;">
          ${item.customPhotoUrl ? `<img src="${item.customPhotoUrl}" width="32" height="32" style="width:32px;height:32px;border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:8px;" alt="" />` : ""}
          <strong>${item.brandName}</strong> × ${item.quantity}
        </td>
        <td style="padding:10px 0;text-align:right;font-size:14px;font-weight:bold;color:#0f8c66;">${fmt(item.denomCents * item.quantity)}</td>
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
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#ffffff;">
      <div style="text-align:center;padding:20px 24px 14px;background:#ffffff;border-bottom:1px solid #f0f2f4;">
        <img src="cid:bgc-logo" alt="buygiftcards.online" width="210" style="max-width:210px;height:auto;display:block;margin:0 auto;" />
      </div>
      <div style="background-color:#0f8c66;background-image:linear-gradient(135deg,#0a4738,#0f8c66);color:#ffffff;padding:24px;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#d1fae5;margin-bottom:6px;font-weight:bold;">Instant Gift Card Delivery</div>
        <h2 style="margin:0;font-size:22px;color:#ffffff;">Order Confirmed — ${order.orderNumber}</h2>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;border-top:1px solid #e5e7eb;">
          <tr><td style="padding:6px 0;color:#4b5563;font-size:14px;">Subtotal</td><td style="padding:6px 0;text-align:right;color:#111827;font-size:14px;">${fmt(order.subtotalCents)}</td></tr>
          ${order.taxCents ? `<tr><td style="padding:6px 0;color:#4b5563;font-size:14px;">Tax</td><td style="padding:6px 0;text-align:right;color:#111827;font-size:14px;">${fmt(order.taxCents)}</td></tr>` : ""}
          <tr><td style="padding:8px 0;font-weight:bold;color:#111827;font-size:15px;">Total Paid</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#111827;font-size:15px;">${fmt(order.totalCents)}</td></tr>
        </table>
        ${addressLines.length ? `<p style="color:#4b5563;font-size:13px;margin-top:16px;">Billing address:<br>${addressLines.join("<br>")}</p>` : ""}
        <div style="margin-top:24px;text-align:center;">
          <a href="${orderUrl}" style="background-color:#0f8c66;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">View Your Gift Card Codes &rarr;</a>
        </div>
      </div>
    </div>
  `;

  return sendViaSmtp({
    to: order.customerEmail,
    subject: `Your buygiftcards.online order ${order.orderNumber}`,
    html,
    label: `order ${order.orderNumber} confirmation`,
  });
}

export async function sendRecipientGiftEmail(opts: {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  giftMessage?: string;
  occasion?: string;
  brandName: string;
  amountDollars: number;
  codes: string[];
  orderNumber: string;
  buyerEmail: string;
}): Promise<EmailResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";
  const orderUrl = `${siteUrl}/orders/${opts.orderNumber}?email=${encodeURIComponent(opts.buyerEmail)}`;
  const codeButtons = opts.codes
    .map((c) =>
      /^https?:\/\//i.test(c)
        ? `<p style="margin:12px 0;"><a href="${c}" style="background-color:#0f8c66;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Claim Your $${opts.amountDollars} ${opts.brandName} Gift Card &rarr;</a></p>`
        : `<div style="background-color:#f6f7f8;padding:14px;border-radius:10px;font-family:monospace;font-size:16px;font-weight:bold;color:#111827;margin:10px 0;">Code: ${c}</div>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;border:1px solid #eceef0;border-radius:16px;overflow:hidden;background:#ffffff;">
      <div style="text-align:center;padding:20px 24px 14px;background:#ffffff;border-bottom:1px solid #f0f2f4;">
        <img src="cid:bgc-logo" alt="buygiftcards.online" width="210" style="max-width:210px;height:auto;display:block;margin:0 auto;" />
      </div>
      <div style="background-color:#0f8c66;background-image:linear-gradient(135deg,#0c5844,#0f8c66);color:#ffffff;padding:28px 24px;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#d1fae5;margin-bottom:6px;font-weight:bold;">${opts.occasion || "A Special Gift For You"}</div>
        <h2 style="margin:0;font-size:24px;color:#ffffff;">You received a $${opts.amountDollars} ${opts.brandName} Gift Card!</h2>
        <p style="margin:8px 0 0;color:#ecfdf5;font-size:14px;">Sent with love from ${opts.senderName}</p>
      </div>
      <div style="padding:24px;">
        ${opts.recipientName ? `<p style="color:#151a1f;font-size:15px;">Hi <strong>${opts.recipientName}</strong>,</p>` : ""}
        ${opts.giftMessage ? `<blockquote style="margin:16px 0;padding:14px 18px;background-color:#eefcf6;border-left:4px solid #0f8c66;border-radius:8px;color:#0a4738;font-style:italic;">"${opts.giftMessage}"</blockquote>` : ""}
        <div style="margin:20px 0;text-align:center;">${codeButtons}</div>
        <p style="font-size:12px;color:#6b7280;text-align:center;margin-top:24px;">
          Order reference: ${opts.orderNumber} · <a href="${orderUrl}" style="color:#0f8c66;font-weight:bold;">View on buygiftcards.online</a>
        </p>
      </div>
    </div>
  `;

  return sendViaSmtp({
    to: opts.recipientEmail,
    subject: `${opts.senderName} sent you a $${opts.amountDollars} ${opts.brandName} Gift Card!`,
    html,
    label: `recipient gift email for ${opts.orderNumber}`,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailResult> {
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;border:1px solid #eceef0;border-radius:16px;padding:24px;background:#ffffff;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="cid:bgc-logo" alt="buygiftcards.online" width="210" style="max-width:210px;height:auto;display:block;margin:0 auto;" />
      </div>
      <h2 style="color:#0f8c66;">Reset your password</h2>
      <p style="color:#333333;">We received a request to reset the password on your buygiftcards.online account. This link expires in 1 hour.</p>
      <p style="margin-top:20px;"><a href="${resetUrl}" style="background-color:#0f8c66;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Reset Password</a></p>
      <p style="color:#666666;font-size:13px;margin-top:20px;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
    </div>
  `;

  return sendViaSmtp({
    to: email,
    subject: "Reset your buygiftcards.online password",
    html,
    label: `password reset for ${email}`,
  });
}

export async function sendRedemptionConfirmationEmail(opts: {
  email: string;
  sourceBrandName: string;
  sourceCardMasked: string;
  orderNumber: string;
  redeemedItems: {
    brandName: string;
    amountCents: number;
    code: string;
    pin: string;
    isDemo: boolean;
  }[];
  remainingCard?: {
    amountCents: number;
    code: string;
    pin: string;
  };
}): Promise<EmailResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";
  const orderUrl = `${siteUrl}/orders/${opts.orderNumber}?email=${encodeURIComponent(opts.email)}`;
  const redeemUrl = `${siteUrl}/redeem`;

  const itemsHtml = opts.redeemedItems
    .map((item) => {
      const isUrl = /^https?:\/\//i.test(item.code);
      return `
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;background-color:#f9fafb;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
            <tr>
              <td style="font-size:15px;font-weight:bold;color:#111827;">${item.brandName} eGift Card</td>
              <td style="font-size:15px;font-weight:bold;color:#0f8c66;text-align:right;">${fmt(item.amountCents)}</td>
            </tr>
          </table>
          ${
            isUrl
              ? `<div style="margin-top:10px;">
                  <a href="${item.code}" style="background-color:#0f8c66;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">Claim Your ${fmt(item.amountCents)} ${item.brandName} Gift Card &rarr;</a>
                  <div style="font-size:11px;color:#6b7280;margin-top:6px;word-break:break-all;">Direct Claim Link: ${item.code}</div>
                </div>`
              : `<div style="font-family:monospace;font-size:14px;background-color:#ffffff;padding:10px 12px;border-radius:8px;border:1px solid #e5e7eb;margin-top:8px;color:#111827;">
                  <div><strong>Card / Voucher Code:</strong> ${item.code}</div>
                  ${item.pin ? `<div style="margin-top:4px;"><strong>PIN:</strong> ${item.pin}</div>` : ""}
                </div>`
          }
        </div>
      `;
    })
    .join("");

  const remainingHtml = opts.remainingCard
    ? `
      <div style="border:2px dashed #0f8c66;border-radius:12px;padding:16px;margin-top:16px;background-color:#eefcf6;">
        <div style="font-weight:bold;color:#0a4738;margin-bottom:6px;">Remaining Balance Voucher (${fmt(opts.remainingCard.amountCents)})</div>
        <p style="font-size:12px;color:#0c5844;margin:0 0 8px;">Use this new voucher code and PIN anytime at <a href="${redeemUrl}" style="color:#0f8c66;font-weight:bold;">buygiftcards.online/redeem</a> to spend your remaining balance:</p>
        <div style="font-family:monospace;font-size:14px;font-weight:bold;color:#06392d;">
          Card #: ${opts.remainingCard.code} &nbsp;|&nbsp; PIN: ${opts.remainingCard.pin}
        </div>
      </div>
    `
    : "";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;border:1px solid #eceef0;border-radius:16px;overflow:hidden;background-color:#ffffff;">
      <div style="text-align:center;padding:20px 24px 14px;background-color:#ffffff;border-bottom:1px solid #f0f2f4;">
        <img src="cid:bgc-logo" alt="buygiftcards.online" width="210" style="max-width:210px;height:auto;display:block;margin:0 auto;" />
      </div>
      <div style="background-color:#0f8c66;background-image:linear-gradient(135deg,#0a4738,#0f8c66);color:#ffffff;padding:24px;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#d1fae5;margin-bottom:6px;font-weight:bold;">Gift Card Redemption Complete</div>
        <h2 style="margin:0;font-size:22px;color:#ffffff;">Your eGift Cards Are Ready!</h2>
        <p style="margin:6px 0 0;color:#ecfdf5;font-size:13px;">Swapped from ${opts.sourceBrandName} (${opts.sourceCardMasked})</p>
      </div>
      <div style="padding:24px;">
        <p style="color:#374151;font-size:14px;line-height:1.5;margin-top:0;">
          Your <strong>${opts.sourceBrandName}</strong> redemption has been processed. Below are your newly issued merchant eGift card credentials:
        </p>
        ${itemsHtml}
        ${remainingHtml}
        <p style="margin-top:20px;text-align:center;">
          <a href="${orderUrl}" style="background-color:#111827;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;display:inline-block;">View Full Order (${opts.orderNumber})</a>
        </p>
      </div>
    </div>
  `;

  return sendViaSmtp({
    to: opts.email,
    subject: `Your redeemed eGift cards from buygiftcards.online (${opts.orderNumber})`,
    html,
    label: `redemption confirmation for ${opts.orderNumber}`,
  });
}
