export type DeviceType = "mobile" | "tablet" | "desktop";
export type DeviceOs = "ios" | "android" | "windows" | "macos" | "linux" | "other";
export type BrowserName = "safari" | "chrome" | "firefox" | "edge" | "samsung" | "other";

export type DeviceInfo = {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  os: DeviceOs;
  browser: BrowserName;
  userAgent: string;
};

/**
 * Parses a User-Agent string (from server headers or client `navigator.userAgent`)
 * to detect device type (mobile/tablet/desktop), operating system, and browser.
 */
export function parseDeviceFromUserAgent(uaRaw?: string | null): DeviceInfo {
  const ua = (uaRaw || "").toLowerCase();

  const isTablet =
    /ipad|tablet|playbook|silk/i.test(ua) ||
    (/android/i.test(ua) && !/mobile/i.test(ua));

  const isMobilePhone =
    !isTablet &&
    /iphone|ipod|android.*mobile|windows phone|iemobile|blackberry|bb10|opera mini|mobile/i.test(
      ua
    );

  const deviceType: DeviceType = isMobilePhone
    ? "mobile"
    : isTablet
      ? "tablet"
      : "desktop";

  let os: DeviceOs = "other";
  if (/iphone|ipad|ipod/i.test(ua)) os = "ios";
  else if (/android/i.test(ua)) os = "android";
  else if (/windows/i.test(ua)) os = "windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macos";
  else if (/linux/i.test(ua)) os = "linux";

  let browser: BrowserName = "other";
  if (/samsungbrowser/i.test(ua)) browser = "samsung";
  else if (/edg\//i.test(ua)) browser = "edge";
  else if (/chrome|crios/i.test(ua)) browser = "chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "firefox";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "safari";

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    os,
    browser,
    userAgent: uaRaw || "",
  };
}
