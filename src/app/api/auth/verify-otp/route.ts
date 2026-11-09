import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtpCode } from "@/lib/email-verification";

const VerifySchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  otp: z.string().trim().min(6).max(6, "Code must be 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid verification code payload" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const result = await verifyOtpCode(email, parsed.data.otp);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      emailVerified: true,
      email,
      verificationToken: result.verificationToken,
      message: "Email verified successfully.",
    });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Failed to verify code." }, { status: 500 });
  }
}
