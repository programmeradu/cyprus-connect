import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

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
      siteName: "VerdeIQ",
      locale: safeLocale === "el" ? "el_CY" : "en_US",
      alternateLocale: safeLocale === "el" ? ["en_US"] : ["el_CY"],
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
