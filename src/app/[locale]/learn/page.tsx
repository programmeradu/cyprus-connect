import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getAllPillars } from "@/data/learn/pillars";
import LearnHubClient from "@/components/learn/LearnHubClient";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");

// Slugs that ship with an interactive widget (mirrors WIDGET_MAP in [slug]/page.tsx)
const WIDGET_SLUGS = new Set([
  "csrd-reporting-guide",
  "csrd-reporting-cyprus",
  "vsme-reporting-guide",
  "esrs-standards-explained",
  "eu-taxonomy-explained",
  "sustainability-reporting-eu",
  "double-materiality-assessment",
  "scope-1-2-3-emissions",
  "scope-3-emissions-calculation",
  "ghg-protocol-guide",
  "carbon-accounting-for-smes",
  "carbon-footprint-software-smes",
  "net-zero-roadmap-smes",
  "science-based-targets-sbti",
  "cbam-explained",
  "cbam-cyprus",
]);

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const title = safeLocale === "el"
    ? "Κόμβος Γνώσης VerdeIQ - Οδηγοί CSRD, VSME, CBAM & Λογιστικής Άνθρακα"
    : "VerdeIQ Learn - CSRD, VSME, CBAM & Carbon Accounting Guides";
  const description = safeLocale === "el"
    ? "Πρακτικοί, διαδραστικοί οδηγοί για CSRD, VSME, CBAM, ESRS και βιωσιμότητα ΜμΕ - με ελεύθερα εργαλεία υπολογισμού για CFOs και υπεύθυνους βιωσιμότητας."
    : "Practical, interactive guides on CSRD, VSME, CBAM, ESRS and SME sustainability - with free built-in calculators for CFOs and sustainability leads.";

  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/learn`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/learn`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${safeLocale}/learn`, languages },
    openGraph: {
      title, description,
      url: `${SITE_URL}/${safeLocale}/learn`,
      siteName: "VerdeIQ",
      locale: safeLocale === "el" ? "el_CY" : "en_US",
      type: "website",
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/og-image.png`] },
  };
}

const CATEGORY_META: Record<string, { en: { label: string; desc: string }; el: { label: string; desc: string } }> = {
  csrd: {
    en: { label: "CSRD & ESRS", desc: "The core EU sustainability reporting regime - who's in scope, when, and how." },
    el: { label: "CSRD & ESRS", desc: "Το βασικό καθεστώς αναφοράς βιωσιμότητας της ΕΕ - ποιοι, πότε, πώς." },
  },
  cbam: {
    en: { label: "CBAM", desc: "Carbon border adjustment mechanism - costs, compliance, and Cyprus-specific impact." },
    el: { label: "CBAM", desc: "Μηχανισμός συνοριακής προσαρμογής άνθρακα - κόστη, συμμόρφωση και επίπτωση στην Κύπρο." },
  },
  carbon: {
    en: { label: "Carbon accounting", desc: "Measure, model and reduce Scope 1, 2 and 3 emissions." },
    el: { label: "Λογιστική άνθρακα", desc: "Μέτρηση, μοντελοποίηση και μείωση εκπομπών Scope 1, 2 και 3." },
  },
  standards: {
    en: { label: "Standards & frameworks", desc: "GHG Protocol, ESRS, SBTi, EU Taxonomy - the rulebooks behind reporting." },
    el: { label: "Πρότυπα & πλαίσια", desc: "GHG Protocol, ESRS, SBTi, EU Taxonomy - τα βιβλία κανόνων." },
  },
  esg: {
    en: { label: "ESG reporting", desc: "Software, KPIs and disclosure workflow for finance and sustainability teams." },
    el: { label: "ESG αναφορές", desc: "Λογισμικό, KPIs και ροή αποκάλυψης για ομάδες οικονομικών και βιωσιμότητας." },
  },
  sme: {
    en: { label: "For SMEs", desc: "Right-sized guidance for small and medium businesses - VSME, roadmaps, KPIs." },
    el: { label: "Για ΜμΕ", desc: "Καθοδήγηση προσαρμοσμένη για μικρές και μεσαίες επιχειρήσεις." },
  },
  cyprus: {
    en: { label: "Cyprus focus", desc: "Local regulatory context, timelines and case studies for Cypriot companies." },
    el: { label: "Εστίαση Κύπρου", desc: "Τοπικό ρυθμιστικό πλαίσιο, χρονοδιαγράμματα και μελέτες περίπτωσης." },
  },
};

const CATEGORY_ORDER = ["csrd", "cbam", "carbon", "standards", "esg", "sme", "cyprus"] as const;

export default async function LearnIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const safeLocale = locale as "en" | "el";
  const all = getAllPillars();

  const pillarCards = all.map((p) => {
    const c = p[safeLocale];
    return {
      slug: p.slug,
      category: p.category,
      heroImage: p.heroImage,
      readingMinutes: p.readingMinutes,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      eyebrow: c.heroEyebrow,
      title: c.title,
      description: c.metaDescription,
      keywords: `${p.primaryKeyword} ${p.category} ${p.slug.replace(/-/g, " ")}`,
      hasWidget: WIDGET_SLUGS.has(p.slug),
    };
  });

  const categories = CATEGORY_ORDER
    .filter((k) => pillarCards.some((p) => p.category === k))
    .map((k) => ({
      key: k,
      label: CATEGORY_META[k][safeLocale].label,
      description: CATEGORY_META[k][safeLocale].desc,
    }));

  const heading = safeLocale === "el" ? "Κόμβος Γνώσης" : "The Learn hub";
  const subheading = safeLocale === "el"
    ? "Πρακτικοί οδηγοί για CSRD, VSME, CBAM, ESRS και βιωσιμότητα ΜμΕ - με διαδραστικά εργαλεία υπολογισμού μέσα σε κάθε άρθρο."
    : "Practical guides on CSRD, VSME, CBAM, ESRS and SME sustainability - with interactive calculators built into every article.";
  const searchPlaceholder = safeLocale === "el" ? "Αναζήτηση οδηγών…" : "Search guides…";

  return (
    <LearnHubClient
      locale={safeLocale}
      pillars={pillarCards}
      categories={categories}
      heading={heading}
      subheading={subheading}
      searchPlaceholder={searchPlaceholder}
      allLabel={safeLocale === "el" ? "Όλα" : "All"}
      interactiveLabel={safeLocale === "el" ? "Εργαλείο" : "Tool"}
      featuredLabel={safeLocale === "el" ? "Προτεινόμενα" : "Featured guides"}
      emptyLabel={safeLocale === "el" ? "Δεν βρέθηκαν οδηγοί." : "No guides match your search."}
      guidesCountLabelTemplate={
        safeLocale === "el"
          ? "{count} οδηγοί · Ενημερώνονται τακτικά · Δωρεάν για ανάγνωση"
          : "{count} in-depth guides · Kept current · Free to read"
      }
    />
  );
}
