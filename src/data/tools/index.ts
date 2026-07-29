/**
 * Vuneli interactive tools registry.
 *
 * Each tool ships as a full-page route under /[locale]/tools/{slug}.
 * `available: false` tools appear on the hub as "coming soon" and are
 * intentionally omitted from the sitemap until built.
 */

export type ToolCategory = "carbon" | "cbam" | "csrd" | "vsme" | "taxonomy";

export type Locale = "en" | "el";

export type ToolLocaleContent = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Card blurb shown on the hub grid. */
  cardDescription: string;
};

export type ToolEntry = {
  slug: string;
  category: ToolCategory;
  /** Whether the route is built. Hub badges the rest as "coming soon". */
  available: boolean;
  /** Primary keyword targeted, for internal reference. */
  primaryKeyword: string;
  /** Pillar slugs to cross-link at the bottom of the tool page. */
  relatedPillars: string[];
  /** Absolute-from-public path — used for hero + og:image. */
  heroImage: string;
  updatedAt: string;
  en: ToolLocaleContent;
  el: ToolLocaleContent;
};

export const TOOLS: ToolEntry[] = [
  {
    slug: "ghg-calculator",
    category: "carbon",
    available: true,
    primaryKeyword: "ghg calculator",
    relatedPillars: [
      "scope-1-2-3-emissions",
      "ghg-protocol-guide",
      "carbon-accounting-for-smes",
    ],
    heroImage: "/assets/tools/ghg-calculator/hero.jpg",
    updatedAt: "2026-07-01",
    en: {
      metaTitle: "GHG Calculator — Free Scope 1, 2 & 3 Emissions Tool | Vuneli",
      metaDescription:
        "Free GHG Protocol calculator for Scope 1, 2 and 3 emissions. Country-specific grid factors, PDF export, no signup. Built for SME sustainability leads and CFOs.",
      eyebrow: "GHG Protocol · Free · No signup",
      title: "GHG emissions calculator — Scope 1, 2 & 3",
      subtitle:
        "Estimate your organisation's annual footprint across all three scopes using GHG Protocol methodology and country-specific 2024 grid factors. Export as PDF or CSV.",
      cardDescription:
        "Scope 1, 2 and 3 estimator with country grid factors, per-category breakdown and one-click PDF export.",
    },
    el: {
      metaTitle: "Υπολογιστής GHG — Δωρεάν εργαλείο Scope 1, 2 & 3 | Vuneli",
      metaDescription:
        "Δωρεάν υπολογιστής GHG Protocol για εκπομπές Scope 1, 2 και 3. Συντελεστές δικτύου ανά χώρα, εξαγωγή PDF, χωρίς εγγραφή.",
      eyebrow: "GHG Protocol · Δωρεάν · Χωρίς εγγραφή",
      title: "Υπολογιστής εκπομπών GHG — Scope 1, 2 & 3",
      subtitle:
        "Εκτιμήστε το ετήσιο αποτύπωμα του οργανισμού σας και στα τρία scopes με μεθοδολογία GHG Protocol και συντελεστές δικτύου 2024 ανά χώρα. Εξαγωγή σε PDF ή CSV.",
      cardDescription:
        "Εκτιμητής Scope 1, 2 και 3 με συντελεστές ανά χώρα, ανάλυση ανά κατηγορία και εξαγωγή PDF με ένα κλικ.",
    },
  },
  {
    slug: "cbam-report-generator",
    category: "cbam",
    available: true,
    primaryKeyword: "cbam report",
    relatedPillars: ["cbam-explained", "cbam-cyprus"],
    heroImage: "/assets/tools/cbam-report-generator/hero.jpg",
    updatedAt: "2026-07-09",
    en: {
      metaTitle: "CBAM Report Generator — Free Quarterly Report Tool | Vuneli",
      metaDescription:
        "Free CBAM quarterly report generator. Aggregate CN-code goods, embedded emissions and country data into a compliant draft. No signup.",
      eyebrow: "CBAM · Definitive phase ready",
      title: "CBAM quarterly report generator",
      subtitle:
        "Aggregate CN-code imports, embedded emissions and country of origin into a draft CBAM quarterly report ready for the Transitional Registry.",
      cardDescription:
        "Aggregate CN-code imports and embedded emissions into a compliant CBAM quarterly report draft.",
    },
    el: {
      metaTitle: "Δημιουργός Αναφοράς CBAM — Δωρεάν εργαλείο | Vuneli",
      metaDescription:
        "Δωρεάν δημιουργός τριμηνιαίας αναφοράς CBAM. Συγκέντρωση CN-κωδικών, ενσωματωμένων εκπομπών και δεδομένων ανά χώρα.",
      eyebrow: "CBAM · Έτοιμο για οριστική φάση",
      title: "Δημιουργός τριμηνιαίας αναφοράς CBAM",
      subtitle:
        "Συγκέντρωση εισαγωγών ανά CN-κωδικό, ενσωματωμένων εκπομπών και χώρας προέλευσης σε προσχέδιο αναφοράς CBAM.",
      cardDescription:
        "Προσχέδιο συμμορφούμενης τριμηνιαίας αναφοράς CBAM από CN-κωδικούς και εκπομπές.",
    },
  },
  {
    slug: "double-materiality",
    category: "csrd",
    available: true,
    primaryKeyword: "double materiality matrix",
    relatedPillars: ["double-materiality-assessment", "csrd-reporting-guide", "esrs-standards-explained"],
    heroImage: "/assets/tools/double-materiality/hero.jpg",
    updatedAt: "2026-07-09",
    en: {
      metaTitle: "Double Materiality Matrix — Free CSRD Assessment Tool | Vuneli",
      metaDescription:
        "Interactive double materiality assessment tool for CSRD. Score IROs, plot the matrix, export ESRS-ready results. Free, no signup.",
      eyebrow: "CSRD · ESRS-ready",
      title: "Double materiality matrix builder",
      subtitle:
        "Score impacts, risks and opportunities, plot the 2×2 matrix and export an ESRS-ready double materiality assessment.",
      cardDescription:
        "Score IROs, plot the 2×2 matrix and export an ESRS-ready CSRD assessment.",
    },
    el: {
      metaTitle: "Μήτρα Διπλής Ουσιαστικότητας — Δωρεάν εργαλείο CSRD | Vuneli",
      metaDescription:
        "Διαδραστικό εργαλείο διπλής ουσιαστικότητας για CSRD. Βαθμολόγηση IROs, χάραξη μήτρας, εξαγωγή αποτελεσμάτων.",
      eyebrow: "CSRD · Έτοιμο για ESRS",
      title: "Κατασκευαστής μήτρας διπλής ουσιαστικότητας",
      subtitle:
        "Βαθμολογήστε επιπτώσεις, κινδύνους και ευκαιρίες, χαράξτε τη μήτρα και εξάγετε αξιολόγηση CSRD.",
      cardDescription:
        "Βαθμολόγηση IROs, χάραξη μήτρας 2×2 και εξαγωγή αξιολόγησης CSRD.",
    },
  },
  {
    slug: "vsme-template",
    category: "vsme",
    available: true,
    primaryKeyword: "vsme template",
    relatedPillars: ["vsme-reporting-guide", "sustainability-reporting-eu"],
    heroImage: "/assets/tools/vsme-template/hero.jpg",
    updatedAt: "2026-07-09",
    en: {
      metaTitle: "VSME Reporting Template — Free EFRAG Basic Module Tool | Vuneli",
      metaDescription:
        "Free VSME reporting template matching the EFRAG Voluntary SME standard. Guided form, branded PDF export. No signup.",
      eyebrow: "EFRAG VSME · Basic Module",
      title: "VSME reporting template builder",
      subtitle:
        "Guided walkthrough of the EFRAG Voluntary SME Basic Module — disclosure by disclosure, exported as a branded PDF.",
      cardDescription:
        "Guided EFRAG VSME Basic Module walkthrough with branded PDF export.",
    },
    el: {
      metaTitle: "Πρότυπο Αναφοράς VSME — Δωρεάν εργαλείο EFRAG | Vuneli",
      metaDescription:
        "Δωρεάν πρότυπο αναφοράς VSME σύμφωνα με το EFRAG. Καθοδηγούμενη φόρμα, εξαγωγή PDF. Χωρίς εγγραφή.",
      eyebrow: "EFRAG VSME · Βασική Ενότητα",
      title: "Κατασκευαστής προτύπου αναφοράς VSME",
      subtitle:
        "Καθοδηγούμενη διαδρομή στη Βασική Ενότητα VSME του EFRAG — αποκάλυψη προς αποκάλυψη.",
      cardDescription:
        "Καθοδηγούμενη Βασική Ενότητα EFRAG VSME με εξαγωγή PDF.",
    },
  },
  {
    slug: "eu-taxonomy-checker",
    category: "taxonomy",
    available: true,
    primaryKeyword: "eu taxonomy tool",
    relatedPillars: ["eu-taxonomy-explained", "sustainability-reporting-eu"],
    heroImage: "/assets/tools/eu-taxonomy-checker/hero.jpg",
    updatedAt: "2026-07-09",
    en: {
      metaTitle: "EU Taxonomy Eligibility Checker — Free NACE Tool | Vuneli",
      metaDescription:
        "Check EU Taxonomy eligibility by NACE code. Substantial contribution, DNSH and minimum safeguards checklist. Free.",
      eyebrow: "EU Taxonomy · NACE-based",
      title: "EU Taxonomy eligibility checker",
      subtitle:
        "Look up your NACE activity, check eligibility against the six environmental objectives, walk the DNSH checklist.",
      cardDescription:
        "NACE-based eligibility, DNSH checklist and minimum safeguards guidance.",
    },
    el: {
      metaTitle: "Έλεγχος Επιλεξιμότητας EU Taxonomy — Δωρεάν εργαλείο | Vuneli",
      metaDescription:
        "Έλεγχος επιλεξιμότητας EU Taxonomy ανά κωδικό NACE. Ουσιαστική συμβολή, DNSH και ελάχιστες εγγυήσεις.",
      eyebrow: "EU Taxonomy · Βάσει NACE",
      title: "Έλεγχος επιλεξιμότητας EU Taxonomy",
      subtitle:
        "Αναζητήστε τη δραστηριότητα NACE, ελέγξτε επιλεξιμότητα και ακολουθήστε τη λίστα DNSH.",
      cardDescription:
        "Επιλεξιμότητα NACE, λίστα DNSH και οδηγίες ελάχιστων εγγυήσεων.",
    },
  },
  {
    slug: "sbti-target-setter",
    category: "carbon",
    available: true,
    primaryKeyword: "sbti target setter",
    relatedPillars: [
      "science-based-targets-sbti",
      "net-zero-roadmap-smes",
      "ghg-protocol-guide",
    ],
    heroImage: "/assets/tools/sbti-target-setter/hero.jpg",
    updatedAt: "2026-07-09",
    en: {
      metaTitle: "SBTi Target Setter — Free Science-Based Target Tool | Vuneli",
      metaDescription:
        "Free SBTi target-setting tool. Enter base-year Scope 1, 2 and 3 emissions, pick ambition, get a 1.5°C-aligned near-term target and net-zero pathway. No signup.",
      eyebrow: "SBTi · Net-Zero Standard v1.2",
      title: "SBTi target setter — near-term & net-zero",
      subtitle:
        "Convert your base-year emissions into an SBTi-aligned near-term target and long-term net-zero pathway using the Corporate Net-Zero Standard's linear contraction method. Bilingual guided form, PDF export, no signup.",
      cardDescription:
        "1.5°C-aligned near-term target and 2050 net-zero pathway from your base-year Scope 1, 2 and 3 emissions.",
    },
    el: {
      metaTitle: "Εργαλείο SBTi — Δωρεάν επιστημονικός στόχος | Vuneli",
      metaDescription:
        "Δωρεάν εργαλείο SBTi. Εισαγάγετε Scope 1, 2, 3 έτους βάσης, επιλέξτε φιλοδοξία, λάβετε στόχο 1,5°C και τροχιά net-zero. Χωρίς εγγραφή.",
      eyebrow: "SBTi · Net-Zero Standard v1.2",
      title: "Εργαλείο SBTi — βραχυπρόθεσμος στόχος & net-zero",
      subtitle:
        "Μετατρέψτε τις εκπομπές έτους βάσης σε ευθυγραμμισμένο με SBTi βραχυπρόθεσμο στόχο και μακροπρόθεσμη τροχιά net-zero, με γραμμική μείωση κατά το Corporate Net-Zero Standard.",
      cardDescription:
        "Στόχος 1,5°C και τροχιά net-zero 2050 από τις εκπομπές Scope 1, 2, 3 του έτους βάσης.",
    },
  },
  {
    slug: "report-visuals",
    category: "csrd",
    available: true,
    primaryKeyword: "sustainability report generator demo",
    relatedPillars: [
      "csrd-reporting-guide",
      "vsme-reporting-guide",
      "sustainability-kpis-for-smes",
    ],
    heroImage: "/assets/tools/report-visuals/hero.jpg",
    updatedAt: "2026-07-09",
    en: {
      metaTitle: "Demo Report Visuals — AI Sustainability Report Generator | Vuneli",
      metaDescription:
        "Interactive demo of Vuneli's AI sustainability report generator. Enter company details and generate a full narrative sustainability report with charts, KPIs and CSRD-ready structure.",
      eyebrow: "AI · CSRD-ready · Interactive demo",
      title: "Demo report visuals — AI-generated sustainability report",
      subtitle:
        "Try the report engine that powers Vuneli: enter your company, sector and reporting period and receive a full narrative sustainability report with KPIs, charts and CSRD/VSME-aligned structure — in seconds.",
      cardDescription:
        "Interactive demo of the AI sustainability report generator — narrative, KPIs, charts and CSRD-ready structure from a short intake form.",
    },
    el: {
      metaTitle: "Demo Report Visuals — Δημιουργός αναφορών βιωσιμότητας AI | Vuneli",
      metaDescription:
        "Διαδραστικό demo της γεννήτριας αναφορών βιωσιμότητας Vuneli. Εισαγάγετε στοιχεία εταιρείας και λάβετε πλήρη αναφορά με γραφήματα, KPIs και δομή έτοιμη για CSRD.",
      eyebrow: "AI · Έτοιμο για CSRD · Διαδραστικό demo",
      title: "Demo report visuals — αναφορά βιωσιμότητας με AI",
      subtitle:
        "Δοκιμάστε τη μηχανή αναφορών της Vuneli: εισαγάγετε εταιρεία, κλάδο και περίοδο και λάβετε πλήρη αναφορά βιωσιμότητας με KPIs, γραφήματα και δομή CSRD/VSME — σε δευτερόλεπτα.",
      cardDescription:
        "Διαδραστικό demo της AI γεννήτριας αναφορών βιωσιμότητας — αφήγηση, KPIs, γραφήματα και δομή CSRD από μία σύντομη φόρμα.",
    },
  },
];

