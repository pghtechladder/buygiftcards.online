import { cookies } from "next/headers";

/**
 * Standard click tracking query parameters used by major affiliate networks
 * connected to TopCashback (CJ Affiliate, Awin, Impact, Rakuten, ShareASale, Refersion).
 */
export const AFFILIATE_PARAM_MAP = {
  // CJ Affiliate (Commission Junction) - Primary network for TopCashback
  cjevent: "aff_cjevent",
  // Awin
  awc: "aff_awc",
  // Impact Radius
  irclickid: "aff_irclickid",
  // Rakuten Advertising
  ranMID: "aff_ranMID",
  ranSiteID: "aff_ranSiteID",
  // ShareASale
  sscid: "aff_sscid",
  // Generic / Custom partner affiliate click ID
  click_id: "aff_click_id",
  aff_sub: "aff_sub",
} as const;

export type AffiliateParams = {
  cjevent?: string;
  awc?: string;
  irclickid?: string;
  ranMID?: string;
  ranSiteID?: string;
  sscid?: string;
  clickId?: string;
  source?: string;
};

/**
 * Extract affiliate click parameters from the incoming URL search params.
 */
export function extractAffiliateParams(searchParams: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [queryKey, cookieName] of Object.entries(AFFILIATE_PARAM_MAP)) {
    const val = searchParams.get(queryKey)?.trim();
    if (val) {
      result[cookieName] = val;
    }
  }
  return result;
}

/**
 * Retrieve stored affiliate tracking data from request cookies (server side).
 */
export async function getStoredAffiliateData(): Promise<AffiliateParams | null> {
  const cookieStore = await cookies();
  const cjevent = cookieStore.get("aff_cjevent")?.value;
  const awc = cookieStore.get("aff_awc")?.value;
  const irclickid = cookieStore.get("aff_irclickid")?.value;
  const ranMID = cookieStore.get("aff_ranMID")?.value;
  const ranSiteID = cookieStore.get("aff_ranSiteID")?.value;
  const sscid = cookieStore.get("aff_sscid")?.value;
  const clickId = cookieStore.get("aff_click_id")?.value || cookieStore.get("aff_sub")?.value;

  if (!cjevent && !awc && !irclickid && !ranMID && !sscid && !clickId) {
    return null;
  }

  return {
    cjevent,
    awc,
    irclickid,
    ranMID,
    ranSiteID,
    sscid,
    clickId,
    source: cjevent ? "cj" : awc ? "awin" : irclickid ? "impact" : ranMID ? "rakuten" : sscid ? "shareasale" : "custom",
  };
}

/**
 * Trigger server-to-server affiliate conversion postback when configured.
 * Safely executes in background without blocking customer checkout flow.
 */
export async function sendAffiliateConversionPostback(params: {
  orderNumber: string;
  subtotalCents: number;
  currency: string;
  customerEmail?: string;
  affiliateData?: AffiliateParams | null;
}): Promise<void> {
  const aff = params.affiliateData;
  if (!aff) return;

  const amountDollars = (params.subtotalCents / 100).toFixed(2);

  // 1. CJ Affiliate S2S Conversions API
  // https://developers.cj.com/graphql/reference/Commission-Service
  const cjEnterpriseId = process.env.CJ_ENTERPRISE_ID;
  const cjActionTrackerId = process.env.CJ_ACTION_TRACKER_ID;
  const cjBearerToken = process.env.CJ_BEARER_TOKEN;

  if (aff.cjevent && cjEnterpriseId && cjActionTrackerId && cjBearerToken) {
    try {
      await fetch("https://commissions.api.cj.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cjBearerToken}`,
        },
        body: JSON.stringify({
          query: `mutation CreateCommission($input: CommissionInput!) {
            createCommission(commission: $input) {
              orderId
              actionTrackerId
            }
          }`,
          variables: {
            input: {
              actionTrackerId: cjActionTrackerId,
              orderId: params.orderNumber,
              cjevent: aff.cjevent,
              amount: amountDollars,
              currency: params.currency.toUpperCase(),
              eventDate: new Date().toISOString(),
            },
          },
        }),
      });
      console.log(`[Affiliate] Dispatched CJ conversion for order ${params.orderNumber} (cjevent: ${aff.cjevent})`);
    } catch (err) {
      console.error("[Affiliate] Failed to postback to CJ:", err);
    }
  }

  // 2. Awin Server-to-Server Tracking
  // https://wiki.awin.com/index.php/Server-to-Server_Tracking
  const awinMerchantId = process.env.AWIN_MERCHANT_ID;
  if (aff.awc && awinMerchantId) {
    try {
      const awinUrl = new URL("https://www.awin1.com/sread.php");
      awinUrl.searchParams.set("tt", "ss");
      awinUrl.searchParams.set("tv", "2");
      awinUrl.searchParams.set("merchant", awinMerchantId);
      awinUrl.searchParams.set("amount", amountDollars);
      awinUrl.searchParams.set("cr", params.currency.toUpperCase());
      awinUrl.searchParams.set("ref", params.orderNumber);
      awinUrl.searchParams.set("cks", aff.awc);
      await fetch(awinUrl.toString(), { method: "GET" });
      console.log(`[Affiliate] Dispatched Awin conversion for order ${params.orderNumber} (awc: ${aff.awc})`);
    } catch (err) {
      console.error("[Affiliate] Failed to postback to Awin:", err);
    }
  }

  // 3. Impact S2S Postback
  const impactAccountSid = process.env.IMPACT_ACCOUNT_SID;
  const impactAuthToken = process.env.IMPACT_AUTH_TOKEN;
  const impactCampaignId = process.env.IMPACT_CAMPAIGN_ID;
  if (aff.irclickid && impactAccountSid && impactAuthToken && impactCampaignId) {
    try {
      const impactUrl = `https://api.impact.com/Mediapartners/${impactAccountSid}/Campaigns/${impactCampaignId}/Action`;
      const authHeader = `Basic ${Buffer.from(`${impactAccountSid}:${impactAuthToken}`).toString("base64")}`;
      await fetch(impactUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: authHeader,
        },
        body: new URLSearchParams({
          ClickId: aff.irclickid,
          OrderId: params.orderNumber,
          Amount: amountDollars,
          Currency: params.currency.toUpperCase(),
        }).toString(),
      });
      console.log(`[Affiliate] Dispatched Impact conversion for order ${params.orderNumber} (irclickid: ${aff.irclickid})`);
    } catch (err) {
      console.error("[Affiliate] Failed to postback to Impact:", err);
    }
  }
}

