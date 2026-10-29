import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null; // caller should handle: log + no-op, same pattern as email.ts
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Zoho: 465 = implicit TLS, 587 = STARTTLS
    auth: { user, pass },
  });
  return transporter;
}

export async function sendSmtpMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const t = getTransporter();
  if (!t) {
    console.warn("[smtp] SMTP_HOST/SMTP_USER/SMTP_PASS not fully set — skipping send:", opts.subject);
    return { skipped: true };
  }

  // Automatically embed `cid:bgc-logo` if referenced in the HTML email so the logo
  // renders reliably in Outlook, Gmail, and Apple Mail even when sent from localhost.
  const attachments: { filename: string; path: string; cid: string; contentDisposition: "inline" }[] = [];
  if (opts.html.includes("cid:bgc-logo")) {
    const logoPath = path.join(process.cwd(), "public", "logo-full.png");
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: "logo-full.png",
        path: logoPath,
        cid: "bgc-logo",
        contentDisposition: "inline",
      });
    }
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  await t.sendMail({
    from,
    to: opts.to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    html: opts.html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });
  return { skipped: false };
}
