import { makePillar } from "./_factory";

export const scope123Emissions = makePillar({
  slug: "scope-1-2-3-emissions",
  category: "carbon",
  primaryKeyword: "scope 1 2 3 emissions",
  monthlyVolume: 2400,
  readingMinutes: 9,
  relatedSlugs: ["scope-3-emissions-calculation","ghg-protocol-guide","carbon-accounting-for-smes","csrd-reporting-guide"],
  en: {
  "title": "Scope 1, 2, and 3 Emissions: What They Are and How to Measure Them",
  "metaTitle": "Scope 1, 2, 3 Emissions Explained — With Real Examples",
  "metaDescription": "Clear definitions of Scope 1, 2, and 3 emissions with real-world examples, calculation methods, and a checklist to build your first GHG inventory.",
  "heroEyebrow": "Foundational Guide",
  "heroSubtitle": "The GHG Protocol splits corporate emissions into three scopes. Getting the split right is the foundation of every credible carbon report.",
  "tocLabel": "On this page",
  "introduction": [
    "Every carbon disclosure — CDP, CSRD, VSME, SBTi, or a bank ESG questionnaire — asks for emissions broken into Scope 1, Scope 2, and Scope 3. The definitions come from the GHG Protocol Corporate Standard and are essentially universal.",
    "Getting the categorization wrong is the single most common finding in first-time carbon audits. This guide fixes that."
  ],
  "sections": [
    {
      "heading": "Scope 1: Direct emissions",
      "body": [
        "Emissions from sources your company owns or controls: company-owned vehicles burning fuel, on-site gas boilers, on-site diesel generators, refrigerant leaks from HVAC, process emissions from industrial equipment.",
        "Simple test: if fuel is burned or a chemical reaction happens on your premises or in a vehicle you own, it's Scope 1."
      ]
    },
    {
      "heading": "Scope 2: Purchased energy",
      "body": [
        "Emissions from the generation of electricity, steam, heat, or cooling you purchase and consume. Report Scope 2 using two methods in parallel: location-based (grid average) and market-based (reflects contractual instruments like renewable PPAs and green tariffs).",
        "Market-based reporting is what unlocks credible claims about renewable procurement — location-based is the honest bedrock number."
      ]
    },
    {
      "heading": "Scope 3: Everything else in the value chain",
      "body": [
        "Fifteen categories covering upstream (purchased goods and services, capital goods, business travel, employee commuting, upstream leased assets) and downstream (transportation, processing, product use, end-of-life, franchises, investments).",
        "Scope 3 typically represents 70–90% of a company's total footprint. It's also the hardest to measure — most SMEs start with spend-based estimates and move to supplier-specific data as it becomes available."
      ]
    }
  ],
  "keyTakeaways": [
    "Scope 1: direct, on-site fuel combustion and process emissions.",
    "Scope 2: purchased electricity, heat, steam, and cooling.",
    "Scope 3: all upstream and downstream value-chain emissions (15 categories).",
    "Report Scope 2 with both location-based and market-based methods.",
    "Scope 3 is usually 70–90% of the total; start with spend-based and refine."
  ],
  "faq": [
    {
      "q": "What's the difference between location-based and market-based Scope 2?",
      "a": "Location-based uses the average grid emission factor for the region. Market-based uses contractual instruments (renewable PPAs, RECs, GOs). Both are required for full transparency."
    },
    {
      "q": "Do I have to report all 15 Scope 3 categories?",
      "a": "No. You assess materiality; the categories that are material to your business must be reported. Categories deemed not applicable must still be documented as such."
    },
    {
      "q": "How do I handle rented office space?",
      "a": "Electricity in a rented office is usually Scope 2 for the tenant when the tenant pays the bill. If the landlord bills a flat-rate rent inclusive of utilities, the emissions fall under Scope 3 Category 8 (upstream leased assets)."
    },
    {
      "q": "Are refrigerant leaks Scope 1 or Scope 3?",
      "a": "Refrigerant leaks from equipment you own or operate are Scope 1 fugitive emissions. Leaks from leased equipment where the lessor operates it are Scope 3."
    }
  ],
  "ctaHeading": "Automate your Scope 1, 2, and 3 inventory",
  "ctaBody": "VerdeIQ pulls fuel receipts, utility bills, and spend data into a GHG Protocol-compliant inventory — with Scope 2 dual reporting and Scope 3 by all 15 categories."
},
  el: {
  "title": "Εκπομπές Scope 1, 2 και 3: Τι Είναι και Πώς Μετρώνται",
  "metaTitle": "Scope 1, 2, 3 Εκπομπές — Με Πραγματικά Παραδείγματα",
  "metaDescription": "Σαφείς ορισμοί των εκπομπών Scope 1, 2 και 3 με πραγματικά παραδείγματα, μεθόδους υπολογισμού και checklist για την πρώτη σας απογραφή GHG.",
  "heroEyebrow": "Θεμελιώδης Οδηγός",
  "heroSubtitle": "Το GHG Protocol χωρίζει τις εταιρικές εκπομπές σε τρία scope. Ο σωστός διαχωρισμός είναι το θεμέλιο κάθε αξιόπιστης αναφοράς.",
  "tocLabel": "Σε αυτή τη σελίδα",
  "introduction": [
    "Κάθε γνωστοποίηση άνθρακα — CDP, CSRD, VSME, SBTi — ζητά εκπομπές χωρισμένες σε Scope 1, 2, 3. Οι ορισμοί από το GHG Protocol είναι σχεδόν παγκόσμιοι.",
    "Η λανθασμένη κατηγοριοποίηση είναι το πιο συχνό εύρημα σε πρώτους ελέγχους. Αυτός ο οδηγός το διορθώνει."
  ],
  "sections": [
    {
      "heading": "Scope 1: Άμεσες εκπομπές",
      "body": [
        "Εκπομπές από πηγές που η εταιρεία σας ελέγχει: εταιρικά οχήματα, καυστήρες φυσικού αερίου, γεννήτριες πετρελαίου, διαρροές ψυκτικών, βιομηχανικές διαδικασίες.",
        "Απλός έλεγχος: αν καίγεται καύσιμο στις εγκαταστάσεις ή σε δικό σας όχημα, είναι Scope 1."
      ]
    },
    {
      "heading": "Scope 2: Αγορασμένη ενέργεια",
      "body": [
        "Εκπομπές από παραγωγή ηλεκτρικής ενέργειας, ατμού, θερμότητας που αγοράζετε. Αναφορά με δύο μεθόδους: location-based (μέσος όρος δικτύου) και market-based (συμβάσεις όπως PPAs, πράσινα τιμολόγια)."
      ]
    },
    {
      "heading": "Scope 3: Όλα τα υπόλοιπα στην αλυσίδα αξίας",
      "body": [
        "Δεκαπέντε κατηγορίες που καλύπτουν upstream (αγαθά/υπηρεσίες, ταξίδια, μετακίνηση) και downstream (μεταφορές, χρήση προϊόντος, τέλος ζωής, επενδύσεις).",
        "Το Scope 3 συνήθως αντιπροσωπεύει 70–90% του συνόλου. Ξεκινήστε με spend-based εκτιμήσεις."
      ]
    }
  ],
  "keyTakeaways": [
    "Scope 1: άμεσες, εντός εγκατάστασης.",
    "Scope 2: αγορασμένη ηλεκτρική/θερμότητα.",
    "Scope 3: όλες οι άλλες κατηγορίες αλυσίδας αξίας (15).",
    "Αναφέρετε Scope 2 και με τις δύο μεθόδους.",
    "Το Scope 3 είναι συνήθως 70–90% του συνόλου."
  ],
  "faq": [
    {
      "q": "Τι διαφορά έχουν location-based και market-based;",
      "a": "Location-based: μέσος συντελεστής δικτύου. Market-based: συμβατικά μέσα (PPAs, RECs)."
    },
    {
      "q": "Πρέπει να αναφέρω και τις 15 κατηγορίες Scope 3;",
      "a": "Όχι. Αναφέρετε τις ουσιώδεις. Οι μη εφαρμόσιμες τεκμηριώνονται."
    },
    {
      "q": "Πώς χειρίζομαι μισθωμένο γραφείο;",
      "a": "Αν πληρώνετε τον λογαριασμό, είναι Scope 2. Αν περιλαμβάνεται flat στο μίσθωμα, Scope 3 Κατ. 8."
    },
    {
      "q": "Οι διαρροές ψυκτικών είναι Scope 1 ή 3;",
      "a": "Από εξοπλισμό που ελέγχετε: Scope 1 fugitive. Από μισθωμένο εξοπλισμό: Scope 3."
    }
  ],
  "ctaHeading": "Αυτοματοποιήστε την απογραφή Scope 1, 2, 3",
  "ctaBody": "Η VerdeIQ αντλεί καύσιμα, λογαριασμούς και spend data σε απογραφή GHG Protocol — με Scope 2 διπλή αναφορά."
},
});
