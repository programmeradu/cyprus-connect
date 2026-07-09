import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTool } from "@/data/tools";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { DashboardDemo } from "@/components/DashboardDemo";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");
const SLUG = "report-visuals";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;
  const tool = getTool(SLUG)!;
  const c = tool[safeLocale === "el" ? "el" : "en"];
  const url = `${SITE_URL}/${safeLocale}/tools/${SLUG}`;
  const ogImage = `${SITE_URL}${tool.heroImage}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales)
    languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/tools/${SLUG}`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/tools/${SLUG}`;

  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: url, languages },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url,
      siteName: "VerdeIQ",
      locale: safeLocale === "el" ? "el_CY" : "en_US",
      type: "website",
      images: [{ url: ogImage, width: 1600, height: 900, alt: c.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: c.metaTitle,
      description: c.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function ReportVisualsToolPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const safeLocale = locale as "en" | "el";
  const tool = getTool(SLUG)!;
  const c = tool[safeLocale];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <header className="mb-10 max-w-3xl sm:mb-14">
          <p className="eyebrow text-primary">{c.eyebrow}</p>
          <h1 className="mt-3 text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[52px]">
            {c.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.6] text-foreground/70 sm:text-[18px]">
            {c.subtitle}
          </p>
        </header>

        <section className="rounded-2xl border border-border/60 bg-card/40 p-2 sm:p-4">
          <DashboardDemo landingMode focusTab="report" />
        </section>
      </main>
    </div>
  );
}
