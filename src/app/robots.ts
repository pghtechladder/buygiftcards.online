import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout", "/success", "/cancel", "/account", "/analytics"],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/catalog",
          "/product/",
          "/deals",
          "/occasions",
          "/redeem",
          "/business",
          "/group-gifts",
          "/balance",
          "/activate",
          "/track-order",
          "/gift-safe",
          "/about",
          "/support",
          "/terms",
          "/privacy",
        ],
        disallow: ["/api/", "/checkout", "/success", "/cancel", "/account", "/analytics", "/qa-dashboard"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
