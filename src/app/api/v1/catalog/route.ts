import { NextRequest, NextResponse } from "next/server";
import { getBrandsForCountry } from "@/lib/brands";
import { resolveCountryFromHostOrEnv, getCurrencyCode, CountryCode } from "@/lib/country-config";
import { authenticateEnterpriseRequest } from "@/lib/enterprise-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/catalog
 * Returns the active real-time gift card catalog for enterprise integrations.
 */
export async function GET(req: NextRequest) {
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

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const countryParam = req.nextUrl.searchParams.get("country");
  const country: CountryCode = resolveCountryFromHostOrEnv(host, countryParam);
  const currency = getCurrencyCode(country);

  const rawBrands = getBrandsForCountry(country);
  const catalog = rawBrands.map((b) => ({
    id: b.slug,
    name: b.name,
    category: b.category,
    minAmount: b.min,
    maxAmount: b.max,
    fixedDenominationsOnly: Boolean(b.fixedOnly),
    supportedDenominations: b.denominations,
    deliveryTypes: b.type === "both" ? ["egift", "physical"] : [b.type],
    currency,
    discountPercent: b.discountPercent || 0,
    supportsCustomPhoto: Boolean(b.supportsCustomPhoto),
    badge: b.badge || null,
  }));

  return NextResponse.json({
    status: "success",
    country,
    currency,
    itemCount: catalog.length,
    testMode: auth.isTestMode,
    catalog,
  });
}

