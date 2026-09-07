import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const BodySchema = z.object({ email: z.string().email() });

const GENERIC_MESSAGE = "If an account with that email exists, we've sent a password reset link.";

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    const email = parsed.data.email.trim().toLowerCase();

    // Always respond the same way regardless of whether the email is
    // registered, has a password set, or the send even succeeds — never
    // reveal whether an email exists in our system (avoid user enumeration).
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      // Skip OAuth-only accounts (no passwordHash) silently — there's no
      // password to reset for them.
      if (user && user.passwordHash) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordResetToken.create({
          data: { token, userId: user.id, expiresAt },
        });

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";
        const resetUrl = `${siteUrl}/reset-password?token=${token}`;
        const result = await sendPasswordResetEmail(email, resetUrl);
        if (!result.sent) {
          console.error(`[/api/auth/forgot-password] Failed to send reset email to ${email}:`, result.error);
        }
      }
    } catch (err) {
      console.error("[/api/auth/forgot-password] Unexpected error while processing request:", err);
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error("[/api/auth/forgot-password]", err);
    // Even a parse/unexpected failure shouldn't leak anything — but a
    // malformed body is still worth a 400 above; this catch is for truly
    // unexpected errors.
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  }
}
