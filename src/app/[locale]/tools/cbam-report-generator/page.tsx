import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTool } from "@/data/tools";
import ToolShell, { type FaqItem, type MethodologyItem } from "@/components/tools/ToolShell";
import CbamReportGenerator from "@/components/tools/widgets/CbamReportGenerator";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");
const SLUG = "cbam-report-generator";

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
      siteName: "Vuneli",
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
    methodologyHeading: "How the report is built",
    methodologyIntro:
      "Every goods line multiplies the reported quantity by an embedded-emission factor (direct and indirect) and, if entered, deducts the effective carbon price already paid in the country of origin. Default factors are the European Commission's transitional-period fallbacks; from January 2026 only actual verified data is accepted. The XML export mirrors the Transitional Registry data model so you can validate the shape before you file.",
    methodology: [
      { label: "Legal basis", value: "Regulation (EU) 2023/956 (CBAM) · Commission Implementing Regulation (EU) 2023/1773 · Annex I in-scope CN codes." },
      { label: "Sectors covered", value: "Cement, iron & steel, aluminium, fertilisers, hydrogen, electricity - the six in-scope Annex I sectors." },
      { label: "Default embedded emissions", value: "DG TAXUD default values, February 2024 update. Permitted only during the transitional period (until 31 Dec 2025 for most goods)." },
      { label: "Reporting periodicity", value: "Quarterly during the transitional period (submitted within one month of quarter-end); annual CBAM declaration from 31 May 2027 for 2026 imports." },
      { label: "Indirect emissions", value: "In scope for cement, fertilisers, hydrogen and - from 2026 - some iron & steel goods per Annex III." },
      { label: "Effective carbon price", value: "Deducted per Article 9 - must be evidenced by a verified statement from the country of origin's carbon-pricing authority." },
      { label: "XML shape", value: "Aligns with the CBAM Transitional Registry quarterly report data model (v1). Draft namespace - do not submit directly; upload via the official Registry." },
      { label: "Storage", value: "All values stay in your browser. Nothing is uploaded to Vuneli." },
    ] as MethodologyItem[],
    workedExampleHeading: "A Cyprus construction group importing rebar and cement",
    workedExampleBody:
      "A Cyprus contractor imports 500 t of hot-rolled steel bars (CN 7208) from Türkiye and 800 t of Portland cement (CN 2523 29 00) from Egypt in Q1. Applying the default factors - 2.22 tCO₂e/t direct for steel, 0.677 tCO₂e/t for cement - direct embedded emissions are 1,110 t + 541.6 t = 1,651.6 tCO₂e. Cement also carries indirect emissions (0.048 tCO₂e/t × 800 t = 38.4 t). Total quarterly embedded emissions: ~1,690 tCO₂e. At an EU ETS reference of €80/tCO₂e, the notional definitive-period liability is ~€135,000 - enough to change sourcing decisions. Switching cement to a European electric-arc supplier with actual verified data of 0.42 tCO₂e/t drops the cement line from 580 t to 336 t of embedded emissions.",
    faqHeading: "CBAM reporting, answered",
    faq: [
      { q: "Who needs to file a CBAM report?", a: "Any EU importer (reporting declarant) placing in-scope Annex I goods into free circulation, or an indirect customs representative acting on their behalf. During the transitional period (Oct 2023 – Dec 2025), only quarterly reports are required - no financial obligation yet." },
      { q: "Which goods are in scope?", a: "Cement, iron & steel, aluminium, fertilisers, hydrogen and electricity. The full CN-code list is in Annex I of Regulation (EU) 2023/956 - this tool includes the most-imported codes across all six sectors." },
      { q: "Can I still use default embedded-emission values?", a: "Only during the transitional period. From 1 January 2026, importers must use actual verified emissions from the installation of origin. Missing data will trigger the highest 10 percentile of installations in the country of origin - significantly more expensive than defaults." },
      { q: "What about the carbon price already paid abroad?", a: "Article 9 lets you deduct the effective carbon price already paid in the country of origin, provided you have a verified statement from that country's carbon-pricing authority. Enter the €/tCO₂e paid - this tool multiplies by embedded emissions and shows the net position." },
      { q: "Is the XML export a valid submission?", a: "No - it is a working draft that mirrors the Transitional Registry v1 data model to help you validate structure and completeness. Actual submission must be made via the official CBAM Transitional Registry portal." },
      { q: "Do indirect emissions count?", a: "For cement, fertilisers and hydrogen, yes. For iron & steel and aluminium, only direct emissions count during the transitional period. From 2026 onwards, indirect emissions are added for some iron & steel goods (Annex III)." },
      { q: "How do I get actual verified data from my supplier?", a: "Request the CBAM Communication Template (published by the European Commission) from every installation supplying you. It must be verified by an accredited verifier from 2026 - start collecting now: verifier capacity is already tight." },
      { q: "How does this map to Vuneli?", a: "Vuneli automates the flow: supplier data collection with the CBAM Communication Template, verification workflows, quarterly aggregation, evidence trails and multi-installation consolidation. This tool is the manual version of one quarter." },
    ] as FaqItem[],
    relatedHeading: "Related guides",
    ctaHeading: "Ready to manage CBAM at scale?",
    ctaBody: "Vuneli collects verified supplier data, aggregates installations, produces audit-ready evidence trails and submits directly into the CBAM Transitional Registry.",
    ctaAction: "Try Vuneli",
  },
  el: {
    methodologyHeading: "Πώς κατασκευάζεται η αναφορά",
    methodologyIntro:
      "Κάθε γραμμή εμπορευμάτων πολλαπλασιάζει την ποσότητα με τους συντελεστές ενσωματωμένων εκπομπών (άμεσων και έμμεσων) και αφαιρεί την πραγματική τιμή άνθρακα που καταβλήθηκε στη χώρα προέλευσης. Οι προεπιλεγμένες τιμές ισχύουν μόνο στη μεταβατική περίοδο· από τον Ιανουάριο 2026 απαιτούνται πραγματικά επαληθευμένα δεδομένα.",
    methodology: [
      { label: "Νομική βάση", value: "Κανονισμός (ΕΕ) 2023/956 · Εκτελεστικός Κανονισμός (ΕΕ) 2023/1773 · CN κωδικοί Annex I." },
      { label: "Τομείς", value: "Τσιμέντο, σίδηρος & χάλυβας, αλουμίνιο, λιπάσματα, υδρογόνο, ηλεκτρισμός." },
      { label: "Προεπιλεγμένες τιμές", value: "DG TAXUD default values, Φεβ 2024 - μόνο μεταβατική περίοδος." },
      { label: "Περιοδικότητα", value: "Τριμηνιαία στη μεταβατική περίοδο· ετήσια δήλωση από 31 Μαΐου 2027." },
      { label: "Έμμεσες εκπομπές", value: "Στο πεδίο για τσιμέντο, λιπάσματα, υδρογόνο." },
      { label: "Τιμή άνθρακα", value: "Άρθρο 9 - απαιτείται επαληθευμένη δήλωση από τη χώρα προέλευσης." },
      { label: "Δομή XML", value: "Ευθυγραμμισμένη με το μοντέλο δεδομένων του Transitional Registry v1." },
      { label: "Αποθήκευση", value: "Όλα τα δεδομένα παραμένουν στο πρόγραμμα περιήγησής σας." },
    ] as MethodologyItem[],
    workedExampleHeading: "Κυπριακός όμιλος κατασκευών με εισαγωγές χάλυβα και τσιμέντου",
    workedExampleBody:
      "Ένας Κύπριος εργολάβος εισάγει 500 t χάλυβα (CN 7208) από Τουρκία και 800 t τσιμέντου (CN 2523 29 00) από Αίγυπτο σε ένα τρίμηνο. Με τους προεπιλεγμένους συντελεστές - 2,22 tCO₂e/t άμεσες για χάλυβα, 0,677 για τσιμέντο - οι άμεσες ενσωματωμένες εκπομπές είναι 1.110 t + 541,6 t = 1.651,6 tCO₂e. Το τσιμέντο έχει επίσης έμμεσες (0,048 × 800 = 38,4 t). Σύνολο ~1.690 tCO₂e. Σε τιμή EU ETS €80/t, η θεωρητική υποχρέωση είναι ~€135.000 - αρκετή για να αλλάξει η προμήθεια.",
    faqHeading: "Συχνές ερωτήσεις CBAM",
    faq: [
      { q: "Ποιος πρέπει να υποβάλει αναφορά CBAM;", a: "Κάθε εισαγωγέας στην ΕΕ που εισάγει εμπορεύματα Annex I για ελεύθερη κυκλοφορία, ή έμμεσος τελωνειακός αντιπρόσωπος. Στη μεταβατική περίοδο (Οκτ 2023 – Δεκ 2025) απαιτούνται μόνο τριμηνιαίες αναφορές." },
      { q: "Ποια εμπορεύματα καλύπτονται;", a: "Τσιμέντο, σίδηρος & χάλυβας, αλουμίνιο, λιπάσματα, υδρογόνο, ηλεκτρισμός - πλήρης λίστα στο Annex I του Κανονισμού 2023/956." },
      { q: "Μπορώ να χρησιμοποιώ προεπιλεγμένες τιμές;", a: "Μόνο μέχρι 31 Δεκ 2025. Από 1 Ιαν 2026 απαιτούνται πραγματικά επαληθευμένα δεδομένα από την εγκατάσταση προέλευσης." },
      { q: "Πώς αφαιρώ την τιμή άνθρακα που καταβλήθηκε στο εξωτερικό;", a: "Άρθρο 9 - απαιτείται επαληθευμένη δήλωση από την αρχή τιμολόγησης άνθρακα της χώρας προέλευσης. Εισάγετε €/tCO₂e και το εργαλείο υπολογίζει την καθαρή θέση." },
      { q: "Είναι το XML έγκυρο για υποβολή;", a: "Όχι - είναι προσχέδιο εργασίας. Η επίσημη υποβολή γίνεται μέσω του CBAM Transitional Registry portal." },
      { q: "Μετρούν οι έμμεσες εκπομπές;", a: "Για τσιμέντο, λιπάσματα, υδρογόνο ναι. Για χάλυβα/αλουμίνιο μόνο άμεσες στη μεταβατική περίοδο." },
      { q: "Πώς παίρνω δεδομένα από προμηθευτή;", a: "Ζητήστε το CBAM Communication Template από κάθε εγκατάσταση. Θα πρέπει να επαληθεύεται από διαπιστευμένο επαληθευτή από το 2026 - ξεκινήστε τώρα." },
      { q: "Πώς αντιστοιχεί στη Vuneli;", a: "Η Vuneli αυτοματοποιεί συλλογή δεδομένων προμηθευτών, ροές επαλήθευσης, τριμηνιαία συγκέντρωση και υποβολή στο Transitional Registry." },
    ] as FaqItem[],
    relatedHeading: "Σχετικοί οδηγοί",
    ctaHeading: "Έτοιμοι για CBAM σε κλίμακα;",
    ctaBody: "Η Vuneli συλλέγει επαληθευμένα δεδομένα προμηθευτών, συγκεντρώνει εγκαταστάσεις και υποβάλλει απευθείας στο CBAM Transitional Registry.",
    ctaAction: "Δοκιμάστε το Vuneli",
  },
} as const;

export default async function CbamReportGeneratorPage({ params }: { params: Promise<{ locale: string }> }) {
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
    publisher: { "@type": "Organization", name: "Vuneli", url: SITE_URL },
    image: heroUrl,
  };
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: safeLocale === "el" ? "Πώς να δημιουργήσετε μια τριμηνιαία αναφορά CBAM" : "How to draft a CBAM quarterly report",
    step: [
      { "@type": "HowToStep", name: safeLocale === "el" ? "Επιλέξτε τρίμηνο και έτος" : "Pick the reporting quarter and year" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εισάγετε στοιχεία εισαγωγέα (EORI)" : "Enter reporting declarant details (EORI)" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Προσθέστε κάθε CN κωδικό εισαγωγής" : "Add each imported CN code line" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Αντικαταστήστε προεπιλεγμένους συντελεστές" : "Override defaults with verified factors where available" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εξάγετε XML ή PDF" : "Export as XML draft or PDF" },
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
      { "@type": "ListItem", position: 1, name: "Vuneli", item: `${SITE_URL}/${safeLocale}` },
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
        <CbamReportGenerator locale={safeLocale} />
      </ToolShell>
    </>
  );
}
