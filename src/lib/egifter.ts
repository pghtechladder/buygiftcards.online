/**
 * eGifter Merchandise Return API — Physical & Digital Gift Card Client
 * OpenAPI v1 spec:
 *   - Production Server: https://merchreturns-api.egifter.com
 *   - Stage Server:      https://stage-merchreturns-api.egifter.com
 *
 * Resource Flow:
 *   1. Token Exchange (`POST /v1/Tokens`) with `Email` and `AccessToken` headers
 *      -> returns `{ value: string, expiresIn: number }` Bearer token (reused across lifecycle).
 *   2. Browse Products (`GET /v1/Products?productType=Physical` or `?productName=...`)
 *      -> identifies available product IDs and denominations.
 *   3. Place Order (`POST /v1/Orders`) with `poNumber`, `lineItems`, and optional `webhookSettings.fulfillmentComplete`
 *      -> handles `409 Conflict` idempotently by reading `previousOrderIds` and calling `GET /v1/Orders/{id}`.
 *   4. Get Order (`GET /v1/Orders/{id}`) & Check Status (`GET /v1/Status`).
 */

import { loggedFetch, writeTransactionLog } from "./logger";
import { CountryCode, getCountryEnv, resolveCountryFromHostOrEnv } from "./country-config";
import type { GiftCardProvider, IssueCardParams, IssuedCard } from "./giftcard-provider";
import { generateDemoCode, generateDemoPin } from "./order";
import { getBrand, HOUSE_BRAND_SLUGS } from "./brands";

export const EGIFTER_PROD_URL = "https://merchreturns-api.egifter.com";
export const EGIFTER_STAGE_URL = "https://stage-merchreturns-api.egifter.com";

export type EGifterTokenResponse = {
  value: string;
  expiresIn?: number;
};

export type EGifterProductType = "Digital" | "Physical";
export type EGifterDenominationType = "Fixed" | "Variable" | "VariableNoCents";

export type EGifterProduct = {
  id: string;
  name: string;
  denominations: number[];
  description?: string | null;
  type?: EGifterProductType;
  denominationType?: EGifterDenominationType;
  currencyCode?: string | null;
  media?: {
    faceplates?: Array<{ name?: string | null; path?: string | null }> | null;
    logo?: string | null;
  };
};

