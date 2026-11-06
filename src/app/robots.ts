import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";

export default function robots(): MetadataRoute.Robots {
  const allowedRoutes = [
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
  ];
  const disallowedRoutes = ["/api/", "/checkout", "/success", "/cancel", "/account", "/analytics", "/qa-dashboard"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowedRoutes,
      },
      {
        userAgent: ["Googlebot", "Google-Extended", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Applebot-Extended"],
        allow: allowedRoutes,
        disallow: disallowedRoutes,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
