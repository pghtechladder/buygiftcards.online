import { headers, cookies } from "next/headers";
import { CountryCode, resolveCountryFromHostOrEnv } from "./country-config";

/**
 * Resolves the active CountryCode inside Next.js Server Components and Server Actions
 * from the incoming request's `host`, `x-country-code` header, or `bgc-country` cookie.
 */
export async function getServerCountry(): Promise<CountryCode> {
  try {
    const h = await headers();
    const c = await cookies();
    const host = h.get("x-forwarded-host") || h.get("host");
    const headerCountry = h.get("x-country-code");
    const cookieCountry = c.get("bgc-country")?.value;
    return resolveCountryFromHostOrEnv(host, headerCountry || cookieCountry);
  } catch {
    return resolveCountryFromHostOrEnv();
  }
}

