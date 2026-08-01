"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useCookieConsent } from "@/lib/consent";

const GA_MEASUREMENT_ID = "G-B4SQWJ45RE";

export function ConsentedAnalytics() {
  const { accepted, hydrated } = useCookieConsent();

  // Update GA4 consent mode dynamically when consent state changes
  useEffect(() => {
    if (!hydrated || typeof window === "undefined" || typeof window.gtag !== "function") return;

    if (accepted) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    } else {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  }, [accepted, hydrated]);

  return (
    <>
      {/* 1. Define dataLayer and set default consent mode to 'denied' (GDPR & ePrivacy compliant) */}
      <Script id="gtag-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: true
          });
        `}
      </Script>

      {/* 2. Load Google Tag Manager / GA4 script so GA4 detectors and Tag Assistant find G-B4SQWJ45RE immediately */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
