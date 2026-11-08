import { NextRequest, NextResponse } from "next/server";
import { parseDeviceFromUserAgent } from "@/lib/device";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const pathname = req.nextUrl.pathname;

  // Detect active storefront country from:
  //   1. Subdomain (`ca.buygiftcards.online`, `sg.buygiftcards.online`, etc.)
  //   2. Query parameter (`?country=CA` / `?country=US` / etc.)
  //   3. Existing `bgc-country` cookie
  const VALID_COUNTRIES = new Set(["US", "CA", "SG", "UK", "AU"]);
  const queryCountry = (req.nextUrl.searchParams.get("country") || "").toUpperCase().trim();
  const cookieCountry = (req.cookies.get("bgc-country")?.value || "").toUpperCase().trim();

  let country = "US";
  if (host.startsWith("ca.") || host.endsWith(".ca")) country = "CA";
  else if (host.startsWith("sg.") || host.endsWith(".sg")) country = "SG";
  else if (host.startsWith("uk.") || host.startsWith("gb.") || host.endsWith(".uk")) country = "UK";
  else if (host.startsWith("au.") || host.endsWith(".au")) country = "AU";
  else if (VALID_COUNTRIES.has(queryCountry)) country = queryCountry;
  else if (VALID_COUNTRIES.has(cookieCountry)) country = cookieCountry;

  // Enforce HTTPS on production requests (excluding webhooks), while allowing both
  // buygiftcards.online, www.buygiftcards.online, country subdomains (ca., sg., uk., au.),
  // and country TLDs (.ca, .sg, .uk, .au)
  const isProdDomain =
    host === "buygiftcards.online" ||
    host.endsWith(".buygiftcards.online") ||
    host.endsWith(".sg") ||
    host.endsWith(".ca") ||
    host.endsWith(".au") ||
    host.endsWith(".uk");
  if (isProdDomain && !pathname.startsWith("/api/webhooks") && proto === "http") {
    const secureUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${host}`);
    return NextResponse.redirect(secureUrl, 308);
  }

  const ua = req.headers.get("user-agent") || "";
  const chMobile = req.headers.get("sec-ch-ua-mobile");
  const info = parseDeviceFromUserAgent(ua);

  // Respect Client Hints (`sec-ch-ua-mobile: ?1`) alongside User-Agent parsing
  const isMobile = chMobile === "?1" ? true : info.isMobile;
  const deviceType = isMobile ? "mobile" : info.deviceType;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-device-type", deviceType);
  requestHeaders.set("x-device-os", info.os);
  requestHeaders.set("x-device-browser", info.browser);
  requestHeaders.set("x-country-code", country);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Always send HSTS header so browsers cache HTTPS-only policy for buygiftcards.online
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  const isSecure = process.env.NODE_ENV === "production";

  // Persist cookies so client components & server routes can read device and country context
  res.cookies.set("bgc-device-type", deviceType, { path: "/", sameSite: "lax", secure: isSecure });
  res.cookies.set("bgc-device-os", info.os, { path: "/", sameSite: "lax", secure: isSecure });
  res.cookies.set("bgc-device-browser", info.browser, { path: "/", sameSite: "lax", secure: isSecure });
  res.cookies.set("bgc-country", country, { path: "/", sameSite: "lax", secure: isSecure });

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|xml|txt|webmanifest)$).*)",
  ],
};
