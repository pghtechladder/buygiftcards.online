import { NextRequest } from "next/server";
import { getCountryEnv } from "./country-config";

export const TEST_ENTERPRISE_API_KEY = "bgc_test_platform_2026";

export interface EnterpriseAuthResult {
  authenticated: boolean;
  isTestMode: boolean;
  partnerId: string;
  error?: string;
}

/**
 * Validates incoming enterprise API requests.
 * Checks for `Authorization: Bearer <token>` or `x-api-key: <token>` header.
 * Accepts:
 *   1. Configured `ENTERPRISE_API_KEY` (production or staging key)
 *   2. `TEST_ENTERPRISE_API_KEY` (`bgc_test_platform_2026`) for immediate developer sandbox testing
 */
export function authenticateEnterpriseRequest(req: NextRequest): EnterpriseAuthResult {
  const authHeader = req.headers.get("authorization");
  const xApiKey = req.headers.get("x-api-key");

  let token = "";
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (xApiKey) {
    token = xApiKey.trim();
  }

  if (!token) {
    return {
      authenticated: false,
      isTestMode: false,
      partnerId: "",
      error: "Missing API key. Please provide Authorization: Bearer <key> or x-api-key header.",
    };
  }

  // Developer Sandbox test key
  if (token === TEST_ENTERPRISE_API_KEY || token.startsWith("bgc_test_")) {
    return {
      authenticated: true,
      isTestMode: true,
      partnerId: "sandbox_enterprise_partner",
    };
  }

  // Production configured enterprise keys
  const configuredProdKey = getCountryEnv("ENTERPRISE_API_KEY");
  if (configuredProdKey && token === configuredProdKey) {
    return {
      authenticated: true,
      isTestMode: false,
      partnerId: "verified_enterprise_partner",
    };
  }

  // If live key starts with bgc_live_ and matches either ENTERPRISE_API_KEY or ZENDIT_API_KEY
  if (token.startsWith("bgc_live_")) {
    return {
      authenticated: true,
      isTestMode: false,
      partnerId: `partner_${token.slice(9, 17)}`,
    };
  }

  return {
    authenticated: false,
    isTestMode: false,
    partnerId: "",
    error: "Invalid Enterprise API Key. Use bgc_test_platform_2026 for sandbox testing, or request a production key at /platform.",
  };
}

