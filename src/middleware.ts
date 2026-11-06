import { NextRequest, NextResponse } from "next/server";
import { parseDeviceFromUserAgent } from "@/lib/device";

export function middleware(req: NextRequest) {
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

  // Persist cookies so client components & server routes can read device context
  res.cookies.set("bgc-device-type", deviceType, { path: "/", sameSite: "lax" });
  res.cookies.set("bgc-device-os", info.os, { path: "/", sameSite: "lax" });
  res.cookies.set("bgc-device-browser", info.browser, { path: "/", sameSite: "lax" });

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
