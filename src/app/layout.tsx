import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Toaster } from "@/components/ui/sonner";

import { routing } from "@/i18n/routing";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");

// Root metadata holds only sitewide defaults. Canonical, hreflang alternates,
// per-page titles, descriptions, and og:* tags live in the [locale] layout and
// leaf routes so each page gets unique, self-referencing metadata.
export const metadata: Metadata = {
  title: {
    default: "VerdeIQ — AI-Powered Sustainability for SMEs in Cyprus & the EU",
    template: "%s",
  },
  description:
    "Track, optimize, and report your environmental impact with AI. Built for SMEs in Cyprus and across the EU — GDPR-compliant, EUR pricing, EN & EL.",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // next-intl middleware sets this header; fall back to default locale.
  const hdrs = await headers();
  const headerLocale = hdrs.get("x-next-intl-locale");
  const lang =
    headerLocale && routing.locales.includes(headerLocale as (typeof routing.locales)[number])
      ? headerLocale
      : routing.defaultLocale;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="d20fb006-92bc-4c81-8b2f-07a37aa9e2cd"
        />
        <CurrencyProvider>
          <ErrorReporter />
          <Script
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
            strategy="afterInteractive"
            data-target-origin="*"
            data-message-type="ROUTE_CHANGE"
            data-include-search-params="true"
            data-only-in-iframe="true"
            data-debug="false"
            data-custom-data='{"appName": "VerdeIQ", "version": "1.0.0", "feature": "sustainability-platform"}'
          />
          {children}

          <VisualEditsMessenger />
          <Toaster />
        </CurrencyProvider>
      </body>
    </html>
  );
}
