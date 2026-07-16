import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import ToolsHubClient from "@/components/tools/ToolsHubClient";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const title =
    safeLocale === "el"
      ? "Δωρεάν εργαλεία ESG - CBAM, CSRD, VSME & Υπολογιστές GHG | VerdeIQ"
      : "Free ESG Reporting Tools - CBAM, CSRD, VSME & GHG Calculators | VerdeIQ";
  const description =
    safeLocale === "el"
      ? "Δωρεάν διαδραστικά εργαλεία για CSRD, VSME, CBAM, EU Taxonomy και GHG - χωρίς εγγραφή, με ανοιχτή μεθοδολογία και εξαγωγή PDF."
      : "Free interactive tools for CSRD, VSME, CBAM, EU Taxonomy and GHG accounting - no signup, open methodology, PDF export.";

  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/tools`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/tools`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${safeLocale}/tools`, languages },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${safeLocale}/tools`,
      siteName: "VerdeIQ",
      locale: safeLocale === "el" ? "el_CY" : "en_US",
      type: "website",
      images: [{ url: `${SITE_URL}/assets/tools/hub/hero.jpg`, width: 1600, height: 900, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/assets/tools/hub/hero.jpg`],
    },
  };
}

export default async function ToolsHub({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const safeLocale = locale as "en" | "el";

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: safeLocale === "el" ? "Δωρεάν εργαλεία ESG" : "Free ESG reporting tools",
    url: `${SITE_URL}/${safeLocale}/tools`,
    inLanguage: safeLocale === "el" ? "el-CY" : "en",
    isPartOf: { "@type": "WebSite", name: "VerdeIQ", url: SITE_URL },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "VerdeIQ", item: `${SITE_URL}/${safeLocale}` },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/${safeLocale}/tools` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <ToolsHubClient
        locale={safeLocale}
        eyebrow={safeLocale === "el" ? "VerdeIQ Tools" : "VerdeIQ Tools"}
        heading={safeLocale === "el" ? "Εργαλεία ESG" : "ESG reporting tools"}
        subheading={
          safeLocale === "el"
            ? "Ανοιχτά, δωρεάν διαδραστικά εργαλεία για CSRD, VSME, CBAM, EU Taxonomy και GHG accounting. Χωρίς εγγραφή. Ανοιχτή μεθοδολογία. Εξαγωγή PDF και CSV."
            : "Open, free interactive tools for CSRD, VSME, CBAM, EU Taxonomy and GHG accounting. No signup. Transparent methodology. Export to PDF and CSV."
        }
        countLabel={
          safeLocale === "el"
            ? "{available} διαθέσιμα από {count} · Δωρεάν · Ενημερώνονται τακτικά"
            : "{available} of {count} live · Free · Kept current"
        }
        availableLabel={safeLocale === "el" ? "Διαθέσιμο" : "Available"}
        comingSoonLabel={safeLocale === "el" ? "Σύντομα" : "Coming soon"}
        ctaHeading={
          safeLocale === "el"
            ? "Χρειάζεστε παραπάνω από ένα εργαλείο;"
            : "Need more than a one-off tool?"
        }
        ctaBody={
          safeLocale === "el"
            ? "Η πλατφόρμα VerdeIQ συνδέει λογιστική άνθρακα, CSRD, CBAM και VSME σε μία πηγή αλήθειας - με ελεγμένα δεδομένα, δικαιώματα ρόλων και ετοιμότητα ελέγχου."
            : "The VerdeIQ platform connects carbon accounting, CSRD, CBAM and VSME in one source of truth - with audited data, role permissions and audit-ready trails."
        }
        ctaAction={safeLocale === "el" ? "Δοκιμάστε το VerdeIQ" : "Try VerdeIQ"}
      />
    </>
  );
}
