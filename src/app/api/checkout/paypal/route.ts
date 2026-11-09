import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBrand, isValidDenomination, chargeAmountCents } from "@/lib/brands";
import { generateOrderNumber } from "@/lib/order";
import { isFulfillableBrand } from "@/lib/giftcard-provider";
import { createPayPalOrder, fulfillPayPalOrderById } from "@/lib/paypal";
import { auth } from "@/lib/auth";
import { writeTransactionLog } from "@/lib/logger";
import { verifyTurnstile, TURNSTILE_HEADER } from "@/lib/turnstile";
import { getClientIp } from "@/lib/rate-limit";
import { getStoredAffiliateData, sendAffiliateConversionPostback } from "@/lib/affiliate";
import {
  resolveCountryFromHostOrEnv,
  getCountryEnv,
  getCurrencyCode,
  getCurrencySymbol,
} from "@/lib/country-config";
import { isEmailVerified } from "@/lib/email-verification";

const CartItemSchema = z.object({
  brandSlug: z.string(),
  amount: z.number().positive(),
  qty: z.number().int().min(1).max(10),
  deliveryType: z.enum(["egift", "physical"]),
  customPhotoUrl: z.string().url().optional(),
  recipientName: z.string().max(80).optional(),
  recipientEmail: z.string().email().max(120).optional().or(z.literal("")),
  senderName: z.string().max(80).optional(),
  giftMessage: z.string().max(240).optional(),
  occasion: z.string().max(40).optional(),
  deliveryDate: z.string().max(20).optional(),
});

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    items: z.array(CartItemSchema).min(1).max(20),
    idempotencyKey: z.string().optional(),
    country: z.string().max(4).optional(),
    landingPage: z.enum(["LOGIN", "GUEST_CHECKOUT", "NO_PREFERENCE"]).optional(),
    paymentMethod: z
      .enum(["paypal", "card", "crypto", "applepay", "googlepay"])
      .optional(),
    emailVerificationToken: z.string().optional(),
    payer: z
      .object({
        givenName: z.string().max(80).optional(),
        surname: z.string().max(80).optional(),
        email: z.string().email().max(120).optional().or(z.literal("")),
        countryCode: z.string().max(4).optional(),
        postalCode: z.string().max(20).optional(),
      })
      .optional(),
  }),
  z.object({
    action: z.literal("capture"),
    paypalOrderId: z.string().min(3),
    country: z.string().max(4).optional(),
  }),
]);

