import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBrand, isValidDenomination, chargeAmountCents } from "@/lib/brands";
import { getGiftCardProvider } from "@/lib/giftcard-provider";
import { generateOrderNumber, generateDemoCode, generateDemoPin } from "@/lib/order";
import { authenticateEnterpriseRequest } from "@/lib/enterprise-auth";
import { resolveCountryFromHostOrEnv, getCurrencyCode, CountryCode } from "@/lib/country-config";

export const dynamic = "force-dynamic";

const BulkItemSchema = z.object({
  brandSlug: z.string().min(1),
  amount: z.number().positive(),
  recipientEmail: z.string().email(),
  recipientName: z.string().max(80).optional(),
  giftMessage: z.string().max(300).optional(),
  deliveryType: z.enum(["egift", "physical"]).default("egift"),
});

const BulkOrderSchema = z.object({
  items: z.array(BulkItemSchema).min(1).max(200),
  batchReference: z.string().max(60).optional(),
  country: z.enum(["US", "CA", "SG", "UK", "AU"]).optional(),
  senderName: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const auth = authenticateEnterpriseRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: "Unauthorized", message: auth.error },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BulkOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { items, batchReference, senderName } = parsed.data;
  const country: CountryCode = parsed.data.country || resolveCountryFromHostOrEnv(req.headers.get("host"));
  const currency = getCurrencyCode(country);
  const provider = auth.isTestMode ? null : getGiftCardProvider(country);

  const results: Array<{
    recipientEmail: string;
    brandSlug: string;
    amount: number;
    status: "SUCCESS" | "FAILED";
    voucherCode?: string;
    voucherPin?: string;
    claimUrl?: string;
    error?: string;
  }> = [];

  let batchTotalCents = 0;

  for (const item of items) {
    const brand = getBrand(item.brandSlug, country);
    if (!brand) {
      results.push({
        recipientEmail: item.recipientEmail,
        brandSlug: item.brandSlug,
        amount: item.amount,
        status: "FAILED",
        error: `Brand '${item.brandSlug}' not found`,
      });
      continue;
    }

    const denomCents = Math.round(item.amount * 100);
    if (!isValidDenomination(brand, denomCents)) {
      results.push({
        recipientEmail: item.recipientEmail,
        brandSlug: item.brandSlug,
        amount: item.amount,
        status: "FAILED",
        error: `Invalid denomination for ${brand.name}`,
      });
      continue;
    }

    const chargeCents = chargeAmountCents(brand, item.amount);
    batchTotalCents += chargeCents;

    try {
      let code = "";
      let pin = "";
      if (auth.isTestMode || !provider) {
        code = `TEST-${generateDemoCode()}`;
        pin = generateDemoPin();
      } else {
        const issued = await provider.issue({
          brandSlug: brand.slug,
          amountCents: denomCents,
          deliveryType: item.deliveryType,
          recipientEmail: item.recipientEmail,
          recipientName: item.recipientName,
          senderName: senderName || "Enterprise Rewards",
          giftMessage: item.giftMessage,
        });
        code = issued.code;
        pin = issued.pin;
      }

      results.push({
        recipientEmail: item.recipientEmail,
        brandSlug: brand.slug,
        amount: item.amount,
        status: "SUCCESS",
        voucherCode: code,
        voucherPin: pin,
        claimUrl: `https://buygiftcards.online/redeem?code=${encodeURIComponent(code)}`,
      });
    } catch (e: unknown) {
      results.push({
        recipientEmail: item.recipientEmail,
        brandSlug: item.brandSlug,
        amount: item.amount,
        status: "FAILED",
        error: e instanceof Error ? e.message : "Fulfillment error",
      });
    }
  }

  const successCount = results.filter((r) => r.status === "SUCCESS").length;
  const failCount = results.length - successCount;
  const batchOrderNumber = generateOrderNumber();

  return NextResponse.json({
    status: failCount === 0 ? "COMPLETED" : successCount > 0 ? "PARTIAL_COMPLETION" : "FAILED",
    batchOrderNumber,
    batchReference: batchReference || null,
    testMode: auth.isTestMode,
    totalRequested: items.length,
    successCount,
    failCount,
    totalCharged: batchTotalCents / 100,
    currency,
    results,
  });
}
