"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DeviceInfo, parseDeviceFromUserAgent } from "@/lib/device";
import { MobileHomeIndex } from "./MobileHomeIndex";

function ResponsiveHomeSwitcherInner({
  initialDevice,
  forceViewProp,
  desktopView,
}: {
  initialDevice: DeviceInfo;
  forceViewProp?: "mobile" | "desktop";
  desktopView: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const queryView = searchParams.get("view");
  const forceView =
    forceViewProp ||
    (queryView === "mobile" ? "mobile" : queryView === "desktop" ? "desktop" : undefined);

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(initialDevice);
  const [viewportOverride, setViewportOverride] = useState<"mobile" | "desktop" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const parsed = parseDeviceFromUserAgent(navigator.userAgent);
    setDeviceInfo(parsed);

    if (forceView === "mobile" || forceView === "desktop") {
      setViewportOverride(forceView);
      return;
    }

    if (typeof window.matchMedia !== "function") {
      setViewportOverride(window.innerWidth <= 767 || parsed.isMobile ? "mobile" : "desktop");
      return;
    }

    const mql = window.matchMedia("(max-width: 767px)");
    const handleViewportChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const currentParsed = parseDeviceFromUserAgent(navigator.userAgent);
      setDeviceInfo(currentParsed);
      setViewportOverride(currentParsed.isMobile || e.matches ? "mobile" : "desktop");
    };

    handleViewportChange(mql);

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleViewportChange);
      return () => mql.removeEventListener("change", handleViewportChange);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(handleViewportChange);
      return () => mql.removeListener(handleViewportChange);
    }
  }, [forceView]);

  if (forceView === "mobile" || viewportOverride === "mobile") {
    return <MobileHomeIndex deviceInfo={deviceInfo} />;
  }

  if (forceView === "desktop" || viewportOverride === "desktop") {
    return <>{desktopView}</>;
  }

  // First paint / SSR before client hydration completes:
  // Use pure CSS responsive media queries (`md:hidden` / `hidden md:block`) so that mobile
  // and desktop browsers ALWAYS see the right layout immediately with zero SSR hydration mismatch!
  return (
    <>
      <div className="md:hidden">
        <MobileHomeIndex deviceInfo={deviceInfo} />
      </div>
      <div className="hidden md:block">{desktopView}</div>
    </>
  );
}

export function ResponsiveHomeSwitcher(props: {
  initialDevice: DeviceInfo;
  forceView?: "mobile" | "desktop";
  desktopView: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <>
          <div className="md:hidden">
            <MobileHomeIndex deviceInfo={props.initialDevice} />
          </div>
          <div className="hidden md:block">{props.desktopView}</div>
        </>
      }
    >
      <ResponsiveHomeSwitcherInner
        initialDevice={props.initialDevice}
        forceViewProp={props.forceView}
        desktopView={props.desktopView}
      />
    </Suspense>
  );
}
