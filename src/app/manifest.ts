import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Buy Gift Cards Online — buygiftcards.online",
    short_name: "BuyGiftCards",
    description:
      "Buy gift cards online with instant email delivery. Shop 165+ top digital eGift cards, Visa virtual accounts, Amazon, Starbucks, gaming, dining, and retail gift cards.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a4738",
    icons: [
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/logo-mark-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
