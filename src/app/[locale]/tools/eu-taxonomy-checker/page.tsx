import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTool } from "@/data/tools";
import ToolShell, { type FaqItem, type MethodologyItem } from "@/components/tools/ToolShell";
import EuTaxonomyChecker from "@/components/tools/widgets/EuTaxonomyChecker";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");
const SLUG = "eu-taxonomy-checker";

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
    methodologyHeading: "How eligibility is assessed",
    methodologyIntro:
      "The EU Taxonomy Regulation defines when an economic activity is 'environmentally sustainable'. Three tests apply: (1) the activity is eligible - listed in a Delegated Act; (2) it substantially contributes to at least one of the six environmental objectives without significantly harming the others; (3) minimum social safeguards under Art. 18 are met. This tool walks all three tests for the ~30 most common eligible activities and flags where you sit.",
    methodology: [
      { label: "Legal basis", value: "Regulation (EU) 2020/852 · Climate Delegated Act (Reg. 2021/2139) covers CCM & CCA · Environmental Delegated Act (Reg. 2023/2486) covers WTR, CE, PPC and BIO." },
      { label: "Eligibility", value: "An activity is eligible if it appears in Annex I or II of one of the Delegated Acts. This tool curates 30 of the most-referenced eligible activities. Not finding your NACE code here does not mean you are ineligible - check the Regulation itself." },
      { label: "Substantial contribution (SC)", value: "For each activity we surface the objectives it can contribute to. The full technical screening criteria (energy thresholds, emissions ceilings, EPC ratings) live in the underlying Delegated Acts. Confirm them before disclosing alignment." },
      { label: "Do No Significant Harm (DNSH)", value: "For the five non-primary objectives you must show the activity does not significantly harm them. The tool applies a generic DNSH question per objective - the full criteria are activity-specific and set out in each Delegated Act appendix." },
      { label: "Minimum safeguards (Art. 18)", value: "OECD Guidelines, UN Guiding Principles on Business & Human Rights, ILO core conventions, plus absence of convictions for tax evasion, corruption, competition-law breaches or human-rights violations." },
      { label: "Verdict", value: "Aligned = eligible + SC confirmed + all DNSH pass + all safeguards met. Any 'No' answer produces Not aligned. Missing answers produce Partially aligned pending completion." },
      { label: "Reporting", value: "Under Article 8, in-scope companies disclose taxonomy-eligible and taxonomy-aligned turnover, CapEx and OpEx. This tool assesses one activity at a time - the accounting split across the KPIs happens in your financials." },
    ] as MethodologyItem[],
    workedExampleHeading: "A rooftop solar installer checks alignment on a public tender",
    workedExampleBody:
      "A Cypriot construction SME is bidding for a public rooftop solar installation contract worth €800k. Under the tender scoring, taxonomy-aligned bidders receive a 5-point bonus. The team picks NACE F43.21 · CCM 7.6 (installation of renewable energy technologies) as the primary activity - substantial contribution to Climate Change Mitigation is clear. DNSH walk-through: CCA (climate adaptation) - passes, they screen physical climate risk for each rooftop site; WTR - N/A, no water impact; CE - passes, panels sourced from ISO 14001-certified manufacturers with WEEE take-back; PPC - passes, mounting hardware meets BAT-AEL; BIO - passes, no sites in Natura 2000 areas. Safeguards: all four confirmed by their group HR policy. Verdict: aligned. The tool's PDF export goes into the bid pack as annex 4B.",
    faqHeading: "EU Taxonomy, answered",
    faq: [
      { q: "Who has to report EU Taxonomy alignment?", a: "Large undertakings and PIEs already subject to NFRD, and now companies in scope of CSRD (waves 1–3). Financial market participants disclose taxonomy alignment of their products under SFDR. SMEs are not directly in scope but are increasingly asked for taxonomy data by banks and value-chain partners." },
      { q: "What is 'eligible' vs 'aligned'?", a: "Eligible = the activity appears in a Delegated Act annex. Aligned = eligible AND substantial contribution confirmed AND DNSH passes AND minimum safeguards met. You can be 100% eligible and 0% aligned if you fail DNSH." },
      { q: "How many activities are covered by the Delegated Acts?", a: "About 150 across the two Delegated Acts. This tool covers ~30 of the most-frequently-referenced ones (energy, buildings, transport, manufacturing, water, waste, R&D, insurance, biodiversity). For sector-specific activities not listed here, consult the Regulation directly." },
      { q: "What does DNSH require?", a: "For the five objectives you're NOT claiming substantial contribution to, you must demonstrate the activity does not significantly harm them. The Regulation provides objective-specific screening criteria - energy thresholds, water abstraction limits, waste-hierarchy compliance, BAT emission levels, biodiversity impact assessments." },
      { q: "What are minimum safeguards?", a: "Article 18 requires alignment with the OECD Guidelines for Multinational Enterprises, the UN Guiding Principles on Business & Human Rights (including ILO core conventions), and absence of convictions for tax, corruption, competition-law or human-rights violations. The Platform on Sustainable Finance's 2022 report is the reference for interpretation." },
      { q: "How do I prove SC without the full technical criteria?", a: "This tool identifies the objective; the full criteria (e.g. energy performance certificates, GHG intensity thresholds, water-use ratios) live in the Delegated Act. Read the criteria for your specific ref (e.g. CCM 7.1) and gather the numeric evidence before claiming alignment." },
      { q: "What if my activity is not listed?", a: "It may be listed under a different NACE mapping - search the Delegated Acts. Failing that, activities not listed are 'not eligible' under the current Regulation. Reg. 2023/2486 expanded coverage; more activities are expected in future amendments." },
      { q: "Does this tool replace legal advice?", a: "No. It is a screening aid based on the Delegated Acts as of 2024. For high-value disclosures (Art. 8 KPI reporting, taxonomy-linked debt or bond frameworks) engage qualified sustainability advisers and auditors." },
    ] as FaqItem[],
    relatedHeading: "Related guides",
    ctaHeading: "Need to go beyond screening?",
    ctaBody: "Vuneli helps you gather the technical evidence for substantial contribution, run activity-specific DNSH assessments and produce the Art. 8 KPI split across turnover, CapEx and OpEx.",
    ctaAction: "Try Vuneli",
  },
  el: {
    methodologyHeading: "Πώς αξιολογείται η επιλεξιμότητα",
    methodologyIntro:
      "Ο Κανονισμός EU Taxonomy ορίζει πότε μία οικονομική δραστηριότητα είναι 'περιβαλλοντικά βιώσιμη'. Ισχύουν τρία τεστ: επιλεξιμότητα, ουσιαστική συμβολή σε τουλάχιστον έναν από τους έξι στόχους χωρίς σημαντική βλάβη στους άλλους, και τήρηση των ελάχιστων εγγυήσεων του Άρθρου 18. Το εργαλείο τα εφαρμόζει για ~30 συνήθεις δραστηριότητες.",
    methodology: [
      { label: "Νομική βάση", value: "Κανονισμός (ΕΕ) 2020/852 · Climate Delegated Act (2021/2139) · Environmental Delegated Act (2023/2486)." },
      { label: "Επιλεξιμότητα", value: "Η δραστηριότητα εμφανίζεται σε Παράρτημα των Πράξεων. Το εργαλείο επιμελείται 30 από τις πιο συχνά αναφερόμενες." },
      { label: "Ουσιαστική συμβολή (SC)", value: "Για κάθε δραστηριότητα εμφανίζονται οι στόχοι όπου συμβάλλει· τα πλήρη τεχνικά κριτήρια στις Πράξεις κατ' εξουσιοδότηση." },
      { label: "DNSH", value: "Για τους 5 μη-κύριους στόχους, γενική ερώτηση ανά στόχο· τα πλήρη κριτήρια είναι ειδικά ανά δραστηριότητα." },
      { label: "Ελάχιστες εγγυήσεις (Άρθρο 18)", value: "OECD Guidelines, UN Guiding Principles, ILO core conventions, καμία καταδίκη." },
      { label: "Ετυμηγορία", value: "Ευθυγραμμισμένο = επιλέξιμο + SC + DNSH + εγγυήσεις. Οποιοδήποτε 'Όχι' → Μη ευθυγραμμισμένο." },
      { label: "Αναφορά", value: "Άρθρο 8: αποκάλυψη επιλέξιμου και ευθυγραμμισμένου κύκλου εργασιών, CapEx, OpEx." },
    ] as MethodologyItem[],
    workedExampleHeading: "Εγκαταστάτης Φ/Β ελέγχει ευθυγράμμιση σε δημόσιο διαγωνισμό",
    workedExampleBody:
      "Κυπριακή ΜμΕ διεκδικεί δημόσιο διαγωνισμό €800k. Επιλέγει NACE F43.21 · CCM 7.6 - ουσιαστική συμβολή σε CCM ξεκάθαρη. DNSH: CCA περνά (κλιματικός κίνδυνος οροφών), WTR Δ/Α, CE περνά (WEEE), PPC περνά, BIO περνά (χωρίς Natura 2000). Εγγυήσεις: όλες. Ετυμηγορία: ευθυγραμμισμένο. Το PDF μπαίνει στην προσφορά ως παράρτημα.",
    faqHeading: "EU Taxonomy - συχνές ερωτήσεις",
    faq: [
      { q: "Ποιος υποχρεούται;", a: "Μεγάλες επιχειρήσεις υπό NFRD/CSRD και συμμετέχοντες SFDR. Οι ΜμΕ όχι άμεσα, αλλά ολοένα περισσότερο μέσω τραπεζών και αλυσίδας αξίας." },
      { q: "Επιλέξιμο vs Ευθυγραμμισμένο;", a: "Επιλέξιμο = στη λίστα. Ευθυγραμμισμένο = επιλέξιμο ΚΑΙ SC ΚΑΙ DNSH ΚΑΙ εγγυήσεις. Μπορεί κανείς να είναι 100% επιλέξιμος και 0% ευθυγραμμισμένος." },
      { q: "Πόσες δραστηριότητες;", a: "~150 συνολικά. Το εργαλείο καλύπτει ~30 συνηθέστερες." },
      { q: "Τι απαιτεί το DNSH;", a: "Για τους 5 μη-κύριους στόχους, τεκμηρίωση ότι η δραστηριότητα δεν τους βλάπτει ουσιαστικά." },
      { q: "Ελάχιστες εγγυήσεις;", a: "OECD Guidelines, UN Guiding Principles, ILO, καμία καταδίκη· βλ. αναφορά Platform on Sustainable Finance 2022." },
      { q: "SC χωρίς πλήρη τεχνικά κριτήρια;", a: "Το εργαλείο εντοπίζει τον στόχο· διαβάστε την Πράξη για τα πλήρη κριτήρια πριν δηλώσετε ευθυγράμμιση." },
      { q: "Αν η δραστηριότητά μου δεν αναφέρεται;", a: "Πιθανή αντιστοίχιση σε άλλο NACE· ελέγξτε τις Πράξεις. Διαφορετικά, όχι επιλέξιμη υπό τον τρέχοντα Κανονισμό." },
      { q: "Αντικαθιστά νομική συμβουλή;", a: "Όχι. Είναι εργαλείο προκαταρκτικού ελέγχου. Για δεσμευτικές δημοσιοποιήσεις, συμβουλευτείτε ειδικούς." },
    ] as FaqItem[],
    relatedHeading: "Σχετικοί οδηγοί",
    ctaHeading: "Πέρα από τον προκαταρκτικό έλεγχο;",
    ctaBody: "Η Vuneli βοηθά στη συλλογή τεχνικών στοιχείων SC, στους ελέγχους DNSH ανά δραστηριότητα και στο split KPI Άρθρου 8.",
    ctaAction: "Δοκιμάστε το Vuneli",
  },
} as const;

export default async function EuTaxonomyCheckerPage({ params }: { params: Promise<{ locale: string }> }) {
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
    name: safeLocale === "el" ? "Πώς να ελέγξετε επιλεξιμότητα EU Taxonomy" : "How to check EU Taxonomy eligibility",
    step: [
      { "@type": "HowToStep", name: safeLocale === "el" ? "Βρείτε τη δραστηριότητα NACE" : "Find your NACE activity" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Επιλέξτε τον κύριο στόχο" : "Choose the primary environmental objective" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Ολοκληρώστε τους ελέγχους DNSH" : "Complete DNSH screening for the other five objectives" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Επιβεβαιώστε τις ελάχιστες εγγυήσεις" : "Confirm minimum safeguards under Art. 18" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εξάγετε την ετυμηγορία" : "Export the verdict as PDF or CSV" },
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
        <EuTaxonomyChecker locale={safeLocale} />
      </ToolShell>
    </>
  );
}
