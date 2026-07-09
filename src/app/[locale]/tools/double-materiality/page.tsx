import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTool } from "@/data/tools";
import ToolShell, { type FaqItem, type MethodologyItem } from "@/components/tools/ToolShell";
import DoubleMaterialityMatrix from "@/components/tools/widgets/DoubleMaterialityMatrix";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");
const SLUG = "double-materiality";

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
    methodologyHeading: "How the scoring works",
    methodologyIntro:
      "Every topic is scored on two axes as required by ESRS 1 §3. The impact axis combines severity, scope and irremediability (averaged, then weighted by likelihood). The financial axis combines magnitude and likelihood. A topic becomes material when either axis crosses the threshold — the double in double materiality means either axis is enough. All maths runs client-side; nothing is stored on our servers.",
    methodology: [
      { label: "Legal basis", value: "ESRS 1 §3 Double materiality · EFRAG IG1 Materiality Assessment Implementation Guidance (May 2024)." },
      { label: "Impact score", value: "((severity + scope + irremediability) / 3) × (impact likelihood / 5). Actual & potential negative and positive impacts on people or the environment." },
      { label: "Financial score", value: "magnitude × (financial likelihood / 5). Risks and opportunities affecting the undertaking's development, performance and position." },
      { label: "Scoring scale", value: "0–5 discrete, mapped from EFRAG's qualitative descriptors. 5 = severe / significant, 0 = not applicable." },
      { label: "Threshold", value: "User-set. EFRAG does not prescribe a numeric threshold; document your rationale in the ESRS 2 IRO-1 disclosure. 2.5 is a reasonable starting cut-off across all axes." },
      { label: "Topic list", value: "Pre-loaded with the ten ESRS topical standards (E1–E5, S1–S4, G1). Add sub-topics or sector-specific issues as needed." },
      { label: "Time horizons", value: "This tool scores present state. ESRS 1 §3.6 requires short (<1yr), medium (1–5yr) and long (>5yr) horizon scoring — run three passes with saved snapshots for a full assessment." },
      { label: "Storage", value: "All scores stay in your browser. Export to CSV or print to PDF for your working papers." },
    ] as MethodologyItem[],
    workedExampleHeading: "A 200-person food processor prepares for CSRD wave 2",
    workedExampleBody:
      "A Cypriot food processor scores climate change mitigation at severity 4, scope 5, irremediability 4, likelihood 5 → impact score 4.3. Financial magnitude 4, likelihood 4 → financial score 3.2. Both cross the 2.5 threshold — climate is unambiguously material. Water & marine resources scores 3.0 impact but only 2.0 financial — material on the impact axis alone, which is exactly what double materiality is meant to catch. Business conduct scores 3.0 impact / 3.2 financial — material. The assessment produces four material topics: E1, E3, S1 own workforce, G1 business conduct — a defensible starting point for the ESRS 2 IRO-1 disclosure. Save the CSV and the PDF as working papers; the auditor will ask for the scoring rationale.",
    faqHeading: "Double materiality, answered",
    faq: [
      { q: "What is double materiality?", a: "A topic is material if it meets either an impact test (the company's impact on people and the environment is significant) OR a financial test (the topic creates a risk or opportunity that affects the company's development, performance or position). Under ESRS, either is enough." },
      { q: "Do I need this for CSRD?", a: "Yes. ESRS 1 §3 makes the double materiality assessment the entry point for the entire CSRD report. Everything you disclose under E1–G1 flows from what your assessment identifies as material." },
      { q: "Is 2.5 the right threshold?", a: "There is no legally required threshold — EFRAG deliberately left it open. 2.5 on a 0–5 scale is a common starting point. What matters is that your threshold rationale is documented and applied consistently across all topics. The assessment is auditable; the threshold logic is what auditors ask about first." },
      { q: "What if a topic is only impact-material?", a: "It is material — the assessment must cover the E1–G1 disclosures for it. That is the point of double materiality: environmental and social impacts that do not affect financial position still trigger disclosure obligations." },
      { q: "Do I have to score all ten ESRS topics?", a: "No — you can conclude a topic is not material after screening. But under ESRS 2 §54, you must document why. This tool's Monitor column is your evidence trail for non-material topics." },
      { q: "How does stakeholder engagement fit in?", a: "The scores here should reflect stakeholder input, not just the sustainability team's view. Run workshops with employees, workers in the value chain, communities, customers and NGOs, and let those views calibrate the scores. Document the engagement in your ESRS 2 SBM-2 disclosure." },
      { q: "What about sub-topics?", a: "ESRS 1 requires assessment down to the topical, sub-topical and sub-sub-topical level from the AR16 list. Add rows for the sub-topics that are candidates in your sector — this tool does not lock the taxonomy." },
      { q: "How often should I re-run the assessment?", a: "Formally every reporting year. Trigger events (major acquisition, new market, regulatory shift) require an unscheduled refresh — save prior versions before scoring." },
    ] as FaqItem[],
    relatedHeading: "Related guides",
    ctaHeading: "Ready to run the full assessment?",
    ctaBody: "VerdeIQ walks your team through the full ESRS 1 §3 workflow — stakeholder engagement, sub-topic scoring across time horizons, evidence capture and auditor-ready IRO-1 disclosures.",
    ctaAction: "Try VerdeIQ",
  },
  el: {
    methodologyHeading: "Πώς λειτουργεί η βαθμολόγηση",
    methodologyIntro:
      "Κάθε θέμα βαθμολογείται σε δύο άξονες σύμφωνα με το ESRS 1 §3. Ο άξονας επίπτωσης συνδυάζει σοβαρότητα, έκταση και μη-αναστρεψιμότητα (μέσος όρος, σταθμισμένος με πιθανότητα). Ο οικονομικός άξονας συνδυάζει μέγεθος και πιθανότητα. Ένα θέμα γίνεται ουσιώδες όταν οποιοσδήποτε άξονας ξεπερνά το κατώφλι.",
    methodology: [
      { label: "Νομική βάση", value: "ESRS 1 §3 · EFRAG IG1 Materiality Assessment Implementation Guidance (Μάιος 2024)." },
      { label: "Βαθμός επίπτωσης", value: "((σοβαρότητα + έκταση + μη-αναστρεψιμότητα) / 3) × (πιθανότητα / 5)." },
      { label: "Οικονομικός βαθμός", value: "μέγεθος × (πιθανότητα / 5)." },
      { label: "Κλίμακα", value: "0–5, βασισμένη σε ποιοτικούς χαρακτηρισμούς EFRAG." },
      { label: "Κατώφλι", value: "Ορίζεται από τον χρήστη. Το EFRAG δεν προδιαγράφει αριθμητικό κατώφλι· τεκμηριώστε τη λογική στην αποκάλυψη IRO-1." },
      { label: "Λίστα θεμάτων", value: "Προφορτωμένα τα δέκα ESRS topical standards (E1–E5, S1–S4, G1)." },
      { label: "Χρονικοί ορίζοντες", value: "ESRS 1 §3.6 απαιτεί βραχύ (<1yr), μεσοπρόθεσμο (1–5yr) και μακροπρόθεσμο (>5yr)." },
      { label: "Αποθήκευση", value: "Όλα παραμένουν στο πρόγραμμα περιήγησής σας." },
    ] as MethodologyItem[],
    workedExampleHeading: "Επεξεργαστής τροφίμων 200 ατόμων προετοιμάζεται για CSRD",
    workedExampleBody:
      "Επεξεργαστής τροφίμων στην Κύπρο βαθμολογεί την κλιματική αλλαγή με σοβαρότητα 4, έκταση 5, μη-αναστρεψιμότητα 4, πιθανότητα 5 → βαθμός επίπτωσης 4,3. Οικονομικό μέγεθος 4, πιθανότητα 4 → 3,2. Και οι δύο ξεπερνούν το 2,5 — κλιματική αλλαγή σαφώς ουσιώδης. Νερό βαθμ. 3,0 επίπτωση / 2,0 οικονομικά — ουσιώδες μόνο στον άξονα επίπτωσης. Παράγονται 4 ουσιώδη θέματα ως αφετηρία για την IRO-1.",
    faqHeading: "Συχνές ερωτήσεις",
    faq: [
      { q: "Τι είναι η διπλή ουσιαστικότητα;", a: "Ένα θέμα είναι ουσιώδες αν πληροί είτε το τεστ επίπτωσης (σημαντική επίπτωση σε ανθρώπους/περιβάλλον) είτε το οικονομικό (κίνδυνος/ευκαιρία για την επιχείρηση)." },
      { q: "Το χρειάζομαι για CSRD;", a: "Ναι — το ESRS 1 §3 το ορίζει ως αφετηρία όλης της αναφοράς CSRD." },
      { q: "Είναι σωστό το κατώφλι 2,5;", a: "Δεν υπάρχει νομικά υποχρεωτικό κατώφλι. Το 2,5 σε κλίμακα 0–5 είναι κοινή αφετηρία. Τεκμηριώστε τη λογική και εφαρμόστε τη συνεπώς." },
      { q: "Τι γίνεται αν ένα θέμα είναι μόνο ουσιώδες στην επίπτωση;", a: "Είναι ουσιώδες — απαιτούνται οι αντίστοιχες αποκαλύψεις. Αυτός είναι ο σκοπός της διπλής ουσιαστικότητας." },
      { q: "Πρέπει να βαθμολογήσω και τα 10 ESRS θέματα;", a: "Όχι — μπορείτε να καταλήξετε ότι δεν είναι ουσιώδη μετά από έλεγχο. Αλλά το ESRS 2 §54 απαιτεί τεκμηρίωση." },
      { q: "Πώς εντάσσεται η εμπλοκή ενδιαφερομένων;", a: "Οι βαθμοί εδώ πρέπει να αντικατοπτρίζουν την εμπλοκή. Οργανώστε workshops και τεκμηριώστε στην SBM-2." },
      { q: "Τι γίνεται με υπο-θέματα;", a: "Το ESRS 1 απαιτεί αξιολόγηση μέχρι το επίπεδο υπο-θεμάτων. Προσθέστε γραμμές όπως χρειάζεται." },
      { q: "Πόσο συχνά;", a: "Ετησίως — και όποτε συμβαίνει σημαντικό γεγονός (εξαγορά, νέα αγορά, ρυθμιστική αλλαγή)." },
    ] as FaqItem[],
    relatedHeading: "Σχετικοί οδηγοί",
    ctaHeading: "Έτοιμοι για την πλήρη αξιολόγηση;",
    ctaBody: "Η VerdeIQ καθοδηγεί την ομάδα σας στην πλήρη ροή ESRS 1 §3 — εμπλοκή ενδιαφερομένων, υπο-θέματα, ορίζοντες, τεκμηρίωση.",
    ctaAction: "Δοκιμάστε το VerdeIQ",
  },
} as const;

export default async function DoubleMaterialityPage({ params }: { params: Promise<{ locale: string }> }) {
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
    name: safeLocale === "el" ? "Πώς να δημιουργήσετε μήτρα διπλής ουσιαστικότητας" : "How to build a double materiality matrix",
    step: [
      { "@type": "HowToStep", name: safeLocale === "el" ? "Ορίστε το κατώφλι" : "Set the materiality threshold" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Βαθμολογήστε επιπτώσεις" : "Score the impact axis (severity, scope, irremediability, likelihood)" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Βαθμολογήστε οικονομικά" : "Score the financial axis (magnitude, likelihood)" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Προσθέστε υπο-θέματα" : "Add sector-specific topics or sub-topics" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εξάγετε PDF ή CSV" : "Export the matrix as PDF or CSV" },
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
        <DoubleMaterialityMatrix locale={safeLocale} />
      </ToolShell>
    </>
  );
}
