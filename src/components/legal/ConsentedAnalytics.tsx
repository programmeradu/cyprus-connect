"use client";

/**
 * Renders analytics/tracking scripts ONLY when the visitor has accepted the
 * optional analytics cookies via the cookie banner. Wire up your analytics
 * providers (Plausible, GA4, PostHog, etc.) inside the `ConsentedAnalytics`
 * body - they will mount when consent is granted and unmount when consent is
 * revoked, keeping the site GDPR/ePrivacy compliant.
 *
 * The strictly-necessary Lovable error/log script is loaded in root layout
 * and is unaffected by this gate (it is required for the service to function).
 */

import Script from "next/script";
import { useCookieConsent } from "@/lib/consent";

export function ConsentedAnalytics() {
  const { accepted, hydrated } = useCookieConsent();

  // Don't render anything until hydration completes, and only when accepted.
  if (!hydrated || !accepted) return null;

  return (
    <>
      {/* Google Analytics (GA4) — consent-gated */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-B4SQWJ45RE"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-B4SQWJ45RE');
        `}
      </Script>
    </>
  );
}
