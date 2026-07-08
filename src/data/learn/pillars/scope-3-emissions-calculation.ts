import { makePillar } from "./_factory";

export const scope3EmissionsCalculation = makePillar({
  slug: "scope-3-emissions-calculation",
  category: "carbon",
  primaryKeyword: "scope 3 emissions calculation",
  monthlyVolume: 0,
  readingMinutes: 13,
  relatedSlugs: ["scope-1-2-3-emissions","ghg-protocol-guide","carbon-accounting-for-smes","csrd-reporting-guide"],
  en: {
  "title": "How to Calculate Scope 3 Emissions: A Practical Category-by-Category Guide",
  "metaTitle": "Scope 3 Calculation Guide — 15 Categories, Methods, Data",
  "metaDescription": "Concrete calculation methods for each of the 15 Scope 3 categories, data sources, and how to move from spend-based to supplier-specific over time.",
  "heroEyebrow": "Deep-Dive",
  "heroSubtitle": "Scope 3 is usually 70–90% of a footprint and the hardest to measure. Here's the practical, category-by-category playbook.",
  "tocLabel": "On this page",
  "introduction": [
    "The GHG Protocol Scope 3 Standard defines fifteen categories of value-chain emissions. In practice, four to six categories dominate any given company's Scope 3 total.",
    "This guide covers method options (spend-based, average-data, hybrid, supplier-specific), typical data sources, and how to upgrade from crude to precise across three reporting cycles."
  ],
  "sections": [
    {
      "heading": "The four calculation methods",
      "body": [
        "Spend-based: money spent × sector emission factor. Fastest to compute, least accurate.",
        "Average-data: physical quantity × industry-average factor per unit. Better than spend-based, requires physical data.",
        "Hybrid: mix of the two. Standard for year-two reports.",
        "Supplier-specific: primary emissions data from the supplier. Most accurate, hardest to collect."
      ]
    },
    {
      "heading": "The categories that usually matter",
      "body": [
        "Category 1 (Purchased goods and services): almost always material. Start here.",
        "Category 4 (Upstream transportation): material for manufacturing, retail, e-commerce.",
        "Category 6 (Business travel): easy win with expense-system integration.",
        "Category 11 (Use of sold products): often the biggest single category for product companies.",
        "Category 15 (Investments): dominant for financial institutions."
      ]
    },
    {
      "heading": "A three-year data-quality upgrade path",
      "body": [
        "Year 1: spend-based across all material categories. Year 2: physical activity data for top three categories, spend-based for the rest. Year 3: supplier-specific for Tier-1 suppliers in the top three categories, hybrid otherwise."
      ]
    },
    {
      "heading": "Supplier data collection: the real bottleneck",
      "body": [
        "Every Scope 3 upgrade eventually hits the same wall — getting primary emissions data from suppliers. The tactics that actually work: (1) put an ESG data clause into new procurement contracts so it becomes a supplier obligation, not a favor; (2) send a single standardized questionnaire (VSME format is ideal) rather than a bespoke one — suppliers will already have it prepared; (3) segment suppliers by spend and start with the top 20% who typically drive 80% of category emissions.",
        "Response rates jump from 15–25% (cold outreach) to 60–80% when the request comes from procurement rather than sustainability, and when the supplier can respond with data they've already published."
      ]
    },
    {
      "heading": "Common calculation mistakes to avoid",
      "body": [
        "Using EEIO factors from the wrong region: US EEIO factors on European spend systematically understate emissions by 10–20%. Use EXIOBASE or the country-specific factor set your auditor expects.",
        "Double-counting between Category 1 (purchased goods) and Category 4 (upstream transportation) when supplier prices are CIF vs. FOB. Document the boundary in your inventory methodology.",
        "Ignoring Category 3 (fuel- and energy-related activities not in Scope 1/2) — the well-to-tank emissions of your electricity and fuel, which typically add 15–25% on top of Scope 1+2.",
        "Reporting Scope 3 without a corresponding boundary map. Auditors will not accept a total figure without a breakdown of which categories were included, excluded, and why."
      ]
    }
  ],
  "keyTakeaways": [
    "15 categories; 4–6 usually dominate.",
    "Four calculation methods; hybrid is normal.",
    "Spend-based is a valid starting point; upgrade over 2–3 cycles.",
    "Supplier engagement is the real lever, not spreadsheet gymnastics."
  ],
  "faq": [
    {
      "q": "Do I need to compute all 15 categories?",
      "a": "You need to consider all 15, disclose which are material, and report the material ones. Non-material categories are documented as such."
    },
    {
      "q": "How accurate should spend-based be?",
      "a": "Directional. Auditors accept spend-based as long as methodology and factor sources are documented."
    },
    {
      "q": "When do I need supplier-specific data?",
      "a": "When a supplier's emissions materially affect your total, or when SBTi validation or a large customer specifically requires it."
    },
    {
      "q": "What's a realistic supplier response rate to a Scope 3 data request?",
      "a": "15–25% for cold outreach from sustainability teams. 60–80% when the request comes through procurement, is tied to a contract clause, and uses a standard format (VSME) instead of a bespoke questionnaire."
    },
    {
      "q": "Do I have to recalculate prior years when I upgrade methodology?",
      "a": "Only if the change is material (>5% shift in total) or if a target has been set against the prior baseline. Document the methodology change and, where material, restate the baseline year — this is standard GHG Protocol practice."
    }
  ],
  "ctaHeading": "From spend-based to supplier-specific, in one platform",
  "ctaBody": "VerdeIQ collects AP data for spend-based, activity data for hybrid, and runs supplier data-collection surveys — all in one Scope 3 workflow."
},
  el: {
  "title": "Πώς να Υπολογίσετε Scope 3: Οδηγός ανά Κατηγορία",
  "metaTitle": "Υπολογισμός Scope 3 — 15 Κατηγορίες",
  "metaDescription": "Συγκεκριμένες μέθοδοι για κάθε μία από τις 15 κατηγορίες Scope 3.",
  "heroEyebrow": "Deep-Dive",
  "heroSubtitle": "Το Scope 3 είναι συνήθως 70–90% του αποτυπώματος.",
  "tocLabel": "Σε αυτή τη σελίδα",
  "introduction": [
    "Το GHG Protocol ορίζει 15 κατηγορίες. Στην πράξη, 4-6 κυριαρχούν.",
    "Εδώ οι μέθοδοι και η αναβάθμιση σε 3 κύκλους."
  ],
  "sections": [
    {
      "heading": "Τέσσερις μέθοδοι",
      "body": [
        "Spend-based, average-data, hybrid, supplier-specific."
      ]
    },
    {
      "heading": "Κατηγορίες που συνήθως μετρούν",
      "body": [
        "Κατ. 1 αγορές, Κατ. 4 upstream μεταφορές, Κατ. 6 ταξίδια, Κατ. 11 χρήση πωλημένων, Κατ. 15 επενδύσεις."
      ]
    },
    {
      "heading": "Αναβάθμιση 3 ετών",
      "body": [
        "Έτος 1: spend-based. Έτος 2: activity data για top 3. Έτος 3: supplier-specific για Tier-1."
      ]
    }
  ],
  "keyTakeaways": [
    "15 κατηγορίες· 4-6 κυριαρχούν.",
    "4 μέθοδοι· hybrid η νόρμα.",
    "Spend-based έγκυρη αρχή.",
    "Εμπλοκή προμηθευτών είναι το κλειδί."
  ],
  "faq": [
    {
      "q": "Όλες οι 15;",
      "a": "Εξετάζετε όλες, αναφέρετε τις ουσιώδεις."
    },
    {
      "q": "Ακρίβεια spend-based;",
      "a": "Κατευθυντήρια αν τεκμηριωμένη."
    },
    {
      "q": "Πότε supplier-specific;",
      "a": "Όταν είναι ουσιώδης."
    }
  ],
  "ctaHeading": "Από spend-based σε supplier-specific σε μία πλατφόρμα",
  "ctaBody": "Η VerdeIQ συλλέγει και τα δύο σε ένα workflow."
},
});
