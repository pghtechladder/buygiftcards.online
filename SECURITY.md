# Security & Defense Specification

This document details the active security architecture, bot mitigation, server hardening, payment compliance, and continuous defense measures implemented across BuyGiftCards.online to prevent automated attacks, carding, credential stuffing, scraping, Magecart/form-jacking, and server compromises.

---

## 1. Bot Mitigation & Anti-Automation

Automated threats such as card testing (carding), credential stuffing, and inventory scraping are countered using defense-in-depth across the edge and application layers.

### 1.1 Web Application Firewall (WAF)
- **Edge Deployment**: Cloudflare / AWS WAF deployed ahead of origin.
- **Bot Fighting Mode / Managed Bot Protection**: Distinguishes human browser behavior from automated scraping and headless drivers using browser fingerprinting, TLS client hello inspection, and IP reputation.
- **Managed Rate Limiting & Rules**:
  - `URI Path starts_with /api/checkout/` -> Rate limit to 10 requests / min / IP.
  - `URI Path starts_with /api/auth/` -> Rate limit to 5 requests / min / IP.
  - `URI Path starts_with /api/redeem` -> Rate limit to 10 requests / min / IP.
  - `User-Agent matches regex (curl|wget|python|postman|scrapy|puppeteer|headless)` on mutation endpoints -> Block / Managed Challenge.

### 1.2 Behavioral CAPTCHA (Cloudflare Turnstile)
- Low-friction, invisible challenge verifying human interaction without frustrating puzzles.
- Server-side verification (`src/lib/turnstile.ts` via `https://challenges.cloudflare.com/turnstile/v0/siteverify`) enforced on:
  - **Checkout**: `/api/checkout/paypal`
  - **Account Registration**: `/api/auth/register`
  - **Password Reset**: `/api/auth/forgot-password`
- Client helper (`src/lib/turnstile-client.ts`) loads the Turnstile script dynamically on demand, executes `turnstile.render({ size: 'invisible' })`, and attaches the token (`x-turnstile-token`) to API mutations.
- *Graceful fallback*: If `TURNSTILE_SECRET_KEY` is omitted, the API safely permits valid requests to prevent disruption during development, but enforces verification strictly in production when keys are present.

### 1.3 Application Sliding-Window Rate Limiting
- Built-in in-memory sliding-window limiter (`src/lib/rate-limit.ts`) active via Next.js Edge Middleware (`src/middleware.ts`):
  - **Authentication endpoints (`/api/auth/*`)**: 5 requests / 60 seconds.
  - **Checkout endpoints (`/api/checkout/*`)**: 10 requests / 60 seconds.
  - **Card redemption endpoints (`/api/redeem/*`)**: 10 requests / 60 seconds.
  - **Form submissions (`/api/support`, `/api/contact`, `/api/orders/lookup`)**: 15 requests / 60 seconds.
  - **Global API ceiling (`/api/*`)**: 120 requests / 60 seconds.
- Header compliance: Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` on HTTP `429 Too Many Requests`.
- Webhooks exempt: `/api/webhooks/*` are excluded to guarantee zero disruption to asynchronous payment gateway callbacks.

---

## 2. Malware Prevention & Server Hardening

Prevents client-side payment hijacking (Magecart attacks), server-side malware, unauthorized file mutations, and cross-tenant pollution.

### 2.1 Content Security Policy (CSP) & HTTP Defense Headers
Strict CSP enforced via `next.config.mjs` and `vercel.json`:
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://*.paypal.com https://challenges.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com; connect-src 'self' https://*.paypal.com https://challenges.cloudflare.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.public.blob.vercel-storage.com https://api.zendit.io https://api.tangocard.com; frame-src 'self' https://www.paypal.com https://*.paypal.com https://challenges.cloudflare.com; img-src 'self' data: blob: https: http:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self' https://*.paypal.com;
```
Additional defense headers:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 2.2 File Integrity Monitoring (FIM) & Supply Chain Security
- **CI/CD Guard**: GitHub Actions CodeQL security scanning and Dependabot alerts enabled to continuously audit npm package dependencies.
- **Server File Integrity (FIM)**: Recommended tools for production container / host monitoring:
  - **OSSEC / Wazuh**: Monitored directories `/app/src`, `/app/public`, `/app/package.json` with real-time alerting on unauthorized file creation or content drift.
  - **Tripwire / Datadog FIM**: File checksum baselines established upon build; any hash mismatch triggers immediate Slack / PagerDuty alerts.
- **Read-Only Container Filesystems**: Production server runtime runs in immutable, read-only root filesystems (e.g. Vercel Serverless Functions / Docker `read_only: true` with ephemeral `/tmp`).

### 2.3 Payment Environment Isolation
- Payment logic and gift card issuance are strictly separated from marketing blogs or unvetted CMS plugins.
- Sensitive environment secrets (`PAYPAL_CLIENT_SECRET`, `ZENDIT_PRODUCTION_API_KEY`, `TANGO_PLATFORM_KEY`, `EGIFTER_API_KEY`) are encrypted at rest in environment vaults and never exposed to the client bundle (`NEXT_PUBLIC_*`).

---

## 3. Payment Compliance & Architecture (PCI-DSS SAQ-A)

### 3.1 Hosted Payment Fields & Tokenization
- **Zero Raw PAN Storage**: No primary account numbers (PAN), CVVs, expiration dates, or bank details ever touch our application server or database.
- **Gateway-Hosted iFrames**:
  - PayPal Smart Payment Buttons & Hosted Fields capture customer payment credentials directly inside PCI-DSS Level 1 compliant secure iFrames hosted by PayPal (`https://www.paypal.com`).
  - Our servers receive solely tokenized order identifiers (`paypalOrderId`), completely preventing server-side keylogger or Magecart exposure.

### 3.2 PCI-DSS Compliance
- **Scope Tier**: Meets criteria for **PCI-DSS SAQ-A** (the lowest risk compliance tier, reserved for e-commerce sites where all cardholder data handling is outsourced to PCI-DSS validated third-party gateways).
- **Quarterly ASV Vulnerability Scans**: Approved Scanning Vendor scans scheduled on all public facing domains.

---

## 4. Continuous Defense Measures

### 4.1 Dependency & Patch Updates
- Node.js runtime and Next.js framework kept up to date with zero unpatched CVEs.
- `npm audit` run regularly as part of deployment pipelines.

### 4.2 Strict TLS 1.3 Enforcement & HSTS Preloading
- Web traffic served strictly over TLS 1.3 (with modern TLS 1.2 cipher fallbacks on the edge).
- HSTS preload header enabled with 2-year duration (`max-age=63072000; includeSubDomains; preload`), qualifying the domain for the HSTS Preload list (Chrome, Firefox, Safari).

