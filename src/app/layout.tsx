import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Toaster } from "@/components/ui/sonner";
import CustomAutumnProvider from "@/lib/autumn-provider";

export const metadata: Metadata = {
  title: "VerdeIQ - AI-Powered Sustainability for SMEs",
  description: "Transform your business with AI-powered sustainability insights. Track, optimize, and report your environmental impact effortlessly.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : new URL("http://localhost:3000"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
    openGraph: {
      title: "VerdeIQ - AI-Powered Sustainability for SMEs",
      description: "Transform your business with AI-powered sustainability insights.",
      url: "https://verdeiqapp.vercel.app",
      siteName: "VerdeIQ",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "VerdeIQ - AI-Powered Sustainability for SMEs",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "VerdeIQ - AI-Powered Sustainability for SMEs",
      description: "Transform your business with AI-powered sustainability insights.",
      images: ["/og-image.png"],
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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