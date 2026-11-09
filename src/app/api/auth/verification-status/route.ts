import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isEmailVerified } from "@/lib/email-verification";

export async function GET(req: NextRequest) {
  try {
    const authSession = await auth();
    const queryEmail = req.nextUrl.searchParams.get("email");
    const token = req.nextUrl.searchParams.get("token");

    const email = (queryEmail || authSession?.user?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ emailVerified: false, email: null });
    }

    const verified = await isEmailVerified(email, token);
    return NextResponse.json({
      email,
      emailVerified: verified,
    });
  } catch (err) {
    console.error("[verification-status]", err);
    return NextResponse.json({ emailVerified: false }, { status: 500 });
  }
}
