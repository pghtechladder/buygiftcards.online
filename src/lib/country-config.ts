export type CountryCode = "US" | "CA" | "SG" | "UK" | "AU";

export type CountryMarketConfig = {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  subdomain: string;
  siteUrl: string;
  envFile: string;
  defaultProvider: "zendit" | "tango";
};

export const COUNTRY_MARKETS: Record<CountryCode, CountryMarketConfig> = {
  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    subdomain: "",
    siteUrl: "https://buygiftcards.online",
    envFile: ".env.local",
    defaultProvider: "zendit",
  },
  CA: {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    currency: "CAD",
    currencySymbol: "CA$",
    subdomain: "ca",
    siteUrl: "https://ca.buygiftcards.online",
    envFile: ".env-ca",
    defaultProvider: "zendit",
  },
  SG: {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    currency: "SGD",
    currencySymbol: "S$",
    subdomain: "sg",
    siteUrl: "https://sg.buygiftcards.online",
    envFile: ".env-sg",
    defaultProvider: "zendit",
  },
  UK: {
    code: "UK",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    currencySymbol: "£",
    subdomain: "uk",
    siteUrl: "https://uk.buygiftcards.online",
    envFile: ".env-uk",
    defaultProvider: "zendit",
  },
  AU: {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    currency: "AUD",
    currencySymbol: "A$",
    subdomain: "au",
    siteUrl: "https://au.buygiftcards.online",
    envFile: ".env-au",
    defaultProvider: "zendit",
  },
};

export const SUPPORTED_COUNTRIES: CountryMarketConfig[] = Object.values(COUNTRY_MARKETS);

/**
 * Resolves the active CountryCode from:
 *   1. Subdomain (`ca.buygiftcards.online` -> `CA`, `sg.buygiftcards.online` -> `SG`, etc.)
 *   2. Explicit override (`cookieOrQueryCountry` or browser `?country=CA` / `bgc-country` cookie)
 *   3. `APP_COUNTRY` / `NEXT_PUBLIC_COUNTRY` env variable (defaults to `US`).
 */
export function resolveCountryFromHostOrEnv(
  host?: string | null,
  cookieOrQueryCountry?: string | null
): CountryCode {
  const effectiveHost =
    host ?? (typeof window !== "undefined" ? window.location.host : null);

  if (effectiveHost) {
    const cleanHost = effectiveHost.toLowerCase().split(":")[0];
    if (cleanHost.startsWith("ca.")) return "CA";
    if (cleanHost.startsWith("sg.")) return "SG";
    if (cleanHost.startsWith("uk.") || cleanHost.startsWith("gb.")) return "UK";
    if (cleanHost.startsWith("au.")) return "AU";
  }

  let candidate = (cookieOrQueryCountry || "").toUpperCase().trim();
  if (!candidate && typeof window !== "undefined") {
    try {
      const qsCountry = new URLSearchParams(window.location.search).get("country");
      if (qsCountry) {
        candidate = qsCountry.toUpperCase().trim();
      } else {
        const match = document.cookie.match(/(?:^|;\s*)bgc-country=([A-Za-z]{2})/);
        if (match) candidate = match[1].toUpperCase();
      }
    } catch {
      // ignore
    }
  }

  if (candidate && candidate in COUNTRY_MARKETS) {
    return candidate as CountryCode;
  }

  const envCountry = (
    process.env.NEXT_PUBLIC_COUNTRY ||
    process.env.APP_COUNTRY ||
    "US"
  )
    .toUpperCase()
    .trim();

  if (envCountry in COUNTRY_MARKETS) {
    return envCountry as CountryCode;
  }

  return "US";
}

export function getCurrencySymbol(
  country: CountryCode = resolveCountryFromHostOrEnv()
): string {
  return (COUNTRY_MARKETS[country] || COUNTRY_MARKETS.US).currencySymbol;
}

export function getCurrencyCode(
  country: CountryCode = resolveCountryFromHostOrEnv()
): string {
  return (COUNTRY_MARKETS[country] || COUNTRY_MARKETS.US).currency;
}

export function formatCurrency(
  amountDollars: number,
  country: CountryCode = resolveCountryFromHostOrEnv(),
  decimals = 2
): string {
  const sym = getCurrencySymbol(country);
  return `${sym}${amountDollars.toFixed(decimals)}`;
}

// Cache of parsed `.env-<country>` property files so we don't hit disk repeatedly
const envFileCache: Partial<Record<CountryCode, Record<string, string>>> = {};

/**
 * Loads the country-specific property file (e.g., `env-ca`, `env-sg`, `env-uk`, `env-au`)
 * from the project root on the server.
 */
export function loadCountryEnvFile(country: CountryCode): Record<string, string> {
  if (typeof window !== "undefined") return {};
  if (envFileCache[country]) return envFileCache[country]!;

  const market = COUNTRY_MARKETS[country] || COUNTRY_MARKETS.US;
  const parsed: Record<string, string> = {};

  try {
    const req = eval("require") as NodeRequire;
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");

    const candidates = [
      path.join(process.cwd(), `env-${country.toLowerCase()}`),
      path.join(process.cwd(), market.envFile),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const idx = trimmed.indexOf("=");
          if (idx > 0) {
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
            parsed[k] = v;
          }
        }
        break;
      }
    }
  } catch {
    // Safe fallback in edge/client environments where only process.env is used
  }

  envFileCache[country] = parsed;
  return parsed;
}

/**
 * Looks up a configuration property for a specific country (`US`, `CA`, `SG`, etc.) with priority:
 *   1. Country-prefixed environment variable: `process.env[`${country}_${key}`]` (e.g. `CA_GIFTCARD_PROVIDER`, `SG_PAYPAL_CLIENT_ID`)
 *   2. Country property file (`env-ca` / `.env-ca`, `env-sg` / `.env-sg`): `fileEnv[key]`
 *   3. Global environment variable: `process.env[key]`
 *   4. Default fallback value
 */
export function getCountryEnv(
  key: string,
  country: CountryCode = resolveCountryFromHostOrEnv(),
  fallback = ""
): string {
  const prefixedKey = `${country}_${key}`;
  if (process.env[prefixedKey]) {
    return process.env[prefixedKey]!;
  }

  const fileProps = loadCountryEnvFile(country);
  if (fileProps[prefixedKey]) return fileProps[prefixedKey];
  if (fileProps[key]) return fileProps[key];

  if (process.env[key]) {
    return process.env[key]!;
  }

  return fallback;
}
