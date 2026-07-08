import { makePillar } from "./_factory";

export const ghgProtocolGuide = makePillar({
  slug: "ghg-protocol-guide",
  category: "standards",
  primaryKeyword: "GHG Protocol",
  monthlyVolume: 0,
  readingMinutes: 9,
  relatedSlugs: ["scope-1-2-3-emissions","carbon-accounting-for-smes","scope-3-emissions-calculation","science-based-targets-sbti"],
  en: {
  "title": "The GHG Protocol: A Working Guide for Practitioners",
  "metaTitle": "GHG Protocol Guide — Corporate Standard for Practitioners",
  "metaDescription": "The GHG Protocol Corporate Standard in practice: organizational boundaries, operational boundaries, base year, and the calculation workflow.",
  "heroEyebrow": "Standard Deep-Dive",
  "heroSubtitle": "The GHG Protocol Corporate Standard is the underlying methodology for CSRD, CDP, SBTi, and every credible carbon report. Here's how to actually apply it.",
  "tocLabel": "On this page",
  "introduction": [
    "The GHG Protocol Corporate Accounting and Reporting Standard, published by the World Resources Institute and WBCSD, is the de facto global standard. Every other framework (CSRD, CDP, SBTi, TCFD) sits on top of it.",
    "This guide covers the four decisions you must document to be Protocol-compliant: organizational boundary, operational boundary, base year, and recalculation policy."
  ],
  "sections": [
    {
      "heading": "Organizational boundaries",
      "body": [
        "Choose one of three consolidation approaches: equity share (percentage of ownership), operational control (you dictate operating policies), or financial control (you set financial and operating policies with a view to gaining economic benefit from its activities).",
        "Operational control is the most common choice and is required by many downstream frameworks including SBTi."
      ]
    },
    {
      "heading": "Operational boundaries",
      "body": [
        "Once the entities are set, decide which emission sources within them count. Scope 1 and 2 are mandatory for all reporters. Scope 3 categories are optional under the Corporate Standard but effectively required by CSRD, SBTi, and CDP."
      ]
    },
    {
      "heading": "Base year and recalculation",
      "body": [
        "Pick a base year with representative data. Document a base-year recalculation policy triggered by: significant structural changes (M&A, divestitures), methodology improvements, or discovery of errors above a materiality threshold (typically 5%).",
        "Without a documented recalculation policy, trend analysis becomes unauditable."
      ]
    }
  ],
  "keyTakeaways": [
    "Four decisions: organizational boundary, operational boundary, base year, recalculation policy.",
    "Operational control is the most common consolidation approach.",
    "Scope 3 is optional under the standard but effectively mandatory downstream.",
    "Recalculation policy must be written before you need it — not after."
  ],
  "faq": [
    {
      "q": "Is the GHG Protocol mandatory?",
      "a": "Not by itself. But CSRD, CDP, SBTi, and most bank ESG questionnaires require GHG Protocol-consistent methodology."
    },
    {
      "q": "Can I change consolidation approach later?",
      "a": "You can, but you must recalculate the base year on the new basis and disclose the reason."
    },
    {
      "q": "What triggers a base-year recalculation?",
      "a": "Acquisitions, divestitures, methodology changes, or errors above the materiality threshold in your recalculation policy."
    }
  ],
  "ctaHeading": "GHG Protocol-compliant carbon accounting out of the box",
  "ctaBody": "VerdeIQ applies the Corporate Standard automatically — including base-year handling, recalculation logic, and Scope 2 dual reporting."
},
  el: {
  "title": "GHG Protocol: Πρακτικός Οδηγός",
  "metaTitle": "GHG Protocol — Corporate Standard για Επαγγελματίες",
  "metaDescription": "Το GHG Protocol στην πράξη: οργανωτικά όρια, λειτουργικά όρια, έτος βάσης, ροή υπολογισμού.",
  "heroEyebrow": "Πρότυπο",
  "heroSubtitle": "Το GHG Protocol είναι η μεθοδολογία που στηρίζει CSRD, CDP, SBTi. Πώς εφαρμόζεται.",
  "tocLabel": "Σε αυτή τη σελίδα",
  "introduction": [
    "Το GHG Protocol της WRI/WBCSD είναι το de facto παγκόσμιο πρότυπο.",
    "Ο οδηγός καλύπτει τις 4 αποφάσεις."
  ],
  "sections": [
    {
      "heading": "Οργανωτικά όρια",
      "body": [
        "Τρεις προσεγγίσεις: equity share, operational control, financial control.",
        "Το operational control είναι το πιο κοινό."
      ]
    },
    {
      "heading": "Λειτουργικά όρια",
      "body": [
        "Scope 1 και 2 υποχρεωτικά. Scope 3 προαιρετικά βάσει προτύπου αλλά υποχρεωτικά downstream."
      ]
    },
    {
      "heading": "Έτος βάσης και επανυπολογισμός",
      "body": [
        "Επιλέξτε αντιπροσωπευτικό έτος. Τεκμηριώστε πολιτική επανυπολογισμού.",
        "Χωρίς πολιτική, η ανάλυση τάσεων δεν ελέγχεται."
      ]
    }
  ],
  "keyTakeaways": [
    "4 αποφάσεις.",
    "Operational control κυρίως.",
    "Scope 3 στην πράξη υποχρεωτικό.",
    "Πολιτική επανυπολογισμού πριν χρειαστεί."
  ],
  "faq": [
    {
      "q": "Υποχρεωτικό;",
      "a": "Όχι μόνο του, αλλά CSRD/CDP/SBTi το απαιτούν."
    },
    {
      "q": "Αλλαγή προσέγγισης;",
      "a": "Επιτρέπεται με επανυπολογισμό βάσης."
    },
    {
      "q": "Τι πυροδοτεί επανυπολογισμό;",
      "a": "M&A, μεθοδολογία, σφάλματα."
    }
  ],
  "ctaHeading": "Λογιστική συμβατή με GHG Protocol",
  "ctaBody": "Η VerdeIQ εφαρμόζει αυτόματα το πρότυπο."
},
});
