import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAndSendVerificationOtp } from "@/lib/email-verification";
import { verifyTurnstile, TURNSTILE_HEADER } from "@/lib/turnstile";
import { getClientIp } from "@/lib/rate-limit";

const RequestSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const turnstileToken = req.headers.get(TURNSTILE_HEADER);
    if (turnstileToken) {
      const captcha = await verifyTurnstile(turnstileToken, getClientIp(req.headers));
      if (!captcha.ok) {
        return NextResponse.json(
          { error: "Security check failed. Please refresh and try again." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const result = await createAndSendVerificationOtp(email);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send code" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `A 6-digit verification code has been sent to ${email}`,
    });
  } catch (err) {
    console.error("[send-verification-otp]", err);
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}
