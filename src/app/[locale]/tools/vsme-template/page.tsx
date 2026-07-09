import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTool } from "@/data/tools";
import ToolShell, { type FaqItem, type MethodologyItem } from "@/components/tools/ToolShell";
import VsmeTemplateBuilder from "@/components/tools/widgets/VsmeTemplateBuilder";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");
const SLUG = "vsme-template";

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

const COPY = {
  en: {
    methodologyHeading: "How the template works",
    methodologyIntro:
      "The tool walks you through the twelve Basic Module disclosures (B1–B12) of the EFRAG Voluntary SME Standard. Enter data where it applies to you, skip where the standard's 'if applicable' clause permits, and export a structured report ready for review. Everything stays in your browser — no data is stored on our servers.",
    methodology: [
      { label: "Legal basis", value: "EFRAG Voluntary SME Standard (VSME) — final version, adopted December 2024. Basic Module disclosures B1–B12 are covered here; the optional Comprehensive Module (C1–C9) is not included in v1." },
      { label: "Structure", value: "B1 Basis for preparation → B2 Practices/policies → B3 Energy & GHG → B4 Pollution → B5 Biodiversity → B6 Water → B7 Waste & circularity → B8–B10 Workforce → B11 Value chain human rights → B12 Corruption & bribery." },
      { label: "Metrics", value: "Numeric fields use SI units (MWh, t CO₂e, m³, tonnes waste). Reference method: GHG Protocol Corporate Standard for Scope 1 & 2. Reasoning fields accept free text — auditors will read them." },
      { label: "Omissions", value: "The VSME 'if applicable' rule lets you skip disclosures that don't apply. B1 has a dedicated field for documenting each omission." },
      { label: "Assurance readiness", value: "The exported PDF orders disclosures in EFRAG numbering, keeps evidence fields visible, and prints on standard A4 — ready to hand to an auditor or bank." },
      { label: "Storage", value: "All entries live in your browser (localStorage). Export as JSON to keep an auditable copy, or CSV for spreadsheets." },
    ] as MethodologyItem[],
    workedExampleHeading: "A 45-person Cypriot food manufacturer uses VSME to answer bank requests",
    workedExampleBody:
      "A small food manufacturer in Limassol receives an ESG questionnaire from its main bank ahead of a €1.2m credit renewal. Rather than answer 60 ad-hoc questions, the CFO fills the VSME Basic Module template in one afternoon: B3 Energy → 210 MWh electricity (100% from the grid, Cyprus factor 0.622), Scope 1 = 42 t CO₂e (natural gas), Scope 2 location-based = 131 t CO₂e; B7 Waste → 62 t total, 40% recycled; B8 Workforce → 45 headcount, 27 female / 18 male, all on permanent contracts; B12 Convictions → 0. The exported PDF becomes the response document. The bank recognises the EFRAG structure, dispenses with the questionnaire, and the CFO now has a reusable baseline for next year and for future CSRD scoping.",
    faqHeading: "VSME reporting, answered",
    faq: [
      { q: "What is the VSME standard?", a: "The Voluntary SME Standard is EFRAG's simplified sustainability reporting standard for small and medium-sized undertakings not in scope of CSRD. It was adopted in December 2024. Its purpose is to give SMEs a common, credible way to answer bank and value-chain ESG questionnaires with a single report." },
      { q: "Is VSME mandatory?", a: "No. VSME is voluntary. But SMEs increasingly need to respond to bank, insurance and customer sustainability requests — using VSME lets you answer once, in a standard format, instead of filling dozens of bespoke questionnaires." },
      { q: "What's the difference between Basic and Comprehensive modules?", a: "The Basic Module (B1–B12) is the entry point — 12 disclosures covering the essentials. The Comprehensive Module adds strategy, targets, business-model resilience and workforce diversity for SMEs preparing to move towards CSRD or facing more demanding value-chain requests. This tool covers the Basic Module." },
      { q: "Do I need Scope 3 emissions?", a: "The Basic Module (B3) requires Scope 1 and Scope 2 only. Scope 3 is expected only in the Comprehensive Module and only if the SME has significant value-chain emissions relative to its size." },
      { q: "Which grid factor should I use for Scope 2?", a: "Use your country's official grid intensity factor — 2024 IEA or national grid operator. For Cyprus, 0.622 kg CO₂e/kWh is the current default. Report both location-based and market-based Scope 2 if you procure green electricity via PPAs or certificates." },
      { q: "How does the VSME output help with CSRD?", a: "Many VSME data points (energy, workforce, incidents, water) map directly to ESRS disclosures. Producing a VSME report is a valid warm-up for CSRD wave 2 and 3 companies — the format is different, but the underlying data collection is the same." },
      { q: "Can I omit disclosures?", a: "Yes, VSME allows 'if applicable' omissions. B1 has a dedicated field where you document the omission and the reasoning. Skipping without a stated reason is not permitted." },
      { q: "Do I need external assurance?", a: "The VSME standard does not require assurance. But if your bank, customer or supply-chain partner asks for it, VSME's structured format makes limited-assurance engagements straightforward." },
    ] as FaqItem[],
    relatedHeading: "Related guides",
    ctaHeading: "Need help completing the disclosures?",
    ctaBody: "VerdeIQ walks your team through the full VSME workflow — evidence capture, energy and GHG factor lookups, workforce data pipelines, and audit-ready export.",
    ctaAction: "Try VerdeIQ",
  },
  el: {
    methodologyHeading: "Πώς λειτουργεί το πρότυπο",
    methodologyIntro:
      "Το εργαλείο σας καθοδηγεί στις δώδεκα αποκαλύψεις της Βασικής Ενότητας (B1–B12) του EFRAG VSME. Καταχωρίστε στοιχεία όπου εφαρμόζεται, παραλείψτε όπου το πρότυπο επιτρέπει και εξάγετε δομημένη αναφορά. Όλα παραμένουν στο πρόγραμμα περιήγησής σας.",
    methodology: [
      { label: "Νομική βάση", value: "EFRAG VSME — τελική έκδοση, Δεκέμβριος 2024. Βασική Ενότητα B1–B12." },
      { label: "Δομή", value: "B1 Βάση κατάρτισης → B2 Πρακτικές → B3 Ενέργεια & GHG → B4 Ρύπανση → B5 Βιοποικιλότητα → B6 Νερό → B7 Απόβλητα → B8–B10 Ανθρώπινο δυναμικό → B11 Αλυσίδα αξίας → B12 Διαφθορά." },
      { label: "Μετρικές", value: "SI μονάδες (MWh, t CO₂e, m³). Μέθοδος: GHG Protocol για Scope 1 & 2." },
      { label: "Παραλείψεις", value: "Ο κανόνας 'αν εφαρμόζεται' επιτρέπει παραλείψεις. Το B1 έχει πεδίο τεκμηρίωσης." },
      { label: "Ετοιμότητα διασφάλισης", value: "Το εξαγόμενο PDF ακολουθεί τη σειρά EFRAG και εκτυπώνεται σε A4." },
      { label: "Αποθήκευση", value: "Όλα στο πρόγραμμα περιήγησης (localStorage). Εξαγωγή σε JSON ή CSV." },
    ] as MethodologyItem[],
    workedExampleHeading: "Παραγωγός τροφίμων 45 ατόμων στην Κύπρο απαντά σε τραπεζικά ερωτηματολόγια",
    workedExampleBody:
      "Παραγωγός τροφίμων στη Λεμεσό λαμβάνει ερωτηματολόγιο ESG από τράπεζα για ανανέωση €1,2εκ. Αντί για 60 ερωτήσεις, ο CFO συμπληρώνει το VSME σε ένα απόγευμα: B3 Ενέργεια → 210 MWh (Κύπρος 0,622), Scope 1 = 42 t CO₂e, Scope 2 = 131 t CO₂e; B7 Απόβλητα → 62 t, 40% ανακύκλωση; B8 → 45 άτομα, 27 γυναίκες / 18 άνδρες· B12 → 0. Το PDF γίνεται η απάντηση. Η τράπεζα αποδέχεται τη δομή EFRAG και ο CFO έχει επαναχρησιμοποιήσιμη βάση.",
    faqHeading: "VSME — συχνές ερωτήσεις",
    faq: [
      { q: "Τι είναι το VSME;", a: "Είναι το εθελοντικό πρότυπο βιωσιμότητας του EFRAG για ΜμΕ εκτός CSRD. Υιοθετήθηκε Δεκέμβριο 2024. Σκοπός: κοινή απάντηση σε ερωτηματολόγια τραπεζών και πελατών." },
      { q: "Είναι υποχρεωτικό;", a: "Όχι. Αλλά οι τράπεζες, οι πελάτες και οι ασφαλιστές ζητούν όλο και συχνότερα δεδομένα ESG — το VSME δίνει μία, τυποποιημένη απάντηση." },
      { q: "Ποια η διαφορά Basic vs Comprehensive;", a: "Το Basic (B1–B12) είναι το σημείο εκκίνησης. Το Comprehensive προσθέτει στρατηγική, στόχους και διαφορετικότητα εργαζομένων. Το εργαλείο καλύπτει το Basic." },
      { q: "Χρειάζομαι Scope 3;", a: "Το Basic Module απαιτεί μόνο Scope 1 και 2. Το Scope 3 εμφανίζεται μόνο στο Comprehensive." },
      { q: "Ποιον συντελεστή δικτύου να χρησιμοποιήσω;", a: "Επίσημο συντελεστή της χώρας σας — 2024 IEA ή εθνικού διαχειριστή. Κύπρος: 0,622 kg CO₂e/kWh." },
      { q: "Πώς βοηθά με το CSRD;", a: "Πολλά σημεία VSME αντιστοιχούν σε ESRS. Είναι καλή προθέρμανση για CSRD κύματα 2/3." },
      { q: "Μπορώ να παραλείψω αποκαλύψεις;", a: "Ναι, με τεκμηρίωση στο B1. Παράλειψη χωρίς αιτιολόγηση δεν επιτρέπεται." },
      { q: "Χρειάζεται εξωτερική διασφάλιση;", a: "Δεν απαιτείται από το πρότυπο. Αν τη ζητήσει τράπεζα/πελάτης, η δομή VSME διευκολύνει." },
    ] as FaqItem[],
    relatedHeading: "Σχετικοί οδηγοί",
    ctaHeading: "Χρειάζεστε βοήθεια στη συμπλήρωση;",
    ctaBody: "Η VerdeIQ καθοδηγεί την ομάδα σας στη ροή VSME — τεκμηρίωση, συντελεστές GHG, δεδομένα εργαζομένων, εξαγωγή έτοιμη για ελεγκτή.",
    ctaAction: "Δοκιμάστε το VerdeIQ",
  },
} as const;

