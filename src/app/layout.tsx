import type { Metadata } from "next";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buygiftcards.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "buygiftcards.online — Digital Gift Cards", template: "%s — buygiftcards.online" },
  description: "Browse and buy digital gift cards from popular brands, checked out securely with Stripe. Instant email delivery.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "buygiftcards.online — Digital Gift Cards",
    description: "Browse and buy digital gift cards from popular brands, checked out securely with Stripe.",
    siteName: "buygiftcards.online",
    type: "website",
    images: ["/logo-full.png"],
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans text-[15px] text-ink-900 antialiased">
        <SessionProviderWrapper>
          <CartProvider>
            <AuthModalProvider>
              <DemoBanner />
              <Nav />
              {children}
              <Footer />
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
