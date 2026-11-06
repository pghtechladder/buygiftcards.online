import { headers } from "next/headers";
import { MobileHomeIndex } from "@/components/MobileHomeIndex";
import { parseDeviceFromUserAgent } from "@/lib/device";

export const metadata = {
  title: "Mobile Express Store — buygiftcards.online",
  description: "Fast mobile gift card shopping with 1-tap PayPal checkout and instant digital delivery.",
};

export default async function DedicatedMobileIndexPage() {
  const reqHeaders = await headers();
  const ua = reqHeaders.get("user-agent") || "";
  const deviceInfo = parseDeviceFromUserAgent(ua);
  deviceInfo.isMobile = true;
  deviceInfo.deviceType = "mobile";

  return <MobileHomeIndex deviceInfo={deviceInfo} />;
}
