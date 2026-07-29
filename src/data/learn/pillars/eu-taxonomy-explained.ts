import { makePillar } from "./_factory";

export const euTaxonomyExplained = makePillar({
  slug: "eu-taxonomy-explained",
  category: "esg",
  primaryKeyword: "EU Taxonomy",
  monthlyVolume: 0,
  readingMinutes: 9,
  relatedSlugs: ["csrd-reporting-guide","sustainability-reporting-eu","esrs-standards-explained","esg-reporting-software"],
  en: {
  "title": "The EU Taxonomy Explained: Classification System for Sustainable Activities",
  "metaTitle": "EU Taxonomy Explained 2026 — Alignment, Eligibility, KPIs",
  "metaDescription": "How the EU Taxonomy classifies sustainable economic activities: six environmental objectives, alignment vs. eligibility, KPIs, and reporting obligations.",
  "heroEyebrow": "Regulatory Guide",
  "heroSubtitle": "The EU Taxonomy is the classification system that decides what counts as 'green'. Here's how it works and where it bites.",
  "tocLabel": "On this page",
  "introduction": [
    "The EU Taxonomy Regulation defines which economic activities are environmentally sustainable. It underpins CSRD's environmental disclosures, SFDR's Article 8/9 product categorization, and the EU Green Bond Standard.",
    "This guide covers the six environmental objectives, the difference between eligibility and alignment, and the mandatory KPIs reporters disclose."
  ],
  "sections": [
    {
      "heading": "Six environmental objectives",
      "body": [
        "Climate change mitigation. Climate change adaptation. Sustainable use and protection of water and marine resources. Transition to a circular economy. Pollution prevention and control. Protection and restoration of biodiversity and ecosystems."
      ]
    },
    {
      "heading": "Eligibility vs. alignment",
      "body": [
        "An activity is eligible if it is listed in the Taxonomy delegated acts (~200 activities across sectors). It is aligned if it also (a) makes a substantial contribution to at least one objective, (b) does no significant harm (DNSH) to the others, and (c) meets minimum social safeguards."
      ]
    },
    {
      "heading": "Mandatory KPIs",
      "body": [
        "Non-financial undertakings disclose Taxonomy-alignment KPIs for turnover, capex, and opex. Financial undertakings disclose the Green Asset Ratio (GAR) or equivalent product-level ratios. Numbers are subject to CSRD assurance."
      ]
    }
  ],
  "keyTakeaways": [
    "Six environmental objectives; classification via delegated acts.",
    "Eligibility ≠ alignment: alignment requires DNSH + social safeguards.",
    "Non-financial undertakings disclose turnover/capex/opex ratios.",
    "Numbers are audited under CSRD."
  ],
  "faq": [
    {
      "q": "Does the Taxonomy apply to SMEs?",
      "a": "Not directly. SMEs receive Taxonomy questions from banks and CSRD-scoped customers via cascade."
    },
    {
      "q": "What's the Green Asset Ratio?",
      "a": "For banks: the share of exposures financing Taxonomy-aligned activities. Reported since 2024."
    },
    {
      "q": "What are 'social safeguards'?",
      "a": "Alignment with OECD Guidelines and UN Guiding Principles on Business and Human Rights."
    }
  ],
  "ctaHeading": "Automate EU Taxonomy KPIs alongside your CSRD data",
  "ctaBody": "Vuneli tags capex and opex against Taxonomy activities, applies DNSH checks, and outputs the ratios auditors expect."
},
  el: {
  "title": "Η EU Ταξινομία: Σύστημα Ταξινόμησης Βιώσιμων Δραστηριοτήτων",
  "metaTitle": "EU Ταξινομία 2026 — Ευθυγράμμιση, Επιλεξιμότητα, KPIs",
  "metaDescription": "Πώς ταξινομεί η EU Ταξινομία τις βιώσιμες δραστηριότητες.",
  "heroEyebrow": "Ρυθμιστικό",
  "heroSubtitle": "Η EU Ταξινομία αποφασίζει τι θεωρείται 'πράσινο'.",
  "tocLabel": "Σε αυτή τη σελίδα",
  "introduction": [
    "Ο Κανονισμός EU Taxonomy ορίζει ποιες δραστηριότητες είναι βιώσιμες. Στηρίζει CSRD, SFDR, EU Green Bond Standard.",
    "Εδώ οι 6 στόχοι, επιλεξιμότητα vs ευθυγράμμιση, υποχρεωτικοί KPIs."
  ],
  "sections": [
    {
      "heading": "Έξι περιβαλλοντικοί στόχοι",
      "body": [
        "Μετριασμός κλίματος. Προσαρμογή. Νερά. Κυκλική οικονομία. Πρόληψη ρύπανσης. Βιοποικιλότητα."
      ]
    },
    {
      "heading": "Επιλεξιμότητα vs Ευθυγράμμιση",
      "body": [
        "Επιλέξιμη: αν είναι στους delegated acts (~200). Ευθυγραμμισμένη: + ουσιαστική συνεισφορά, DNSH, ελάχιστες κοινωνικές διασφαλίσεις."
      ]
    },
    {
      "heading": "Υποχρεωτικοί KPIs",
      "body": [
        "Μη-χρηματοοικονομικές: turnover, capex, opex. Χρηματοοικονομικές: Green Asset Ratio."
      ]
    }
  ],
  "keyTakeaways": [
    "6 στόχοι.",
    "Επιλεξιμότητα ≠ ευθυγράμμιση.",
    "KPIs turnover/capex/opex.",
    "Ελέγχονται στο CSRD."
  ],
  "faq": [
    {
      "q": "Εφαρμόζεται σε ΜμΕ;",
      "a": "Όχι άμεσα, μέσω αλυσίδας."
    },
    {
      "q": "Green Asset Ratio;",
      "a": "Για τράπεζες."
    },
    {
      "q": "Κοινωνικές διασφαλίσεις;",
      "a": "OECD, UNGP."
    }
  ],
  "ctaHeading": "Αυτοματοποιήστε τους EU Taxonomy KPIs",
  "ctaBody": "Η Vuneli ετικετοποιεί capex/opex έναντι Ταξινομίας."
},
});
