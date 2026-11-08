"use client";

import { useEffect, useState } from "react";
import {
  COUNTRY_MARKETS,
  CountryCode,
  SUPPORTED_COUNTRIES,
  resolveCountryFromHostOrEnv,
} from "@/lib/country-config";

export function CountrySelector({ variant = "header" }: { variant?: "header" | "hero" }) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("US");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const detected = resolveCountryFromHostOrEnv(window.location.host);
    setSelectedCountry(detected);
  }, []);

  const handleCountryChange = async (newCode: CountryCode) => {
    setSelectedCountry(newCode);
    const targetMarket = COUNTRY_MARKETS[newCode];
    if (!targetMarket || typeof window === "undefined") return;

    // Persist country selection in cookie (and shared `.buygiftcards.online` cookie on production)
    document.cookie = `bgc-country=${newCode}; path=/; max-age=31536000; SameSite=Lax`;
    if (window.location.hostname.endsWith("buygiftcards.online")) {
      document.cookie = `bgc-country=${newCode}; domain=.buygiftcards.online; path=/; max-age=31536000; SameSite=Lax`;
    }

    const currentHost = window.location.host.toLowerCase();
    const targetHost = new URL(targetMarket.siteUrl).host.toLowerCase();

    const activateOnCurrentDomain = () => {
      const url = new URL(window.location.href);
      if (newCode === "US") {
        url.searchParams.delete("country");
      } else {
        url.searchParams.set("country", newCode);
      }
      window.location.href = url.toString();
    };

    // If on localhost or preview URL, stay on current host with `?country=<CODE>`
    if (currentHost.includes("localhost") || currentHost.includes("127.0.0.1")) {
      activateOnCurrentDomain();
      return;
    }

    // Try redirecting to the selected country's dedicated storefront domain
    // (`https://ca.buygiftcards.online`, `https://sg.buygiftcards.online`, etc.)
    // If the subdomain DNS is not yet propagated, activate the country portal on the current domain immediately!
    if (currentHost !== targetHost) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        await fetch(`${targetMarket.siteUrl}/favicon.ico`, {
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const destUrl = `${targetMarket.siteUrl}${window.location.pathname}${window.location.search}`;
        window.location.href = destUrl;
      } catch {
        activateOnCurrentDomain();
      }
    } else {
      activateOnCurrentDomain();
    }
  };

  const activeMarket = COUNTRY_MARKETS[selectedCountry] || COUNTRY_MARKETS.US;

  if (variant === "hero") {
    return (
      <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3.5 py-1.5 text-xs text-white shadow-sm">
        <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
          Country / Store:
        </span>
        <label htmlFor="hero-country-select" className="sr-only">
          Select Country Storefront
        </label>
        <select
          id="hero-country-select"
          aria-label="Select Country Storefront"
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
          className="bg-transparent text-white font-extrabold outline-none cursor-pointer pr-1"
        >
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="text-ink-950 font-semibold">
              {c.flag} {c.name} ({c.code} · {c.currency})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <label htmlFor="nav-country-select" className="sr-only">
        Select Country
      </label>
      <select
        id="nav-country-select"
        aria-label="Select Country"
        title={`Current Store: ${activeMarket.name} (${activeMarket.siteUrl})`}
        value={selectedCountry}
        onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
        className="rounded-lg border border-ink-200 bg-ink-50 hover:bg-ink-100 text-ink-900 font-bold text-xs px-2.5 py-1.5 outline-none focus:border-brand-500 transition cursor-pointer"
      >
        {SUPPORTED_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code} className="text-ink-950 font-semibold">
            {c.flag} {c.code} ({c.name})
          </option>
        ))}
      </select>
    </div>
  );
}

