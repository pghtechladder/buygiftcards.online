import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { DemoBanner } from "@/components/DemoBanner";
import { NewsletterModal } from "@/components/NewsletterModal";
import { AuthModal } from "@/components/AuthModal";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { LiveChatWidget } from "@/components/LiveChatWidget";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { StructuredData } from "@/components/StructuredData";
import { BRANDS } from "@/lib/brands";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a4738",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Buy Gift Cards Online — Instant Digital eGift Cards & Deals | buygiftcards.online",
    template: "%s | buygiftcards.online",
  },
  description: `Buy gift cards online from ${BRANDS.length}+ top brands with instant email delivery. Shop digital eGift cards, prepaid Visa® virtual cards, Amazon, Starbucks, gaming & dining gift cards with $0 purchase fees and instant savings at buygiftcards.online.`,
  keywords: [
    "buy gift cards",
    "buy gift cards online",
    "digital gift cards",
    "instant egift cards",
    "egift cards online",
    "discounted gift cards",
    "instant email gift cards",
    "virtual visa gift card",
    "buy amazon gift card online",
    "multi-brand gift card",
    "corporate gift cards",
    "last minute gift cards",
    "buygiftcards.online",
  ],
  applicationName: "buygiftcards.online",
  category: "shopping",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Buy Gift Cards Online — Instant Digital eGift Cards | buygiftcards.online",
    description: `Buy gift cards online from ${BRANDS.length}+ popular brands including Visa, Amazon, Starbucks, DoorDash, Xbox & Multi-Brand Choice Cards. Instant email delivery & secure Credit/Debit or PayPal checkout.`,
    url: siteUrl,
    siteName: "buygiftcards.online",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo-full.png",
        width: 1200,
        height: 630,
        alt: "Buy Gift Cards Online — Instant Digital eGift Cards at buygiftcards.online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Gift Cards Online — Instant Digital eGift Cards | buygiftcards.online",
    description: `Instant digital gift cards from ${BRANDS.length}+ popular brands. $0 purchase fees on brand cards and instant email delivery.`,
    images: ["/logo-full.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans text-[15px] text-ink-900 antialiased">
        <StructuredData />
        <SessionProviderWrapper>
          <CartProvider>
            <AuthModalProvider>
              <GoogleAnalytics />
              <DemoBanner />
              <Nav />
              {children}
              <Footer />
              <MobileBottomNav />
              <CartDrawer />
              <NewsletterModal />
              <AuthModal />
              <LiveChatWidget />
            </AuthModalProvider>
          </CartProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