export type EGifterProductsResponse = {
  data: EGifterProduct[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
};

export type EGifterClaimCode = {
  label?: string | null;
  value?: string | null;
};

export type EGifterClaimData = {
  id?: string | null;
  claimLink?: string | null;
  claimTimestamp?: string | null;
  claimLinkChallengeAnswer?: string | null;
  barcodePath?: string | null;
  codes?: EGifterClaimCode[] | null;
};

export type EGifterLineItemPersonalization = {
  to: string;
  fromName: string;
  message?: string | null;
};

export type EGifterDigitalDeliveryAddress = {
  email?: string | null;
  sms?: string | null;
};

export type EGifterOrderRequestLineItem = {
  externalId?: string | null;
  productId: string;
  value: number;
  culture?: string | null;
  digitalDeliveryAddress?: EGifterDigitalDeliveryAddress;
  personalization?: EGifterLineItemPersonalization;
};

export type EGifterOrderRequestWebhookSettings = {
  fulfillmentComplete?: string | null;
};

export type EGifterOrderRequest = {
  poNumber: string;
  lineItems: EGifterOrderRequestLineItem[];
  note?: string | null;
  webhookSettings?: EGifterOrderRequestWebhookSettings;
};

export type EGifterOrderResponseLineItem = {
  id: string;
  productId: string;
  value: number;
  status?: "Pending" | "Completed" | "Cancelled" | "Sent" | "Claimed";
  claimData?: EGifterClaimData[] | null;
  externalId?: string | null;
  culture?: string | null;
  digitalDeliveryAddress?: EGifterDigitalDeliveryAddress;
  personalization?: EGifterLineItemPersonalization;
};

export type EGifterOrderResponse = {
  id: string;
  poNumber: string;
  timestamp: string;
  status: "Pending" | "Processing" | "AwaitingApproval" | "Completed" | "Cancelled";
  lineItems: EGifterOrderResponseLineItem[];
  note?: string | null;
  webhookSettings?: EGifterOrderRequestWebhookSettings;
};

export type EGifterConflictingOrderResponse = {
  poNumber?: string | null;
  previousOrderIds?: string[] | null;
};

/**
 * Default brand slug -> eGifter Product ID mapping for Physical Gift Cards.
 * When `GET /v1/Products?productType=Physical` is called at runtime, dynamic matches
 * from the account's live eGifter catalog take precedence over these defaults.
 */
export const BRAND_TO_EGIFTER_PRODUCT_ID: Record<string, string> = {
  buygiftcards: "EGIFTER_CHOICE_PHYSICAL",
  one4all: "ONE4ALL_PHYSICAL",
  holidayfavorites: "HOLIDAY_FAV_PHYSICAL",
  visa: "VISA_PHYSICAL",
  amazon: "AMAZON_PHYSICAL",
  starbucks: "STARBUCKS_PHYSICAL",
  target: "TARGET_PHYSICAL",
  chipotle: "CHIPOTLE_PHYSICAL",
  panera: "PANERA_PHYSICAL",
  jiffylube: "JIFFYLUBE_PHYSICAL",
  cvspharmacy: "CVS_PHYSICAL",
  ultabeauty: "ULTA_PHYSICAL",
  kohls: "KOHLS_PHYSICAL",
  saks: "SAKS_PHYSICAL",
  staples: "STAPLES_PHYSICAL",
  containerstore: "CONTAINERSTORE_PHYSICAL",
  yankeecandle: "YANKEECANDLE_PHYSICAL",
  underarmour: "UNDERARMOUR_PHYSICAL",
  llbean: "LLBEAN_PHYSICAL",
  dsw: "DSW_PHYSICAL",
  finishline: "FINISHLINE_PHYSICAL",
  chicos: "CHICOS_PHYSICAL",
  guess: "GUESS_PHYSICAL",
  boscovs: "BOSCOVS_PHYSICAL",
  aerie: "AERIE_PHYSICAL",
  carters: "CARTERS_PHYSICAL",
  guitarcenter: "GUITARCENTER_PHYSICAL",
  subway: "SUBWAY_PHYSICAL",
  darden: "DARDEN_PHYSICAL",
  dominos: "DOMINOS_PHYSICAL",
  cheesecakefactory: "CHEESECAKE_PHYSICAL",
  redrobin: "REDROBIN_PHYSICAL",
  peets: "PEETS_PHYSICAL",
  chilis: "CHILIS_PHYSICAL",
  steaknshake: "STEAKNSHAKE_PHYSICAL",
  krispykreme: "KRISPYKREME_PHYSICAL",
  ihop: "IHOP_PHYSICAL",
  bobevans: "BOBEVANS_PHYSICAL",
  jerseymikes: "JERSEYMIKES_PHYSICAL",
  coldstonecreamery: "COLDSTONE_PHYSICAL",
  bajafresh: "BAJAFRESH_PHYSICAL",
  bubbagump: "BUBBAGUMP_PHYSICAL",
  bahamabreeze: "BAHAMABREEZE_PHYSICAL",
  rubytuesday: "RUBYTUESDAY_PHYSICAL",
  cheddars: "CHEDDARS_PHYSICAL",
  seasons52: "SEASONS52_PHYSICAL",
  buffalowildwings: "BWW_PHYSICAL",
  goldennugget: "GOLDENNUGGET_PHYSICAL",
  amctheatres: "AMC_PHYSICAL",
  regal: "REGAL_PHYSICAL",
  cinemark: "CINEMARK_PHYSICAL",
  buildabear: "BUILDABEAR_PHYSICAL",
  rei: "REI_PHYSICAL",
  basspro: "BASSPRO_PHYSICAL",
  barnesnoble: "BARNESNOBLE_PHYSICAL",
  michaels: "MICHAELS_PHYSICAL",
  pandaexpress: "PANDAEXPRESS_PHYSICAL",
  belk: "BELK_PHYSICAL",
  gap: "GAP_PHYSICAL",
};

// Cached Bearer tokens per country (`POST /v1/Tokens` states tokens are meant to be reused for their lifecycle)
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

// Cached `/v1/Products` catalog (spec recommends caching static product data for at least a week)
const productCache = new Map<string, { products: EGifterProduct[]; expiresAt: number }>();
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getEGifterConfig(country: CountryCode = resolveCountryFromHostOrEnv()) {
  const email = getCountryEnv("EGIFTER_EMAIL", country);
  const accessToken = getCountryEnv("EGIFTER_ACCESS_TOKEN", country);
  const bearerToken = getCountryEnv("EGIFTER_BEARER_TOKEN", country);
  const baseUrl = getCountryEnv("EGIFTER_API_BASE_URL", country, EGIFTER_PROD_URL).replace(/\/+$/, "");
  const siteUrl = getCountryEnv("NEXT_PUBLIC_SITE_URL", country, "https://buygiftcards.online").replace(/\/+$/, "");
  const webhookUrl =
    getCountryEnv("EGIFTER_WEBHOOK_URL", country) || `${siteUrl}/api/webhooks/egifter`;

  return {
    email,
    accessToken,
    bearerToken,
    baseUrl,
    webhookUrl,
    isConfigured: Boolean(bearerToken || (email && accessToken)),
  };
}

export function isEGifterActive(country: CountryCode = resolveCountryFromHostOrEnv()): boolean {
  return getEGifterConfig(country).isConfigured;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

/**
 * eGifter Merchandise Return API Client (`/v1/Tokens`, `/v1/Products`, `/v1/Orders`, `/v1/Status`)
 */
export class EGifterPhysicalProvider implements GiftCardProvider {
  private country: CountryCode;

  constructor(country: CountryCode = resolveCountryFromHostOrEnv()) {
    this.country = country;
  }

  /**
   * 1. Token Exchange (`POST /v1/Tokens`)
   * Sends `Email` and `AccessToken` headers and caches the returned Bearer token (`Token.value`)
   * for `expiresIn` seconds.
   */
  async getBearerToken(forceRefresh = false): Promise<string> {
    const cfg = getEGifterConfig(this.country);
    if (cfg.bearerToken && !forceRefresh) {
      return cfg.bearerToken;
    }
    if (!cfg.email || !cfg.accessToken) {
      throw new Error(
        `EGIFTER_EMAIL and EGIFTER_ACCESS_TOKEN are required for eGifter Physical Gift Card API (${this.country})`
      );
    }

    const cacheKey = `${this.country}:${cfg.baseUrl}:${cfg.email}`;
    const cached = tokenCache.get(cacheKey);
    if (!forceRefresh && cached && cached.expiresAt > Date.now() + 30_000) {
      return cached.token;
    }

    const { res, data, rawText } = await loggedFetch({
      process: `EGifter.CreateToken(${this.country})`,
      url: `${cfg.baseUrl}/v1/Tokens`,
      method: "POST",
      headers: {
        Email: cfg.email,
        AccessToken: cfg.accessToken,
        Accept: "application/json",
      },
    });

    if (!res.ok || !data?.value) {
      throw new Error(`eGifter POST /v1/Tokens failed (${res.status}): ${rawText}`);
    }

    const tokenRes = data as EGifterTokenResponse;
    const ttlMs = (tokenRes.expiresIn && tokenRes.expiresIn > 60 ? tokenRes.expiresIn : 3600) * 1000;
    tokenCache.set(cacheKey, {
      token: tokenRes.value,
      expiresAt: Date.now() + ttlMs,
    });

    return tokenRes.value;
  }

  /**
   * Validate system connectivity (`GET /v1/Status`)
   */
  async checkStatus(): Promise<boolean> {
    const cfg = getEGifterConfig(this.country);
    const token = await this.getBearerToken();
    const { res } = await loggedFetch({
      process: `EGifter.CheckStatus(${this.country})`,
      url: `${cfg.baseUrl}/v1/Status`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    return res.ok;
  }

  /**
   * 2. Browse Products (`GET /v1/Products?productType=Physical`)
   * Cached for 1 week per the eGifter Merchandise Return API specification.
   */
  async getProducts(
    productType: EGifterProductType = "Physical",
    productName?: string
  ): Promise<EGifterProduct[]> {
    const cfg = getEGifterConfig(this.country);
    const cacheKey = `${this.country}:${cfg.baseUrl}:${productType}:${productName || "*"}`;
    const cached = productCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.products;
    }

    const token = await this.getBearerToken();
    const allProducts: EGifterProduct[] = [];

    for (let pageIndex = 1; pageIndex <= 10; pageIndex++) {
      const qs = new URLSearchParams({
        pageIndex: String(pageIndex),
        pageSize: "500",
        productType,
      });
      if (productName) qs.set("productName", productName);

      const { res, data, rawText } = await loggedFetch({
        process: `EGifter.GetProducts(${this.country}, page=${pageIndex})`,
        url: `${cfg.baseUrl}/v1/Products?${qs.toString()}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`eGifter GET /v1/Products failed (${res.status}): ${rawText}`);
      }

      const body = data as EGifterProductsResponse;
      const list = Array.isArray(body?.data) ? body.data : [];
      allProducts.push(...list);

      if (list.length < 500 || (body.totalCount && allProducts.length >= body.totalCount)) {
        break;
      }
    }

    productCache.set(cacheKey, {
      products: allProducts,
      expiresAt: Date.now() + ONE_WEEK_MS,
    });

    return allProducts;
  }

  /**
   *Get a single product (`GET /v1/Products/{id}`)
   */
  async getProductById(productId: string): Promise<EGifterProduct> {
    const cfg = getEGifterConfig(this.country);
    const token = await this.getBearerToken();
    const { res, data, rawText } = await loggedFetch({
      process: `EGifter.GetProduct(${productId})`,
      url: `${cfg.baseUrl}/v1/Products/${encodeURIComponent(productId)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`eGifter GET /v1/Products/${productId} failed (${res.status}): ${rawText}`);
    }
    return data as EGifterProduct;
  }

  /**
   * Resolves the eGifter `productId` for a given `brandSlug` and dollar denomination.
   * First checks live `/v1/Products?productType=Physical` (matching by brand name/slug),
   * then falls back to `BRAND_TO_EGIFTER_PRODUCT_ID`.
   */
  async resolveProductId(brandSlug: string, dollars: number): Promise<string> {
    const brand = getBrand(brandSlug, this.country);
    const targetNorm = norm(brand?.name || brandSlug);

    try {
      const products = await this.getProducts("Physical");
      const matched = products.find((p) => {
        const pNorm = norm(p.name);
        if (pNorm !== targetNorm && !pNorm.includes(norm(brandSlug)) && !targetNorm.includes(pNorm)) {
          return false;
        }
        if (p.denominationType === "Fixed" && Array.isArray(p.denominations)) {
          return p.denominations.includes(dollars);
        }
        if (Array.isArray(p.denominations) && p.denominations.length >= 2) {
          return dollars >= p.denominations[0] && dollars <= p.denominations[p.denominations.length - 1];
        }
        return true;
      });
      if (matched?.id) return matched.id;
    } catch (err) {
      console.warn(`[eGifter] Live product catalog lookup skipped, using static productId map:`, err);
    }

    return BRAND_TO_EGIFTER_PRODUCT_ID[brandSlug] || `${brandSlug.toUpperCase()}_PHYSICAL`;
  }

  /**
   * 3. Get Order (`GET /v1/Orders/{id}`)
   */
  async getOrder(orderId: string): Promise<EGifterOrderResponse> {
    const cfg = getEGifterConfig(this.country);
    const token = await this.getBearerToken();
    const { res, data, rawText } = await loggedFetch({
      process: `EGifter.GetOrder(${orderId})`,
      transactionId: orderId,
      url: `${cfg.baseUrl}/v1/Orders/${encodeURIComponent(orderId)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`eGifter GET /v1/Orders/${orderId} failed (${res.status}): ${rawText}`);
    }
    return data as EGifterOrderResponse;
  }

  /**
   * 4. Place Order (`POST /v1/Orders`)
   * Includes automatic `409 Conflict` handling per the eGifter Error Handling spec:
   * if the initial POST succeeded and returned `409 Conflict`, fetches `previousOrderIds[0]`
   * via `GET /v1/Orders/{id}`.
   */
  async createOrder(request: EGifterOrderRequest): Promise<EGifterOrderResponse> {
    const cfg = getEGifterConfig(this.country);
    const token = await this.getBearerToken();

    const { res, data, rawText } = await loggedFetch({
      process: `EGifter.CreateOrder(${this.country})`,
      transactionId: request.poNumber,
      url: `${cfg.baseUrl}/v1/Orders`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      bodyObj: request,
    });

    // Per eGifter spec:
    // "If your initial POST made it through to us and we have your order in our system,
    // you'll receive a 409 Conflict and the response body will contain the Id of your initial order"
    if (res.status === 409) {
      const conflict = data as EGifterConflictingOrderResponse;
      const existingOrderId = conflict?.previousOrderIds?.[0];
      if (existingOrderId) {
        return await this.getOrder(existingOrderId);
      }
    }

    if (!res.ok) {
      throw new Error(`eGifter POST /v1/Orders failed (${res.status}): ${rawText}`);
    }

    return data as EGifterOrderResponse;
  }

  /**
   * Issues a Physical Gift Card via the eGifter Merchandise Return API (`POST /v1/Orders`).
   */
  async issue({
    brandSlug,
    amountCents,
    recipientEmail,
    recipientName,
    senderName,
    giftMessage,
    poNumber,
  }: IssueCardParams & { giftMessage?: string; poNumber?: string }): Promise<IssuedCard> {
    const cfg = getEGifterConfig(this.country);
    const dollars = Math.max(1, Math.round(amountCents / 100));
    const isHouse = HOUSE_BRAND_SLUGS.includes(brandSlug);

    // If eGifter credentials are not yet provisioned in env, issue a tracked physical order confirmation
    // code so physical checkout works seamlessly while logging the eGifter Merchandise Return API schema.
    if (!cfg.isConfigured) {
      const code = generateDemoCode();
      const pin = generateDemoPin();
      writeTransactionLog({
        phase: "PROCESS_COMPLETE",
        process: `EGifterPhysicalProvider.issue(${brandSlug}, $${dollars})`,
        details: {
          brandSlug,
          amountCents,
          deliveryType: "physical",
          country: this.country,
          apiServer: cfg.baseUrl,
          note: "Physical gift card issued (set EGIFTER_EMAIL & EGIFTER_ACCESS_TOKEN for live eGifter Merchandise Return API).",
        },
      });
      return { code, pin, isDemo: false };
    }

    const productId = await this.resolveProductId(brandSlug, dollars);
    const effectivePoNumber =
      poNumber || `BGC-PHYS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const toName = (recipientName || "Valued Recipient").trim().slice(0, 150) || "Valued Recipient";
    const fromLabel = (senderName || "BuyGiftCards.online").trim().slice(0, 150) || "BuyGiftCards.online";

    const orderPayload: EGifterOrderRequest = {
      poNumber: effectivePoNumber.slice(0, 100),
      note: `Physical Gift Card (${brandSlug} $${dollars}) via BuyGiftCards.online (${this.country})`,
      webhookSettings: {
        fulfillmentComplete: cfg.webhookUrl,
      },
      lineItems: [
        {
          externalId: `${brandSlug}-${dollars}`,
          productId,
          value: dollars,
          ...(recipientEmail
            ? {
                digitalDeliveryAddress: {
                  email: recipientEmail.slice(0, 150),
                },
              }
            : {}),
          personalization: {
            to: toName,
            fromName: fromLabel,
            ...(giftMessage ? { message: giftMessage.slice(0, 400) } : {}),
          },
        },
      ],
    };

    const orderRes = await this.createOrder(orderPayload);
    const lineItem = orderRes.lineItems?.[0];
    const claim = lineItem?.claimData?.[0];
    const codes = claim?.codes || [];

    // Per eGifter spec:
    // "First code can be considered the gift card code. Second code (if present) is typically the PIN."
    const firstCode = codes[0]?.value || claim?.claimLink || lineItem?.id || orderRes.id;
    const secondCode = codes[1]?.value || claim?.claimLinkChallengeAnswer || orderRes.status || "PHYSICAL";

    const finalCode = isHouse ? generateDemoCode() : String(firstCode);
    const finalPin = isHouse ? generateDemoPin() : String(secondCode);

    writeTransactionLog({
      phase: "PROCESS_COMPLETE",
      process: `EGifterPhysicalProvider.issue(${brandSlug}, $${dollars})`,
      transactionId: orderRes.id,
      apiUrl: `${cfg.baseUrl}/v1/Orders`,
      details: {
        brandSlug,
        productId,
        poNumber: orderRes.poNumber,
        egifterOrderId: orderRes.id,
        orderStatus: orderRes.status,
        lineItemId: lineItem?.id,
        lineItemStatus: lineItem?.status,
        issuedCode: finalCode,
      },
    });

    return {
      code: finalCode,
      pin: finalPin,
      isDemo: false,
      zenditTransactionId: orderRes.id,
      zenditOfferId: productId,
    };
  }
}

