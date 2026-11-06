import { loggedFetch, writeTransactionLog } from "./logger";

export const PRODUCTION_PAYPAL_API_BASE_URL = "https://api-m.paypal.com";
export const SANDBOX_PAYPAL_API_BASE_URL = "https://api-m.sandbox.paypal.com";
export const DEFAULT_PAYPAL_CLIENT_ID =
  "BAAvF_aLV7jrJ7SZG0qB5WSUEoJH8GqF88uriChuLdsgV6-XWKmbVZnexjrv8-d7VM8K_QwTIqeQqo6ZOg";
export const DEFAULT_PAYPAL_CLIENT_SECRET =
  "EP_l4rG98V--xxBunuX3F40UyCD9KsQP8QUY34snUH6XrJynonRROoNeA7ONF5whwyuRfXLVrgcgIlfT";

export function getPayPalCredentials() {
  const clientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    process.env.PAYPAL_CLIENT_ID ||
    DEFAULT_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || DEFAULT_PAYPAL_CLIENT_SECRET;
  const configuredBaseUrl = process.env.PAYPAL_API_BASE_URL || PRODUCTION_PAYPAL_API_BASE_URL;
  return { clientId, clientSecret, configuredBaseUrl };
}

/**
 * Obtains a PayPal OAuth2 Bearer access token from exactly ONE environment — the configured
 * PAYPAL_API_BASE_URL (sandbox by default). There is deliberately no cross-environment fallback:
 * a sandbox misconfiguration must never silently charge on live, or vice versa.
 */
export async function getPayPalAccessToken(): Promise<{ accessToken: string; baseUrl: string }> {
  const { clientId, clientSecret, configuredBaseUrl } = getPayPalCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const candidateUrls = [configuredBaseUrl.replace(/\/+$/, "")];

  const tried = new Set<string>();
  let lastError = "PayPal authentication failed";

  for (const baseUrl of candidateUrls) {
    if (tried.has(baseUrl)) continue;
    tried.add(baseUrl);

    const tokenUrl = `${baseUrl}/v1/oauth2/token`;
    writeTransactionLog({
      phase: "BEFORE_API_HIT",
      process: "PayPal.OAuthToken",
      method: "POST",
      apiUrl: tokenUrl,
      requestHeaders: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      requestPayload: { grant_type: "client_credentials" },
    });

    const start = Date.now();
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const durationMs = Date.now() - start;
    const data = await res.json().catch(() => ({}));

    writeTransactionLog({
      phase: "AFTER_API_HIT",
      process: "PayPal.OAuthToken",
      method: "POST",
      apiUrl: tokenUrl,
      statusCode: res.status,
      durationMs,
      responseBody: res.ok
        ? { token_type: data.token_type, app_id: data.app_id, expires_in: data.expires_in }
        : data,
    });

    if (res.ok && data.access_token) {
      return { accessToken: data.access_token as string, baseUrl };
    }
    lastError = data.error_description || data.error || `HTTP ${res.status}`;
  }

  throw new Error(`PayPal OAuth failed: ${lastError}`);
}

