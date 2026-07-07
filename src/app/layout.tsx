import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Toaster } from "@/components/ui/sonner";
import CustomAutumnProvider from "@/lib/autumn-provider";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "VerdeIQ — AI-Powered Sustainability for SMEs in Cyprus & the EU",
  description:
    "Track, optimize, and report your environmental impact with AI. Built for SMEs in Cyprus and across the EU — GDPR-compliant, EUR pricing, EN & EL.",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      "el-CY": "/el",
      "x-default": "/en",
    },
  },
  openGraph: {
    title: "VerdeIQ — AI-Powered Sustainability for SMEs",
    description:
      "Track, optimize, and report your environmental impact with AI-powered insights. Available in English and Greek for Cyprus.",
    url: SITE_URL,
    siteName: "VerdeIQ",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VerdeIQ — AI-Powered Sustainability for SMEs",
      },
    ],
    locale: "en_US",
    alternateLocale: ["el_CY"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerdeIQ — AI-Powered Sustainability for SMEs",
    description: "AI-powered sustainability insights for SMEs in Cyprus and the EU.",
    images: ["/og-image.png"],
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
      <head>
        {routing.locales.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l === "el" ? "el-CY" : l}
            href={`${SITE_URL}/${l}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en`} />
      </head>
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
          <CustomAutumnProvider>
            {children}
          </CustomAutumnProvider>
          <VisualEditsMessenger />
          <Toaster />
        </CurrencyProvider>
      </body>
    </html>
  );
}
