import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBrand, isValidDenomination, chargeAmountCents } from "@/lib/brands";
import { getGiftCardProvider } from "@/lib/giftcard-provider";
import { generateOrderNumber, generateDemoCode, generateDemoPin } from "@/lib/order";
import { authenticateEnterpriseRequest } from "@/lib/enterprise-auth";
import { resolveCountryFromHostOrEnv, getCurrencyCode, CountryCode } from "@/lib/country-config";
import { writeTransactionLog } from "@/lib/logger";

export const dynamic = "force-dynamic";

const IssueGiftCardSchema = z.object({
  brandSlug: z.string().min(1),
  amount: z.number().positive(),
  deliveryType: z.enum(["egift", "physical"]).default("egift"),
  recipientEmail: z.string().email(),
  recipientName: z.string().max(80).optional(),
  senderName: z.string().max(80).optional(),
  giftMessage: z.string().max(300).optional(),
  country: z.enum(["US", "CA", "SG", "UK", "AU"]).optional(),
  idempotencyKey: z.string().max(100).optional(),
  poNumber: z.string().max(60).optional(),
});

export async function POST(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  const auth = authenticateEnterpriseRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: auth.error,
        documentation: "https://buygiftcards.online/platform/api",
      },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = IssueGiftCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const {
    brandSlug,
    amount,
    deliveryType,
    recipientEmail,
    recipientName,
    senderName,
    giftMessage,
    idempotencyKey,
    poNumber,
  } = parsed.data;

  const country: CountryCode = parsed.data.country || resolveCountryFromHostOrEnv(req.headers.get("host"));
  const currency = getCurrencyCode(country);
  const brand = getBrand(brandSlug, country);

  if (!brand) {
    return NextResponse.json(
      { error: `Brand not found: '${brandSlug}' for country '${country}'` },
      { status: 404 }
    );
  }

  const denomCents = Math.round(amount * 100);
  if (!isValidDenomination(brand, denomCents)) {
    return NextResponse.json(
      {
        error: `Invalid denomination for ${brand.name}. Min: ${brand.min}, Max: ${brand.max}`,
        supportedDenominations: brand.denominations,
      },
      { status: 400 }
    );
  }

  const orderNumber = idempotencyKey ? `BGC-ENT-${idempotencyKey.slice(0, 16)}` : generateOrderNumber();
  const chargeCents = chargeAmountCents(brand, amount);

  writeTransactionLog({
    phase: "PROCESS_START",
    process: "Enterprise.IssueGiftCard",
    transactionId: orderNumber,
    method: "POST",
    apiUrl,
    requestPayload: {
      partnerId: auth.partnerId,
      isTestMode: auth.isTestMode,
      brandSlug,
      amount,
      recipientEmail,
      country,
    },
  });

  try {
    let voucherCode = "";
    let voucherPin = "";
    let isDemo = auth.isTestMode;
    let claimUrl: string | undefined;

    if (auth.isTestMode) {
      voucherCode = `TEST-${generateDemoCode()}`;
      voucherPin = generateDemoPin();
      claimUrl = `https://buygiftcards.online/redeem?code=${voucherCode}`;
    } else {
      const provider = getGiftCardProvider(country);
      const issued = await provider.issue({
        brandSlug: brand.slug,
        amountCents: denomCents,
        deliveryType,
        recipientEmail,
        recipientName,
        senderName: senderName || "Enterprise Rewards",
        giftMessage,
        poNumber,
      });
      voucherCode = issued.code;
      voucherPin = issued.pin;
      isDemo = issued.isDemo;
      claimUrl = `https://buygiftcards.online/redeem?code=${encodeURIComponent(voucherCode)}`;
    }

    // Persist order in DB
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerEmail: recipientEmail,
        subtotalCents: chargeCents,
        totalCents: chargeCents,
        currency: currency.toLowerCase(),
        status: "FULFILLED",
        stripeCheckoutSessionId: `enterprise_${orderNumber}`,
        items: {
          create: [
            {
              brandSlug: brand.slug,
              brandName: brand.name,
              denomCents,
              quantity: 1,
              deliveryType: deliveryType === "physical" ? "PHYSICAL" : "EGIFT",
              codes: {
                create: [
                  {
                    code: voucherCode,
                    pin: voucherPin,
                    isDemo,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: "Enterprise.IssueGiftCard",
      transactionId: orderNumber,
      orderNumber: order.orderNumber,
      method: "POST",
      apiUrl,
      statusCode: 201,
      responseBody: {
        orderNumber: order.orderNumber,
        brandSlug: brand.slug,
        amount,
        isTestMode: auth.isTestMode,
      },
    });

    return NextResponse.json(
      {
        status: "COMPLETED",
        orderNumber: order.orderNumber,
        testMode: auth.isTestMode,
        partnerId: auth.partnerId,
        poNumber: poNumber || null,
        brand: {
          slug: brand.slug,
          name: brand.name,
          category: brand.category,
        },
        denomination: {
          faceValue: amount,
          currency,
          chargedAmount: chargeCents / 100,
        },
        recipient: {
          name: recipientName || null,
          email: recipientEmail,
        },
        voucher: {
          code: voucherCode,
          pin: voucherPin,
          claimUrl,
          deliveryType,
          expiresAt: null,
        },
        issuedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "Enterprise.IssueGiftCard",
      transactionId: orderNumber,
      method: "POST",
      apiUrl,
      statusCode: 500,
      error: errorMsg,
    });
    return NextResponse.json(
      {
        error: "Fulfillment Failed",
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}