export async function createPayPalOrder(opts: {
  items: Array<{
    name: string;
    description?: string;
    unitAmountCents: number;
    quantity: number;
    sku: string;
  }>;
  totalCents: number;
  returnUrl: string;
  cancelUrl: string;
  customId?: string;
}): Promise<{ id: string; status: string; approveUrl?: string }> {
  const { accessToken, baseUrl } = await getPayPalAccessToken();
  const totalStr = (opts.totalCents / 100).toFixed(2);

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        custom_id: opts.customId,
        description: "buygiftcards.online Digital Gift Cards",
        amount: {
          currency_code: "USD",
          value: totalStr,
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: totalStr,
            },
          },
        },
        items: opts.items.map((item) => ({
          name: item.name.slice(0, 120),
          description: (item.description || "Digital Gift Card").slice(0, 120),
          sku: item.sku.slice(0, 60),
          unit_amount: {
            currency_code: "USD",
            value: (item.unitAmountCents / 100).toFixed(2),
          },
          quantity: String(item.quantity),
          category: "DIGITAL_GOODS",
        })),
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: "BuyGiftCards.online",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          landing_page: "LOGIN",
          return_url: opts.returnUrl,
          cancel_url: opts.cancelUrl,
        },
      },
    },
  };

  const { res, data, rawText } = await loggedFetch({
    process: "PayPal.CreateOrder",
    url: `${baseUrl}/v2/checkout/orders`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    bodyObj: payload,
  });

  if (!res.ok) {
    throw new Error(`PayPal createOrder failed (${res.status}): ${rawText}`);
  }

  const links: Array<{ href: string; rel: string }> = Array.isArray(data.links) ? data.links : [];
  const approveLink =
    links.find((l) => l.rel === "payer-action")?.href ||
    links.find((l) => l.rel === "approve")?.href;

  return {
    id: data.id,
    status: data.status,
    approveUrl: approveLink,
  };
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<{
  id: string;
  status: string;
  captureId?: string;
  payerEmail?: string;
  payerName?: string;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}> {
  const { accessToken, baseUrl } = await getPayPalAccessToken();

  const { res, data, rawText } = await loggedFetch({
    process: "PayPal.CaptureOrder",
    transactionId: paypalOrderId,
    url: `${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    bodyObj: {},
  });

  // If the order was already captured, fetch order details
  let orderData = data;
  if (!res.ok) {
    const getOrder = await loggedFetch({
      process: "PayPal.GetOrderDetails",
      transactionId: paypalOrderId,
      url: `${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (getOrder.res.ok && getOrder.data?.status === "COMPLETED") {
      orderData = getOrder.data;
    } else {
      throw new Error(`PayPal captureOrder failed (${res.status}): ${rawText}`);
    }
  }

  const payer = orderData.payer || {};
  const payerEmail = payer.email_address;
  const givenName = payer.name?.given_name || "";
  const surname = payer.name?.surname || "";
  const payerName = `${givenName} ${surname}`.trim() || undefined;
  const addr = payer.address || orderData.purchase_units?.[0]?.shipping?.address;
  const captureId = orderData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

  return {
    id: orderData.id || paypalOrderId,
    status: orderData.status,
    captureId,
    payerEmail,
    payerName,
    billingAddress: addr
      ? {
          line1: addr.address_line_1,
          line2: addr.address_line_2,
          city: addr.admin_area_2,
          state: addr.admin_area_1,
          postalCode: addr.postal_code,
          country: addr.country_code,
        }
      : undefined,
  };
}

export async function fulfillPayPalOrderById(paypalOrderId: string): Promise<{
  orderNumber: string;
  customerEmail: string;
  status: string;
  hasExistingAccount?: boolean;
}> {
  const { prisma } = await import("./prisma");
  const { giftCardProvider } = await import("./giftcard-provider");
  const { sendOrderConfirmationEmail, sendRecipientGiftEmail } = await import("./email");

  const sessionKey = `paypal_${paypalOrderId}`;

  const existing = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: sessionKey },
    include: { items: { include: { codes: true } } },
  });

  if (existing && existing.status === "FULFILLED" && existing.items.some((i) => i.codes.length > 0)) {
    const existingAccount = await prisma.user.findUnique({
      where: { email: existing.customerEmail.trim().toLowerCase() },
      select: { id: true },
    });
    return {
      orderNumber: existing.orderNumber,
      customerEmail: existing.customerEmail,
      status: existing.status,
      hasExistingAccount: Boolean(existingAccount),
    };
  }

  // Capture via PayPal Orders V2 API
  const captured = await capturePayPalOrder(paypalOrderId);
  if (captured.status !== "COMPLETED") {
    throw new Error(`PayPal payment status is ${captured.status} (expected COMPLETED)`);
  }

  let order = existing;
  if (!order) {
    throw new Error(`No order record found for PayPal order ${paypalOrderId}`);
  }

  const finalEmail =
    (order.customerEmail && order.customerEmail !== "pending@buygiftcards.online"
      ? order.customerEmail
      : captured.payerEmail) ||
    captured.payerEmail ||
    "support@buygiftcards.online";

  const matchedUser = await prisma.user.findUnique({
    where: { email: finalEmail.trim().toLowerCase() },
    select: { id: true },
  });

  let cartMeta: Array<{
    s: string;
    a: number;
    q: number;
    d: string;
    re?: string;
    rn?: string;
    sn?: string;
    gm?: string;
    oc?: string;
  }> = [];
  if (order.stripePaymentIntentId && order.stripePaymentIntentId.startsWith("[")) {
    try {
      cartMeta = JSON.parse(order.stripePaymentIntentId);
    } catch {
      cartMeta = [];
    }
  }

  order = await prisma.order.update({
    where: { id: order.id },
    data: {
      customerEmail: finalEmail,
      userId: order.userId ?? matchedUser?.id ?? undefined,
      status: "PAID",
      stripePaymentIntentId: captured.captureId ? `paypal_cap_${captured.captureId}` : `paypal_${paypalOrderId}`,
      billingLine1: captured.billingAddress?.line1 ?? order.billingLine1,
      billingLine2: captured.billingAddress?.line2 ?? order.billingLine2,
      billingCity: captured.billingAddress?.city ?? order.billingCity,
      billingState: captured.billingAddress?.state ?? order.billingState,
      billingPostalCode: captured.billingAddress?.postalCode ?? order.billingPostalCode,
      billingCountry: captured.billingAddress?.country ?? order.billingCountry,
    },
    include: { items: { include: { codes: true } } },
  });

  for (let idx = 0; idx < order.items.length; idx++) {
    const item = order.items[idx];
    if (item.codes.length >= item.quantity) continue;

    const meta = cartMeta[idx];
    const issuedCodes: string[] = [];
    const needed = item.quantity - item.codes.length;

    for (let i = 0; i < needed; i++) {
      writeTransactionLog({
        phase: "PROCESS_STEP",
        process: "PayPal.Fulfill.IssueGiftCard",
        transactionId: paypalOrderId,
        orderNumber: order.orderNumber,
        details: {
          brandSlug: item.brandSlug,
          brandName: item.brandName,
          amountCents: item.denomCents,
          unitIndex: i + 1,
          quantity: needed,
          zenditApiBaseUrl: "https://api.zendit.io/v1",
        },
      });

      const issued = await giftCardProvider.issue({
        brandSlug: item.brandSlug,
        amountCents: item.denomCents,
        deliveryType: item.deliveryType === "EGIFT" ? "egift" : "physical",
        recipientEmail: meta?.re || finalEmail,
        recipientName: meta?.rn || captured.payerName,
        senderName: meta?.sn || captured.payerName || finalEmail,
      });

      writeTransactionLog({
        phase: "PROCESS_COMPLETE",
        process: "PayPal.Fulfill.ZenditVoucherIssued",
        transactionId: paypalOrderId,
        orderNumber: order.orderNumber,
        details: {
          brandSlug: item.brandSlug,
          amountCents: item.denomCents,
          zenditTransactionId: issued.zenditTransactionId,
          zenditOfferId: issued.zenditOfferId,
          issuedCode: issued.code,
        },
      });

      await prisma.giftCardCode.create({
        data: {
          orderItemId: item.id,
          code: issued.code,
          pin: issued.pin,
          isDemo: issued.isDemo,
        },
      });
      issuedCodes.push(issued.code);
    }

    if (meta?.re && meta.re.toLowerCase() !== finalEmail.toLowerCase()) {
      await sendRecipientGiftEmail({
        recipientEmail: meta.re,
        recipientName: meta.rn,
        senderName: meta.sn || captured.payerName || finalEmail,
        giftMessage: meta.gm,
        occasion: meta.oc,
        brandName: item.brandName,
        amountDollars: Math.round(item.denomCents / 100),
        codes: issuedCodes,
        orderNumber: order.orderNumber,
        buyerEmail: finalEmail,
      }).catch((err) => console.warn(`[paypal] Recipient gift email failed for ${meta.re}:`, err));
    }
  }

  const fulfilledOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: "FULFILLED" },
    include: { items: { include: { codes: true } } },
  });

  try {
    const emailRes = await sendOrderConfirmationEmail(fulfilledOrder);
    await prisma.order.update({
      where: { id: order.id },
      data: emailRes.sent
        ? { emailSentAt: new Date(), emailError: null }
        : { emailError: emailRes.error },
    });
  } catch (err) {
    console.error(`[paypal] Confirmation email error for ${order.orderNumber}:`, err);
    await prisma.order.update({
      where: { id: order.id },
      data: { emailError: err instanceof Error ? err.message : String(err) },
    });
  }

  return {
    orderNumber: fulfilledOrder.orderNumber,
    customerEmail: fulfilledOrder.customerEmail,
    status: "FULFILLED",
    hasExistingAccount: Boolean(matchedUser),
  };
}

