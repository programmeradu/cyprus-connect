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
      {/*
        Example: Plausible analytics (self-hosted, cookieless-friendly but
        still user-choice gated here).

        <Script
          defer
          data-domain="vuneli.lovable.app"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      */}
      {/*
        Example: PostHog

        <Script id="posthog" strategy="afterInteractive">
          {`!function(t,e){ ... }`}
        </Script>
      */}
      {/* Explicit placeholder so the file compiles with no providers wired. */}
      <Script id="vuneli-analytics-noop" strategy="afterInteractive">
        {`window.__vuneliAnalyticsReady=true;`}
      </Script>
    </>
  );
}
