import { makePillar } from "./_factory";

export const scienceBasedTargetsSbti = makePillar({
  slug: "science-based-targets-sbti",
  category: "standards",
  primaryKeyword: "science based targets SBTi",
  monthlyVolume: 0,
  readingMinutes: 9,
  relatedSlugs: ["net-zero-roadmap-smes","ghg-protocol-guide","carbon-offsetting-vs-reduction","csrd-reporting-guide"],
  en: {
  "title": "Science Based Targets (SBTi): How Corporate Climate Targets Get Validated",
  "metaTitle": "SBTi Explained — Science Based Targets 2026 Guide",
  "metaDescription": "SBTi in plain terms: what the initiative validates, the SME route, near-term vs. net-zero targets, and common submission mistakes.",
  "heroEyebrow": "Standards Guide",
  "heroSubtitle": "The Science Based Targets initiative validates corporate climate targets against 1.5°C climate science. Here's how the process works.",
  "tocLabel": "On this page",
  "introduction": [
    "The Science Based Targets initiative (SBTi) is a partnership between CDP, UN Global Compact, WRI, and WWF. It validates that a company's climate targets are aligned with limiting warming to 1.5°C.",
    "Over 8,000 companies have committed as of 2026. This guide covers what SBTi actually validates, the SME shortcut, and how to avoid the common submission failures."
  ],
  "sections": [
    {
      "heading": "What SBTi validates",
      "body": [
        "Near-term targets (5–10 year horizon): typically 42% absolute reduction of Scope 1+2 by 2030 versus 2019. Scope 3 target required if it exceeds 40% of total emissions.",
        "Net-zero targets (2050 or earlier): >90% reduction across all scopes with residuals neutralized by permanent removals. Interim milestones required."
      ]
    },
    {
      "heading": "The SME route",
      "body": [
        "For companies with <250 employees and outside high-impact sectors, SBTi offers a streamlined route: pre-approved target language, single-step validation, fixed low fee (~$1,000). No Scope 3 target required. Approval typically inside 60 days."
      ]
    },
    {
      "heading": "Common submission mistakes",
      "body": [
        "Setting an intensity target when SBTi requires absolute. Missing the Scope 3 threshold check. Using a base year without documented data quality. Committing to renewables without a specific instrument (PPA, GO, on-site)."
      ]
    }
  ],
  "keyTakeaways": [
    "SBTi validates targets against 1.5°C science.",
    "Near-term: 42% Scope 1+2 by 2030; Scope 3 if >40% of total.",
    "SME route: streamlined, ~$1,000, no Scope 3.",
    "Absolute targets, not intensity, unless justified."
  ],
  "faq": [
    {
      "q": "Is SBTi mandatory?",
      "a": "No. But it's the credibility standard many customers, banks, and investors now expect."
    },
    {
      "q": "How long does validation take?",
      "a": "SME route: ~60 days. Standard route: 6–9 months including revisions."
    },
    {
      "q": "Can I use offsets to meet SBTi targets?",
      "a": "No. Offsets do not count toward SBTi reductions. Removals count only against residual emissions in net-zero targets."
    }
  ],
  "ctaHeading": "SBTi-ready targets from day one",
  "ctaBody": "Vuneli builds SBTi-compatible baselines and target proposals with the correct base-year handling and scope coverage."
},
  el: {
  "title": "Science Based Targets (SBTi): Πώς Επικυρώνονται οι Εταιρικοί Κλιματικοί Στόχοι",
  "metaTitle": "SBTi — Οδηγός 2026",
  "metaDescription": "SBTi απλά: τι επικυρώνει, SME route, στόχοι, συνηθισμένα λάθη.",
  "heroEyebrow": "Πρότυπα",
  "heroSubtitle": "Η SBTi επικυρώνει εταιρικούς κλιματικούς στόχους έναντι 1.5°C.",
  "tocLabel": "Σε αυτή τη σελίδα",
  "introduction": [
    "Η SBTi είναι σύμπραξη CDP, UN Global Compact, WRI, WWF. Πάνω από 8.000 εταιρείες έχουν δεσμευτεί.",
    "Εδώ τι επικυρώνει, η SME συντόμευση, και τα λάθη."
  ],
  "sections": [
    {
      "heading": "Τι επικυρώνει η SBTi",
      "body": [
        "Βραχυπρόθεσμοι στόχοι (5–10 έτη): 42% μείωση Scope 1+2 έως 2030 vs 2019. Scope 3 αν >40%.",
        "Net-zero (2050): >90% μείωση + απομάκρυνση υπολειπόμενων."
      ]
    },
    {
      "heading": "Η SME route",
      "body": [
        "<250 εργαζόμενοι εκτός υψηλού αντικτύπου: pre-approved, single-step, ~$1,000, χωρίς Scope 3, ~60 μέρες."
      ]
    },
    {
      "heading": "Συνήθη λάθη",
      "body": [
        "Intensity αντί absolute. Παράλειψη ελέγχου Scope 3 threshold. Έλλειψη ποιότητας δεδομένων βάσης."
      ]
    }
  ],
  "keyTakeaways": [
    "Επικύρωση έναντι 1.5°C.",
    "42% Scope 1+2 έως 2030.",
    "SME route ~$1,000.",
    "Absolute αντί intensity."
  ],
  "faq": [
    {
      "q": "Υποχρεωτική;",
      "a": "Όχι, αλλά standard αξιοπιστίας."
    },
    {
      "q": "Χρόνος;",
      "a": "SME 60 μέρες, standard 6–9 μήνες."
    },
    {
      "q": "Offsets;",
      "a": "Δεν μετρούν."
    }
  ],
  "ctaHeading": "Στόχοι SBTi-ready από την πρώτη μέρα",
  "ctaBody": "Η Vuneli χτίζει βάσεις SBTi-συμβατές."
},
});