export default async function VsmeTemplatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const safeLocale = locale as "en" | "el";
  const tool = getTool(SLUG)!;
  const c = tool[safeLocale];
  const copy = COPY[safeLocale];
  const url = `${SITE_URL}/${safeLocale}/tools/${SLUG}`;
  const heroUrl = `${SITE_URL}${tool.heroImage}`;

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: c.title,
    description: c.metaDescription,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web)",
    url,
    inLanguage: safeLocale === "el" ? "el-CY" : "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: { "@type": "Organization", name: "VerdeIQ", url: SITE_URL },
    image: heroUrl,
  };
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: safeLocale === "el" ? "Πώς να συμπληρώσετε αναφορά VSME" : "How to complete a VSME Basic Module report",
    step: [
      { "@type": "HowToStep", name: safeLocale === "el" ? "Ορίστε βάση κατάρτισης (B1)" : "Set the basis for preparation (B1)" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Δηλώστε πολιτικές (B2)" : "Declare policies and initiatives (B2)" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Υπολογίστε Scope 1 & 2 (B3)" : "Enter energy and Scope 1 & 2 emissions (B3)" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Ρύπανση, νερό, απόβλητα (B4–B7)" : "Complete pollution, biodiversity, water and waste (B4–B7)" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εργαζόμενοι (B8–B11)" : "Workforce and value-chain disclosures (B8–B11)" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εξάγετε PDF ή CSV" : "Export the report as PDF or CSV" },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "VerdeIQ", item: `${SITE_URL}/${safeLocale}` },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/${safeLocale}/tools` },
      { "@type": "ListItem", position: 3, name: c.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <ToolShell
        locale={safeLocale}
        slug={SLUG}
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        heroImage={tool.heroImage}
        updatedAt={tool.updatedAt}
        methodologyHeading={copy.methodologyHeading}
        methodologyIntro={copy.methodologyIntro}
        methodology={copy.methodology}
        workedExampleHeading={copy.workedExampleHeading}
        workedExampleBody={<p>{copy.workedExampleBody}</p>}
        faqHeading={copy.faqHeading}
        faq={copy.faq}
        relatedHeading={copy.relatedHeading}
        relatedPillarSlugs={tool.relatedPillars}
        ctaHeading={copy.ctaHeading}
        ctaBody={copy.ctaBody}
        ctaAction={copy.ctaAction}
      >
        <VsmeTemplateBuilder locale={safeLocale} />
      </ToolShell>
    </>
  );
}
