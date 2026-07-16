import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTool } from "@/data/tools";
import ToolShell, { type FaqItem, type MethodologyItem } from "@/components/tools/ToolShell";
import SbtiTargetSetter from "@/components/tools/widgets/SbtiTargetSetter";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");
const SLUG = "sbti-target-setter";

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
    methodologyHeading: "How the target setter works",
    methodologyIntro:
      "The tool applies the SBTi Corporate Net-Zero Standard's linear absolute-contraction pathway to your base-year inventory. It computes the required reduction for Scope 1 & 2 (and Scope 3 when material), produces a draft target statement in the SBTi-recognised format, and exports the full annual pathway to PDF or CSV - ready to review with your sustainability lead before validation.",
    methodology: [
      { label: "Standard", value: "SBTi Corporate Net-Zero Standard v1.2 (April 2024) and Near-Term Criteria & Recommendations v5.1. The tool covers near-term (5–10 years) and long-term net-zero targets. Sector-specific pathways (FLAG, power, buildings, transport) are not modelled - use the SBTi sector guidance for those." },
      { label: "Scope 1 & 2 ambition", value: "1.5°C aligned = 4.2% linear absolute reduction per year, measured from the base year. Well-below-2°C = 2.5%/yr and is only accepted for existing near-term targets grandfathered before v5.1." },
      { label: "Scope 3 threshold", value: "SBTi criterion C15: a Scope 3 target is mandatory when Scope 3 represents more than 40% of total base-year Scope 1 + 2 + 3 emissions. The tool flags this automatically. Scope 3 default ambition is well-below-2°C (2.5%/yr)." },
      { label: "Base year rules", value: "The base year must be no more than two years before the year of submission. All targets are absolute - economic or physical intensity targets are not produced by this tool." },
      { label: "Long-term net-zero", value: "SBTi requires a long-term commitment to reach net-zero across the value chain by 2050 at the latest, with a 90% absolute reduction against the base year. Residual emissions must be neutralised by permanent removals." },
      { label: "Storage", value: "All inputs live in your browser (localStorage). Export as JSON to keep an auditable record or CSV for spreadsheets." },
    ] as MethodologyItem[],
    workedExampleHeading: "A 62-person Cypriot logistics firm sets a 1.5°C near-term target",
    workedExampleBody:
      "A road-freight operator based in Nicosia takes 2024 as its base year: Scope 1 = 480 t CO₂e (diesel fleet), Scope 2 = 45 t CO₂e (depot electricity, Cyprus grid), Scope 3 = 210 t CO₂e (upstream fuel + business travel). Scope 3 is 29% of total - below the 40% threshold, so a Scope 3 target is recommended rather than mandatory. The COO picks 2030 as the target year (6-year horizon). Scope 1 & 2: 6 × 4.2% = 25.2% absolute reduction, from 525 to 393 t CO₂e. Scope 3 at well-below-2°C: 6 × 2.5% = 15% reduction, from 210 to 178 t CO₂e. The draft statement is exported as PDF, walked through the SBTi submission checklist, and the firm books the validation review - total elapsed time under two hours.",
    faqHeading: "SBTi target setting, answered",
    faq: [
      { q: "What is a science-based target?", a: "A greenhouse-gas reduction target aligned with the level of decarbonisation required to keep global temperature increase to 1.5°C above pre-industrial levels. The Science Based Targets initiative (SBTi) validates targets against its Corporate Net-Zero Standard." },
      { q: "Do I have to submit my target to SBTi to call it 'science-based'?", a: "Publicly claiming a validated science-based target requires SBTi review and validation. You can adopt an SBTi-aligned target internally without submitting, but the SBTi label is protected - this tool produces a draft you can either use internally or submit for validation." },
      { q: "What's the difference between near-term and long-term targets?", a: "Near-term targets cover 5–10 years from the base year and drive immediate action. The long-term target must reach net-zero by 2050 at the latest, with a 90% absolute reduction versus the base year - the remaining 10% is neutralised by permanent carbon removals." },
      { q: "When is a Scope 3 target mandatory?", a: "Under SBTi criterion C15, a Scope 3 target is required whenever Scope 3 emissions are more than 40% of your total Scope 1 + 2 + 3 base-year inventory. Most manufacturers, retailers and services companies fall above this threshold." },
      { q: "Why 4.2% per year for 1.5°C?", a: "The 4.2% linear rate is derived from the IPCC 1.5°C-no-overshoot scenarios and applied by SBTi as the minimum ambition for absolute Scope 1 & 2 targets. It is a straight-line reduction against the base year, not compound." },
      { q: "Is well-below-2°C still accepted?", a: "For Scope 3, yes - 2.5%/yr well-below-2°C remains the default. For Scope 1 & 2, new targets submitted from 2023 onwards must be 1.5°C aligned; older targets may be grandfathered until the next revalidation." },
      { q: "Which grid factor should I use for Scope 2?", a: "The SBTi default is location-based Scope 2 using the country grid factor. Market-based Scope 2 (with green tariffs or PPAs) may be reported additionally, but the location-based figure is what the target validation uses." },
      { q: "How much does SBTi validation cost?", a: "Validation is a fee-based service via SBTi Services Ltd. For SMEs (fewer than 500 employees) a simplified route exists at lower cost. This tool is free and produces the working draft - validation itself is separate." },
    ] as FaqItem[],
    relatedHeading: "Related guides",
    ctaHeading: "Ready to move from draft to validated target?",
    ctaBody: "VerdeIQ helps your team finalise SBTi submissions - inventory review, base-year recalculation, Scope 3 screening and target committee materials.",
    ctaAction: "Try VerdeIQ",
  },
  el: {
    methodologyHeading: "Πώς λειτουργεί το εργαλείο στόχων",
    methodologyIntro:
      "Το εργαλείο εφαρμόζει τη γραμμική απόλυτη μείωση του SBTi Corporate Net-Zero Standard στο απόθεμα εκπομπών του έτους βάσης. Υπολογίζει την απαιτούμενη μείωση για Scope 1 & 2 (και Scope 3 όπου ουσιώδες), παράγει προσχέδιο δήλωσης στόχου στη μορφή που αναγνωρίζει το SBTi, και εξάγει ολόκληρη την ετήσια τροχιά σε PDF ή CSV.",
    methodology: [
      { label: "Πρότυπο", value: "SBTi Corporate Net-Zero Standard v1.2 (Απρίλιος 2024) και Near-Term Criteria v5.1. Καλύπτει βραχυπρόθεσμους (5–10 ετών) και μακροπρόθεσμους στόχους net-zero. Οι κλαδικοί οδηγοί (FLAG, ενέργεια, κτίρια, μεταφορές) δεν μοντελοποιούνται." },
      { label: "Φιλοδοξία Scope 1 & 2", value: "1,5°C = 4,2% γραμμική απόλυτη μείωση/έτος. Well-below-2°C = 2,5%/έτος, δεκτό μόνο για παλαιότερους στόχους." },
      { label: "Κατώφλι Scope 3", value: "Κριτήριο SBTi C15: υποχρεωτικός στόχος Scope 3 όταν υπερβαίνει το 40% του συνόλου. Το εργαλείο το επισημαίνει αυτόματα." },
      { label: "Κανόνες έτους βάσης", value: "Το έτος βάσης δεν πρέπει να απέχει πάνω από 2 έτη πριν την υποβολή. Όλοι οι στόχοι είναι απόλυτοι - όχι έντασης." },
      { label: "Μακροπρόθεσμο net-zero", value: "Το SBTi απαιτεί δέσμευση για net-zero έως το 2050 το αργότερο, με 90% απόλυτη μείωση. Τα υπόλοιπα εξουδετερώνονται με μόνιμες απορροφήσεις." },
      { label: "Αποθήκευση", value: "Όλες οι καταχωρίσεις στο πρόγραμμα περιήγησης (localStorage). Εξαγωγή σε JSON ή CSV." },
    ] as MethodologyItem[],
    workedExampleHeading: "Κυπριακή εταιρεία logistics 62 ατόμων ορίζει βραχυπρόθεσμο στόχο 1,5°C",
    workedExampleBody:
      "Οδικός μεταφορέας στη Λευκωσία χρησιμοποιεί το 2024 ως έτος βάσης: Scope 1 = 480 t CO₂e (στόλος diesel), Scope 2 = 45 t CO₂e (ρεύμα αποθηκών, Κύπρος), Scope 3 = 210 t CO₂e (καύσιμα προμηθευτών + επαγγελματικά ταξίδια). Scope 3 = 29% του συνόλου, κάτω από 40%, άρα ο στόχος Scope 3 συνιστάται αλλά δεν είναι υποχρεωτικός. Ο COO επιλέγει το 2030 (6ετής ορίζοντας). Scope 1 & 2: 6 × 4,2% = 25,2% μείωση, από 525 σε 393 t CO₂e. Scope 3 στο WB2°C: 6 × 2,5% = 15%, από 210 σε 178 t CO₂e. Το προσχέδιο εξάγεται ως PDF και προωθείται στην αναθεώρηση SBTi - σύνολο χρόνου κάτω από 2 ώρες.",
    faqHeading: "SBTi - συχνές ερωτήσεις",
    faq: [
      { q: "Τι είναι επιστημονικά τεκμηριωμένος στόχος;", a: "Στόχος μείωσης GHG ευθυγραμμισμένος με το επίπεδο απανθρακοποίησης για 1,5°C. Το SBTi τον επικυρώνει με το Corporate Net-Zero Standard." },
      { q: "Πρέπει να υποβάλω τον στόχο στο SBTi;", a: "Για δημόσια χρήση της σήμανσης 'science-based' απαιτείται επικύρωση SBTi. Μπορείτε να τον υιοθετήσετε εσωτερικά χωρίς υποβολή." },
      { q: "Ποια η διαφορά βραχυπρόθεσμων και μακροπρόθεσμων στόχων;", a: "Οι βραχυπρόθεσμοι καλύπτουν 5–10 έτη. Ο μακροπρόθεσμος οδηγεί σε net-zero έως το 2050 με 90% απόλυτη μείωση." },
      { q: "Πότε είναι υποχρεωτικός στόχος Scope 3;", a: "Όταν το Scope 3 υπερβαίνει το 40% του συνόλου βάσης (κριτήριο C15)." },
      { q: "Γιατί 4,2%/έτος για 1,5°C;", a: "Παράγεται από τα σενάρια IPCC 1,5°C χωρίς υπέρβαση και εφαρμόζεται γραμμικά ως προς το έτος βάσης." },
      { q: "Ισχύει ακόμα το WB2°C;", a: "Για Scope 3 ναι - 2,5%/έτος. Για Scope 1 & 2 οι νέοι στόχοι πρέπει να είναι 1,5°C." },
      { q: "Ποιον συντελεστή Scope 2 να χρησιμοποιήσω;", a: "Την προεπιλογή SBTi: location-based με τον εθνικό συντελεστή. Η μέθοδος αγοράς αναφέρεται επιπλέον." },
      { q: "Πόσο κοστίζει η επικύρωση SBTi;", a: "Είναι υπηρεσία με τέλος μέσω SBTi Services Ltd. Για ΜμΕ υπάρχει απλοποιημένη διαδικασία σε μικρότερο κόστος." },
    ] as FaqItem[],
    relatedHeading: "Σχετικοί οδηγοί",
    ctaHeading: "Έτοιμοι για επικυρωμένο στόχο;",
    ctaBody: "Η VerdeIQ βοηθά την ομάδα σας να ολοκληρώσει την υποβολή SBTi - απόθεμα, ανασύνθεση βάσης, screening Scope 3 και υλικό επιτροπής.",
    ctaAction: "Δοκιμάστε το VerdeIQ",
  },
} as const;

export default async function SbtiTargetSetterPage({ params }: { params: Promise<{ locale: string }> }) {
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
    name: safeLocale === "el" ? "Πώς να ορίσετε βραχυπρόθεσμο στόχο SBTi" : "How to set an SBTi near-term target",
    step: [
      { "@type": "HowToStep", name: safeLocale === "el" ? "Καταχωρίστε προφίλ εταιρείας και έτος βάσης" : "Enter company profile and base year" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εισαγάγετε εκπομπές Scope 1, 2, 3" : "Enter Scope 1, 2 and 3 base-year emissions" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Επιλέξτε φιλοδοξία και έτος στόχου" : "Pick ambition level and target year" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Ελέγξτε και εξάγετε το προσχέδιο" : "Review and export the draft target" },
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
        <SbtiTargetSetter locale={safeLocale} />
      </ToolShell>
    </>
  );
}
