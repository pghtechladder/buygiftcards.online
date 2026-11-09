/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: "https", hostname: "img.logo.dev" },
    ],
    // Next's default is "attachment", which stops our own logo assets from
    // rendering inline via the image optimizer (forces a download instead).
    contentDispositionType: "inline",
  },
  async redirects() {
    return [
      { source: "/mastercard", destination: "/product/mastercard", permanent: false },
      { source: "/visa", destination: "/product/visa", permanent: false },
      { source: "/amazon", destination: "/product/amazon", permanent: false },
      { source: "/target", destination: "/product/target", permanent: false },
      { source: "/walmart", destination: "/product/walmart", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://*.paypal.com https://challenges.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com",
              "connect-src 'self' https://*.paypal.com https://challenges.cloudflare.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.public.blob.vercel-storage.com https://api.zendit.io https://api.tangocard.com https://*.cj.com https://*.awin1.com https://*.impact.com",
              "frame-src 'self' https://www.paypal.com https://*.paypal.com https://challenges.cloudflare.com",
              "img-src 'self' data: blob: https: http:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.paypal.com",
            ].join("; "),
          },
        ],
      },
      {
        source: "/(.*)\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
