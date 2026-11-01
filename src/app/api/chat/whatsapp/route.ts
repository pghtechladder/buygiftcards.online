import { NextRequest, NextResponse } from "next/server";

const WHATSAPP_NUMBER = "917305022840";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "Hello support team! I need assistance with my gift card order.";
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  return NextResponse.redirect(url, 307);
}
