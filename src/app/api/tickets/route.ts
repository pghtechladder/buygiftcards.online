import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendSmtpMail } from "@/lib/smtp";
import crypto from "crypto";

const TicketCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional().nullable(),
  orderNumber: z.string().max(60).optional().nullable(),
  subject: z.string().min(1).max(200),
  issueType: z.string().max(50).default("general"),
  description: z.string().min(1).max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = TicketCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter your name, valid email, and describe your issue." },
        { status: 400 }
      );
    }

    const { name, email, phone, orderNumber, subject, issueType, description, priority } = parsed.data;

    // Generate unique Ticket ID: e.g. TKT-20261101-A4B2
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const ticketNumber = `TKT-${dateStr}-${randomHex}`;

    // 1. Save ticket into database
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        name,
        email,
        phone: phone || null,
        orderNumber: orderNumber || null,
        subject,
        issueType,
        description,
        priority,
        status: "OPEN",
      },
    });

    const supportInbox = process.env.SUPPORT_INBOX_EMAIL || "support@buygiftcards.online";

    // 2. Dispatch detailed notification email directly to support@buygiftcards.online
    try {
      await sendSmtpMail({
        to: supportInbox,
        replyTo: email,
        subject: `[${ticketNumber}] New Support Ticket: ${subject}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
            <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: left;">
              <h1 style="margin: 0 0 6px; font-size: 20px; font-weight: 700;">Support Ticket Received</h1>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Ticket Number: <strong>${ticketNumber}</strong></p>
            </div>
            
            <div style="padding: 24px; background-color: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 140px;">Customer Name:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(name)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Customer Email:</td>
                  <td style="padding: 8px 0; font-weight: 600;"><a href="mailto:${escapeHtml(email)}" style="color: #4f46e5;">${escapeHtml(email)}</a></td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Phone:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(phone)}</td>
                </tr>` : ""}
                ${orderNumber ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Order Number:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(orderNumber)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Category:</td>
                  <td style="padding: 8px 0; text-transform: capitalize;">${escapeHtml(issueType)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Priority:</td>
                  <td style="padding: 8px 0;"><span style="background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 700;">${priority}</span></td>
                </tr>
              </table>

              <div style="border-top: 1px solid #f1f5f9; padding-top: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #0f172a;">Issue Description</h3>
                <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(description)}</div>
              </div>
            </div>

            <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
              You can reply directly to this email to respond back to <strong>${escapeHtml(name)}</strong> at <strong>${escapeHtml(email)}</strong>.
            </div>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("[/api/tickets] Failed to send email to support inbox:", mailErr);
    }

    // 3. Send automated confirmation acknowledgment to user
    try {
      await sendSmtpMail({
        to: email,
        subject: `[${ticketNumber}] We've received your request: ${subject}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; color: #1e293b;">
            <div style="padding: 20px 0; text-align: left;">
              <h2 style="color: #4f46e5; margin: 0 0 8px;">Hi ${escapeHtml(name)},</h2>
              <p style="font-size: 15px; line-height: 1.5; color: #334155;">
                We have received your support request. Our customer support team at <strong>support@buygiftcards.online</strong> is reviewing your ticket and will get back to you shortly.
              </p>
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 6px; font-size: 14px;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
                <p style="margin: 0 0 6px; font-size: 14px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
                <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> Open</p>
              </div>
              <p style="font-size: 13px; color: #64748b;">
                Need to add more details? Simply reply directly to this email.
              </p>
            </div>
          </div>
        `,
      });
    } catch (ackErr) {
      console.warn("[/api/tickets] Failed to send user acknowledgment:", ackErr);
    }

    return NextResponse.json({
      ok: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
      },
    });
  } catch (err) {
    console.error("[/api/tickets POST error]", err);
    return NextResponse.json({ error: "Failed to create support ticket." }, { status: 500 });
  }
}

// GET /api/tickets - Support Ticket Management API
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const ticketNumber = searchParams.get("ticketNumber");
    const status = searchParams.get("status");

    const where: any = {};
    if (email) where.email = email.toLowerCase().trim();
    if (ticketNumber) where.ticketNumber = ticketNumber.trim();
    if (status) where.status = status;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ ok: true, tickets });
  } catch (err) {
    console.error("[/api/tickets GET error]", err);
    return NextResponse.json({ error: "Failed to fetch tickets." }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