export const TOOL_SLUGS = TOOLS.map((t) => t.slug);
export const AVAILABLE_TOOL_SLUGS = TOOLS.filter((t) => t.available).map((t) => t.slug);

export function getTool(slug: string) {
  return TOOLS.find((t) => t.slug === slug);
}

export const CATEGORY_META: Record<
  ToolCategory,
  { en: { label: string; description: string }; el: { label: string; description: string } }
> = {
  carbon: {
    en: { label: "Carbon accounting", description: "Measure Scope 1, 2 and 3 emissions." },
    el: { label: "Λογιστική άνθρακα", description: "Μέτρηση εκπομπών Scope 1, 2 και 3." },
  },
  cbam: {
    en: { label: "CBAM", description: "Carbon border adjustment reporting." },
    el: { label: "CBAM", description: "Αναφορές συνοριακής προσαρμογής άνθρακα." },
  },
  csrd: {
    en: { label: "CSRD & ESRS", description: "Materiality and disclosure workflow." },
    el: { label: "CSRD & ESRS", description: "Ροή ουσιαστικότητας και αποκάλυψης." },
  },
  vsme: {
    en: { label: "VSME", description: "Voluntary reporting for small and medium enterprises." },
    el: { label: "VSME", description: "Εθελοντική αναφορά για ΜμΕ." },
  },
  taxonomy: {
    en: { label: "EU Taxonomy", description: "Eligibility and DNSH." },
    el: { label: "EU Taxonomy", description: "Επιλεξιμότητα και DNSH." },
  },
};
