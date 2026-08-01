import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { GlobalChrome } from "@/components/legal/GlobalChrome";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { ConsentedAnalytics } from "@/components/legal/ConsentedAnalytics";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const t = await getTranslations({ locale: safeLocale, namespace: "seo.home" });

  const languages: Record<string, string> = {
    en: `${SITE_URL}/en`,
    el: `${SITE_URL}/el`,
    "el-CY": `${SITE_URL}/el`,
    "x-default": `${SITE_URL}/${routing.defaultLocale}`,
  };

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${safeLocale}`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${safeLocale}`,
      siteName: "Vuneli",
      locale: safeLocale === "el" ? "el_CY" : "en_US",
      alternateLocale: safeLocale === "el" ? ["en_US"] : ["el_CY"],
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "seo.home" });
  const inLanguage = locale === "el" ? "el-CY" : "en";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vuneli",
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/icon.png`,
    description: t("description"),
    address: {
      "@type": "PostalAddress",
      addressCountry: "CY",
    },
    areaServed: ["CY", "EU"],
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vuneli",
    url: `${SITE_URL}/${locale}`,
    inLanguage,
    publisher: { "@type": "Organization", name: "Vuneli", url: `${SITE_URL}/${locale}` },
  };

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Vuneli Sustainability Platform",
    provider: { "@type": "Organization", name: "Vuneli", url: `${SITE_URL}/${locale}` },
    areaServed: ["CY", "EU"],
    serviceType: "AI-powered ESG, carbon accounting and CSRD/VSME reporting for SMEs",
    description: t("description"),
    url: `${SITE_URL}/${locale}`,
  };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      {children}
      <GlobalChrome />
      <CookieBanner />
      <ConsentedAnalytics />
    </NextIntlClientProvider>
  );
}

