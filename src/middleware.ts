import { NextRequest, NextResponse } from "next/server";
import { parseDeviceFromUserAgent } from "@/lib/device";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const pathname = req.nextUrl.pathname;

  // Enforce canonical HTTPS apex domain on production requests (excluding webhooks)
  const isProdDomain = host === "buygiftcards.online" || host === "www.buygiftcards.online";
  if (isProdDomain && !pathname.startsWith("/api/webhooks")) {
    if (proto === "http" || host === "www.buygiftcards.online") {
      const canonicalUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, "https://buygiftcards.online");
      return NextResponse.redirect(canonicalUrl, 308);
    }
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

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Always send HSTS header so browsers cache HTTPS-only policy for buygiftcards.online
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  const isSecure = process.env.NODE_ENV === "production";

  // Persist cookies so client components & server routes can read device context
  res.cookies.set("bgc-device-type", deviceType, { path: "/", sameSite: "lax", secure: isSecure });
  res.cookies.set("bgc-device-os", info.os, { path: "/", sameSite: "lax", secure: isSecure });
  res.cookies.set("bgc-device-browser", info.browser, { path: "/", sameSite: "lax", secure: isSecure });

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|xml|txt|webmanifest)$).*)",
  ],
};