export async function POST(req: NextRequest) {
  const apiUrl = req.nextUrl.toString();
  try {
    const authSession = await auth();
    const rawBody = await req.json();

    writeTransactionLog({
      phase: "PROCESS_START",
      process: `PayPal.${rawBody?.action === "capture" ? "CaptureAndFulfill" : "CreateCheckoutOrder"}`,
      transactionId: rawBody?.paypalOrderId,
      method: "POST",
      apiUrl,
      requestPayload: rawBody,
    });

    const parsed = ActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      writeTransactionLog({
        phase: "PROCESS_ERROR",
        process: "PayPal.Checkout",
        method: "POST",
        apiUrl,
        statusCode: 400,
        error: "Invalid PayPal request payload",
      });
      return NextResponse.json({ error: "Invalid PayPal checkout payload" }, { status: 400 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const cookieCountry = req.cookies.get("bgc-country")?.value;
    const activeCountry = resolveCountryFromHostOrEnv(
      host,
      parsed.data.country || cookieCountry
    );
    const currencyCode = getCurrencyCode(activeCountry);
    const currencySym = getCurrencySymbol(activeCountry);
    const reqOrigin = req.nextUrl.origin;
    const siteUrl =
      reqOrigin && reqOrigin.includes("localhost")
        ? reqOrigin
        : getCountryEnv("NEXT_PUBLIC_SITE_URL", activeCountry, "https://buygiftcards.online");

    // 1. CREATE PAYPAL ORDER
    if (parsed.data.action === "create") {
      // Behavioral bot check (Cloudflare Turnstile) before any payment order is created
      const captcha = await verifyTurnstile(req.headers.get(TURNSTILE_HEADER), getClientIp(req.headers));
      if (!captcha.ok) {
        writeTransactionLog({
          phase: "PROCESS_ERROR",
          process: "PayPal.CreateCheckoutOrder.BotCheck",
          method: "POST",
          apiUrl,
          statusCode: 403,
          error: `Turnstile rejected: ${captcha.reason}`,
        });
        return NextResponse.json(
          { error: "Security verification failed. Please refresh the page and try again." },
          { status: 403 }
        );
      }

      // Mandatory Email Verification Check:
      // Checkout cannot proceed without verified email address (stops carding bots & ensures delivery)
      const customerEmail = (
        parsed.data.payer?.email ||
        authSession?.user?.email ||
        parsed.data.items.find((i) => i.recipientEmail)?.recipientEmail ||
        ""
      ).trim().toLowerCase();

      if (!customerEmail) {
        return NextResponse.json(
          {
            error: "A valid email address is required before continuing to checkout.",
            code: "EMAIL_REQUIRED",
          },
          { status: 400 }
        );
      }

      const isVerified = await isEmailVerified(customerEmail, parsed.data.emailVerificationToken);
      if (!isVerified) {
        writeTransactionLog({
          phase: "PROCESS_ERROR",
          process: "PayPal.CreateCheckoutOrder.EmailVerificationRequired",
          method: "POST",
          apiUrl,
          statusCode: 403,
          error: `Email verification required for ${customerEmail}`,
        });
        return NextResponse.json(
          {
            error: "Email verification is required before checkout. Please complete the 6-digit email verification step to proceed.",
            code: "EMAIL_VERIFICATION_REQUIRED",
            requiresVerification: true,
            email: customerEmail,
          },
          { status: 403 }
        );
      }

      const { items } = parsed.data;
      let subtotalCents = 0;

      const validatedLines: Array<{
        item: z.infer<typeof CartItemSchema>;
        brandName: string;
        denomCents: number;
        chargeCents: number;
        customPhotoUrl?: string;
      }> = [];

      for (const item of items) {
        const brand = getBrand(item.brandSlug, activeCountry);
        if (!brand) {
          return NextResponse.json({ error: `Unknown brand: ${item.brandSlug}` }, { status: 400 });
        }
        if (!isFulfillableBrand(brand.slug, activeCountry)) {
          return NextResponse.json(
            { error: `${brand.name} is temporarily unavailable. Please choose another brand.` },
            { status: 400 }
          );
        }
        if (brand.type !== "both" && brand.type !== item.deliveryType) {
          return NextResponse.json(
            { error: `${brand.name} does not support ${item.deliveryType} delivery` },
            { status: 400 }
          );
        }
        const denomCents = Math.round(item.amount * 100);
        if (!isValidDenomination(brand, denomCents)) {
          return NextResponse.json({ error: `Invalid amount for ${brand.name}` }, { status: 400 });
        }
        const chargeCents = chargeAmountCents(brand, item.amount);
        subtotalCents += chargeCents * item.qty;

        let customPhotoUrl: string | undefined;
        if (item.customPhotoUrl && brand.supportsCustomPhoto) {
          if (/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(item.customPhotoUrl)) {
            customPhotoUrl = item.customPhotoUrl;
          }
        }

        validatedLines.push({
          item,
          brandName: brand.name,
          denomCents,
          chargeCents,
          customPhotoUrl,
        });
      }

      const orderNumber = generateOrderNumber();
      const userFullName = authSession?.user?.name || "";
      const [defaultFirst, ...restName] = userFullName.trim().split(/\s+/);
      const defaultLast = restName.join(" ");

      const paypalOrder = await createPayPalOrder({
        country: activeCountry,
        totalCents: subtotalCents,
        customId: orderNumber,
        returnUrl: `${siteUrl}/checkout/success?provider=paypal&method=${encodeURIComponent(
          parsed.data.paymentMethod || "paypal"
        )}`,
        cancelUrl: `${siteUrl}/checkout`,
        landingPage: parsed.data.landingPage,
        paymentMethod: parsed.data.paymentMethod,
        payer: {
          givenName: parsed.data.payer?.givenName || defaultFirst || "Valued",
          surname: parsed.data.payer?.surname || defaultLast || "Customer",
          email: parsed.data.payer?.email || authSession?.user?.email || undefined,
          countryCode: parsed.data.payer?.countryCode || activeCountry,
          postalCode: parsed.data.payer?.postalCode,
        },
        items: validatedLines.map((line) => ({
          name: `${line.brandName} ${line.item.deliveryType === "egift" ? "eGift" : "Physical"} Card (${currencySym}${line.item.amount})`,
          description: line.item.recipientEmail
            ? `Gift for ${line.item.recipientName || line.item.recipientEmail}`
            : `Digital Gift Card`,
          unitAmountCents: line.chargeCents,
          quantity: line.item.qty,
          sku: `${line.item.brandSlug}-${line.item.amount}`,
        })),
      });

      const sessionKey = `paypal_${paypalOrder.id}`;
      const initialEmail =
        parsed.data.payer?.email ||
        authSession?.user?.email ||
        items.find((i) => i.recipientEmail)?.recipientEmail ||
        "pending@buygiftcards.online";

      await prisma.order.create({
        data: {
          orderNumber,
          customerEmail: initialEmail,
          status: "PENDING",
          subtotalCents,
          totalCents: subtotalCents,
          currency: currencyCode.toLowerCase(),
          stripeCheckoutSessionId: sessionKey,
          stripePaymentIntentId: JSON.stringify(
            validatedLines.map((l) => ({
              s: l.item.brandSlug,
              a: l.item.amount,
              q: l.item.qty,
              d: l.item.deliveryType,
              p: l.customPhotoUrl,
              re: l.item.recipientEmail,
              rn: l.item.recipientName,
              sn: l.item.senderName,
              gm: l.item.giftMessage,
              oc: l.item.occasion,
            }))
          ),
          userId: authSession?.user?.id ?? undefined,
          items: {
            create: validatedLines.map((l) => ({
              brandSlug: l.item.brandSlug,
              brandName: l.brandName,
              denomCents: l.denomCents,
              quantity: l.item.qty,
              deliveryType: l.item.deliveryType === "egift" ? "EGIFT" : "PHYSICAL",
              customPhotoUrl: l.customPhotoUrl,
            })),
          },
        },
      });

      writeTransactionLog({
        phase: "PROCESS_COMPLETE",
        process: "PayPal.CreateCheckoutOrder",
        transactionId: paypalOrder.id,
        orderNumber,
        method: "POST",
        apiUrl,
        statusCode: 200,
        responseBody: {
          paypalOrderId: paypalOrder.id,
          orderNumber,
          approveUrl: paypalOrder.approveUrl,
        },
      });

      return NextResponse.json({
        paypalOrderId: paypalOrder.id,
        orderNumber,
        url: paypalOrder.approveUrl,
        approveUrl: paypalOrder.approveUrl,
      });
    }

    // 2. CAPTURE PAYPAL ORDER & FULFILL GIFT CARDS
    const { paypalOrderId } = parsed.data;
    const result = await fulfillPayPalOrderById(paypalOrderId, activeCountry);

    // Asynchronously dispatch affiliate network conversion (CJ / Awin / Impact)
    // for cashback attribution (e.g. TopCashback) without delaying user response.
    try {
      const affiliateData = await getStoredAffiliateData();
      if (affiliateData && result.subtotalCents) {
        sendAffiliateConversionPostback({
          orderNumber: result.orderNumber,
          subtotalCents: result.subtotalCents,
          currency: result.currency || currencyCode,
          customerEmail: result.customerEmail,
          affiliateData,
        }).catch((err) => console.error("[Affiliate Postback Background Error]", err));
      }
    } catch (e) {
      console.warn("[Affiliate Data Read Warn]", e);
    }

    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: "PayPal.CaptureAndFulfill",
      transactionId: paypalOrderId,
      orderNumber: result.orderNumber,
      method: "POST",
      apiUrl,
      statusCode: 200,
      responseBody: { order: result },
    });

    return NextResponse.json({ order: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal checkout failed";
    console.error("[/api/checkout/paypal]", err);
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: "PayPal.Checkout",
      method: "POST",
      apiUrl,
      statusCode: 500,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
