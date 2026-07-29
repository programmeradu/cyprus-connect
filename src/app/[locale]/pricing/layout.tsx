import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const t = await getTranslations({ locale: safeLocale, namespace: "seo.pricing" });

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/pricing`;
  }
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/pricing`;

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${safeLocale}/pricing`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${safeLocale}/pricing`,
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

export default async function PricingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const tFaq = await getTranslations({ locale: safeLocale, namespace: "pricing.faq" });

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5].map((i) => ({
      "@type": "Question",
      name: tFaq(`q${i}` as "q1" | "q2" | "q3" | "q4" | "q5"),
      acceptedAnswer: {
        "@type": "Answer",
        text: tFaq(`a${i}` as "a1" | "a2" | "a3" | "a4" | "a5"),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {children}
    </>
  );
}
