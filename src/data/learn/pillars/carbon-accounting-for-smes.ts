import { makePillar } from "./_factory";

export const carbonAccountingForSmes = makePillar({
  slug: "carbon-accounting-for-smes",
  category: "sme",
  primaryKeyword: "carbon accounting for SMEs",
  monthlyVolume: 10,
  readingMinutes: 10,
  relatedSlugs: ["vsme-reporting-guide","ghg-protocol-guide","scope-1-2-3-emissions","carbon-footprint-software-smes"],
  en: {
  "title": "Carbon Accounting for SMEs: A Practical Starter Guide",
  "metaTitle": "Carbon Accounting for SMEs — Practical Starter Guide 2026",
  "metaDescription": "How SMEs actually get to a credible first carbon inventory: what to collect, which method to use, common pitfalls, and how long it takes.",
  "heroEyebrow": "SME Playbook",
  "heroSubtitle": "You don't need a sustainability team to run credible carbon accounting. You need the right data and a methodology that scales.",
  "tocLabel": "On this page",
  "introduction": [
    "Carbon accounting is the systematic measurement of greenhouse gas emissions attributed to a company's activities. For SMEs, it usually starts because a customer, bank, or investor asked. Once you've done it once, it becomes a management tool — not just a compliance chore.",
    "This guide is the fastest path to a credible first inventory: what to collect, which method to use, what to skip on version one."
  ],
  "sections": [
    {
      "heading": "The data you need for a first inventory",
      "body": [
        "Twelve months of electricity bills (kWh per meter). Fuel purchases: fleet fuel cards, heating fuel, generator fuel. Refrigerant top-up records from HVAC service reports. Business travel: expense reports categorized by mode. Employee commuting: a simple survey. Waste manifests. Accounts payable extract by supplier for spend-based Scope 3."
      ]
    },
    {
      "heading": "Two calculation methods to know",
      "body": [
        "Activity-based: quantity × emission factor. Most accurate. Use for Scope 1 (litres of fuel × factor) and Scope 2 (kWh × grid factor).",
        "Spend-based: money spent × sector-specific factor. Less accurate but broadly applicable. Use for Scope 3 categories where activity data is unavailable."
      ]
    },
    {
      "heading": "Common pitfalls",
      "body": [
        "Using the wrong electricity grid factor (default: your country's residual mix). Confusing gross vs. net floor area. Double-counting when a business trip is also on the corporate card. Missing refrigerant leaks entirely. Reporting a single Scope 2 number instead of both location- and market-based."
      ]
    },
    {
      "heading": "How long the first cycle takes",
      "body": [
        "For a 30–150 FTE SME with organized records: 3–6 weeks with software, 8–14 weeks with a consultant, 4–8 months with spreadsheets. The second year drops to under two weeks because the collection process is templated."
      ]
    }
  ],
  "keyTakeaways": [
    "Start with Scope 1 and 2 — you can hit 80% of the answer in weeks.",
    "Use activity data where available; spend-based is fine for a first Scope 3 pass.",
    "Get the electricity grid factor right — it's the single biggest driver of accuracy.",
    "Software drops second-year effort by 5–10× versus spreadsheets."
  ],
  "faq": [
    {
      "q": "Do I need a consultant?",
      "a": "For a first CSRD-scoped report, often yes. For VSME or a customer questionnaire, software alone usually suffices."
    },
    {
      "q": "What's a credible first-year target?",
      "a": "Complete Scope 1 + 2 + business travel + top 3 Scope 3 categories by spend. That covers ~90% of most SME footprints."
    },
    {
      "q": "How accurate does it need to be?",
      "a": "Directional accuracy on year one; ±10% by year three. Auditors care about methodology consistency as much as absolute precision."
    },
    {
      "q": "Do I need to publish the report?",
      "a": "No obligation for private SMEs. Many publish anyway because it becomes the answer to every incoming ESG questionnaire."
    }
  ],
  "ctaHeading": "Your first carbon inventory in weeks, not months",
  "ctaBody": "VerdeIQ walks SMEs through data collection, applies EU-region-specific factors, and produces a shareable report you can hand to any customer, bank, or auditor."
},
  el: {
  "title": "Λογιστική Άνθρακα για ΜμΕ: Πρακτικός Οδηγός Έναρξης",
  "metaTitle": "Λογιστική Άνθρακα για ΜμΕ — Οδηγός 2026",
  "metaDescription": "Πώς οι ΜμΕ φτάνουν σε μια αξιόπιστη πρώτη απογραφή άνθρακα: τι να συλλέξουν, ποια μέθοδο, συνηθισμένες παγίδες, χρόνος.",
  "heroEyebrow": "Playbook ΜμΕ",
  "heroSubtitle": "Δεν χρειάζεστε ομάδα βιωσιμότητας. Χρειάζεστε τα σωστά δεδομένα και μεθοδολογία που κλιμακώνεται.",
  "tocLabel": "Σε αυτή τη σελίδα",
  "introduction": [
    "Η λογιστική άνθρακα είναι η συστηματική μέτρηση εκπομπών GHG. Για ΜμΕ ξεκινά συνήθως επειδή ζητήθηκε από πελάτη, τράπεζα ή επενδυτή. Μόλις γίνει μία φορά, γίνεται εργαλείο διοίκησης.",
    "Αυτός ο οδηγός είναι η πιο γρήγορη διαδρομή."
  ],
  "sections": [
    {
      "heading": "Δεδομένα για πρώτη απογραφή",
      "body": [
        "12 μήνες λογαριασμοί ρεύματος. Καύσιμα: κάρτες στόλου, θέρμανση, γεννήτριες. Ψυκτικά: συντηρήσεις HVAC. Ταξίδια: αναφορές εξόδων. Μετακίνηση εργαζομένων: έρευνα. Απόβλητα. Λογαριασμοί προμηθευτών για spend-based Scope 3."
      ]
    },
    {
      "heading": "Δύο μέθοδοι υπολογισμού",
      "body": [
        "Activity-based: ποσότητα × συντελεστής. Χρήση για Scope 1 και 2.",
        "Spend-based: χρήματα × συντελεστής τομέα. Χρήση για Scope 3 όπου δεν υπάρχουν δεδομένα."
      ]
    },
    {
      "heading": "Συνηθισμένες παγίδες",
      "body": [
        "Λάθος συντελεστής δικτύου. Σύγχυση μεικτής/καθαρής επιφάνειας. Διπλομέτρηση ταξιδιών. Παράλειψη ψυκτικών. Αναφορά μόνο ενός αριθμού Scope 2."
      ]
    },
    {
      "heading": "Χρόνος πρώτου κύκλου",
      "body": [
        "30–150 FTE με οργανωμένα αρχεία: 3–6 εβδομάδες με λογισμικό, 8–14 με σύμβουλο, 4–8 μήνες με spreadsheets."
      ]
    }
  ],
  "keyTakeaways": [
    "Ξεκινήστε με Scope 1 και 2.",
    "Χρησιμοποιήστε activity data· spend-based για πρώτη προσέγγιση Scope 3.",
    "Σωστός συντελεστής δικτύου.",
    "Το λογισμικό ρίχνει την προσπάθεια 5–10× από τη δεύτερη χρονιά."
  ],
  "faq": [
    {
      "q": "Χρειάζομαι σύμβουλο;",
      "a": "Για CSRD, συχνά ναι. Για VSME/ερωτηματολόγιο, λογισμικό αρκεί."
    },
    {
      "q": "Ρεαλιστικός στόχος πρώτου έτους;",
      "a": "Scope 1 + 2 + ταξίδια + top 3 Scope 3 by spend."
    },
    {
      "q": "Πόση ακρίβεια χρειάζεται;",
      "a": "Κατευθυντήρια ακρίβεια στο έτος 1, ±10% στο έτος 3."
    },
    {
      "q": "Πρέπει να το δημοσιεύσω;",
      "a": "Καμία υποχρέωση για ιδιωτικές ΜμΕ."
    }
  ],
  "ctaHeading": "Πρώτη απογραφή σε εβδομάδες",
  "ctaBody": "Η VerdeIQ καθοδηγεί τις ΜμΕ στη συλλογή δεδομένων, εφαρμόζει EU συντελεστές, και παράγει διαμοιραζόμενη αναφορά."
},
});
