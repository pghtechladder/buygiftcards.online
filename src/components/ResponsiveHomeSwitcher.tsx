"use client";

import { useEffect, useState } from "react";
import { DeviceInfo, parseDeviceFromUserAgent } from "@/lib/device";
import { MobileHomeIndex } from "./MobileHomeIndex";

export function ResponsiveHomeSwitcher({
  initialDevice,
  forceView,
  desktopView,
}: {
  initialDevice: DeviceInfo;
  forceView?: "mobile" | "desktop";
  desktopView: React.ReactNode;
}) {
  const [isMobileView, setIsMobileView] = useState<boolean>(() => {
    if (forceView === "mobile") return true;
    if (forceView === "desktop") return false;
    return initialDevice.isMobile;
  });

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(initialDevice);

  useEffect(() => {
    if (forceView === "mobile") {
      setIsMobileView(true);
      return;
    }
    if (forceView === "desktop") {
      setIsMobileView(false);
      return;
    }

    const mql = window.matchMedia("(max-width: 767px)");
    const handleViewportChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const parsed = parseDeviceFromUserAgent(navigator.userAgent);
      setDeviceInfo(parsed);
      setIsMobileView(parsed.isMobile || e.matches);
    };

    handleViewportChange(mql);
    mql.addEventListener("change", handleViewportChange);
    return () => mql.removeEventListener("change", handleViewportChange);
  }, [forceView]);

  if (isMobileView) {
    return <MobileHomeIndex deviceInfo={deviceInfo} />;
  }

  return <>{desktopView}</>;
}

