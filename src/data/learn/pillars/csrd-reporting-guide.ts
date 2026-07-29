import type { Pillar } from "../pillars";

export const csrdReportingGuide: Pillar = {
  slug: "csrd-reporting-guide",
  category: "csrd",
  primaryKeyword: "CSRD reporting",
  monthlyVolume: 2900,
  publishedAt: "2026-07-08",
  updatedAt: "2026-07-08",
  readingMinutes: 12,
  heroImage: "/assets/learn/csrd-reporting-guide/hero.jpg",
  relatedSlugs: ["esrs-standards-explained", "double-materiality-assessment", "eu-taxonomy-explained", "vsme-reporting-guide"],
  en: {
    title: "CSRD Reporting: The Complete 2026 Guide for EU Companies",
    metaTitle: "CSRD Reporting Guide 2026 — Timeline, ESRS & Compliance",
    metaDescription:
      "Everything EU companies need to know about CSRD reporting in 2026: who must report, ESRS standards, double materiality, timelines, and how to start.",
    heroEyebrow: "Regulatory Guide",
    heroSubtitle:
      "The Corporate Sustainability Reporting Directive is reshaping how EU companies disclose ESG performance. Here's what compliance actually looks like — timelines, standards, and the practical steps to get audit-ready.",
    tocLabel: "On this page",
    introduction: [
      "The Corporate Sustainability Reporting Directive (CSRD) is the most significant expansion of corporate reporting in EU history. It replaces the Non-Financial Reporting Directive (NFRD) and pulls roughly 50,000 companies into mandatory, audited sustainability disclosure — up from about 11,700 under the old regime.",
      "For finance leaders, sustainability managers, and SME owners inside supply chains, CSRD is no longer a 2027 problem. Value-chain data requests, lender ESG questionnaires, and procurement scorecards are already driving demand today. This guide breaks down what CSRD requires, who is in scope, and how to build a reporting foundation that scales.",
      "We'll cover the phased timeline, the twelve ESRS standards, the double materiality assessment, digital tagging (ESEF/XBRL), assurance requirements, and the practical software and data workflows companies use to comply without derailing operations.",
    ],
    sections: [
      {
        heading: "Who has to report under CSRD?",
        body: [
          "CSRD applies in waves. Large public-interest entities with over 500 employees that already reported under NFRD were first — for financial year 2024, published in 2025. Other large EU companies meeting two of three thresholds (>250 employees, >€50m turnover, >€25m balance sheet) follow for FY2025 published in 2026.",
          "Listed SMEs, small credit institutions, and captive insurance undertakings begin FY2026 (with a possible two-year opt-out through 2028). Finally, non-EU parent companies with significant EU turnover (>€150m) and at least one qualifying EU subsidiary or branch fall in scope from FY2028.",
          "Even if you're a private SME not directly in scope, expect indirect exposure: your customers, banks, and investors will ask for Scope 1–3 emissions, energy mix, and social data to complete their own CSRD reports. The Voluntary SME (VSME) standard was created exactly for this cascade.",
        ],
      },
      {
        heading: "The twelve ESRS standards, at a glance",
        body: [
          "CSRD is operationalized through the European Sustainability Reporting Standards (ESRS), developed by EFRAG and adopted by the European Commission. There are two cross-cutting standards (ESRS 1 general requirements, ESRS 2 general disclosures) and ten topical standards covering environment, social, and governance domains.",
          "Environmental: E1 Climate change, E2 Pollution, E3 Water & marine resources, E4 Biodiversity & ecosystems, E5 Resource use & circular economy. Social: S1 Own workforce, S2 Workers in value chain, S3 Affected communities, S4 Consumers & end-users. Governance: G1 Business conduct.",
          "You don't automatically report on all twelve — only the topics your double materiality assessment identifies as material. ESRS E1 (climate) has effectively become mandatory in practice because climate is material for almost every business.",
        ],
      },
      {
        heading: "Double materiality: the hardest part",
        body: [
          "CSRD introduces double materiality: you must assess both how sustainability issues affect your company (financial materiality) and how your company affects people and the environment (impact materiality). A topic is reportable if it is material from either lens.",
          "In practice this means a structured process: identify impacts, risks, and opportunities (IROs) across your value chain, engage internal and external stakeholders, score severity and likelihood, set thresholds, and document the outcome. Assurance providers will test your methodology, not just the result — so the audit trail matters as much as the conclusion.",
        ],
      },
      {
        heading: "Digital tagging, assurance, and the reporting file",
        body: [
          "CSRD disclosures are published inside the management report and must be digitally tagged using the ESEF/XBRL taxonomy. Reports are subject to limited assurance from the first reporting year, moving toward reasonable assurance over time (a step-up aligned with financial audit standards).",
          "Practically, this pushes companies to move away from Word-document reporting and toward structured data platforms where every disclosure point is versioned, linked to source evidence, and machine-readable. This is where sustainability software earns its keep.",
        ],
      },
      {
        heading: "A pragmatic 6-step readiness plan",
        body: [
          "1. Confirm your in-scope year and consolidated reporting boundary. 2. Run a double materiality assessment and document the methodology. 3. Perform a gap analysis against the material ESRS datapoints. 4. Build a GHG inventory covering Scope 1, 2, and material Scope 3 categories using the GHG Protocol. 5. Stand up a data collection and evidence platform that maps to ESRS datapoints and supports XBRL tagging. 6. Engage an assurance provider early — waiting until Q1 of the reporting year is the most common (and costly) mistake.",
          "SMEs supplying larger reporters should adopt the VSME standard: it maps neatly onto ESRS while staying proportionate to smaller businesses, and it satisfies most customer/lender data requests in a single format.",
        ],
      },
    ],
    keyTakeaways: [
      "CSRD expands mandatory ESG reporting to ~50,000 EU companies, phased from FY2024 to FY2028.",
      "Reports follow twelve ESRS standards; scope is determined by a documented double materiality assessment.",
      "Disclosures are digitally tagged (XBRL) and subject to limited assurance from year one.",
      "Private SMEs are indirectly in scope through value-chain data requests — VSME is the proportionate response.",
      "Start with materiality and a Scope 1–3 GHG inventory; software that maps directly to ESRS datapoints saves months of consulting spend.",
    ],
    faq: [
      {
        q: "When does CSRD apply to my company?",
        a: "Wave 1 (former NFRD reporters) reports on FY2024. Wave 2 (other large EU companies) reports on FY2025. Wave 3 (listed SMEs and small credit institutions) reports on FY2026 with a two-year opt-out to 2028. Wave 4 (non-EU parents with >€150m EU turnover) reports on FY2028.",
      },
      {
        q: "Do I need to report on all twelve ESRS?",
        a: "No. You only report on the topical ESRS your double materiality assessment identifies as material. The two cross-cutting standards (ESRS 1 and 2) are always applicable. In practice, ESRS E1 (climate) is material for nearly every company.",
      },
      {
        q: "What is double materiality in simple terms?",
        a: "You assess both how sustainability issues affect your business (financial materiality — risks and opportunities) and how your business affects people and the planet (impact materiality). If either lens flags a topic as material, you must report on it.",
      },
      {
        q: "Is CSRD reporting audited?",
        a: "Yes. From year one, disclosures require limited assurance from a qualified auditor. The EU intends to move to reasonable assurance (the same level as financial audits) once methodology and taxonomy mature.",
      },
      {
        q: "What about SMEs that are not directly in scope?",
        a: "You'll still receive data requests from large customers, banks, and investors who must fill in their own CSRD reports. The Voluntary SME (VSME) standard was designed for this — it is proportionate, aligned to ESRS, and satisfies most upstream data requests in one format.",
      },
    ],
    ctaHeading: "Get audit-ready without the spreadsheet chaos",
    ctaBody:
      "Vuneli maps your data directly to ESRS datapoints, runs your double materiality assessment, and produces XBRL-tagged disclosures your auditor can actually sign off on. Purpose-built for EU SMEs and mid-caps.",
  },
  el: {
    title: "Αναφορά CSRD: Ο Πλήρης Οδηγός 2026 για Ευρωπαϊκές Εταιρείες",
    metaTitle: "Οδηγός CSRD 2026 — Χρονοδιάγραμμα, ESRS & Συμμόρφωση",
    metaDescription:
      "Όσα χρειάζεται να γνωρίζουν οι εταιρείες της ΕΕ για την αναφορά CSRD το 2026: ποιοι υποχρεούνται, πρότυπα ESRS, διπλή ουσιαστικότητα, χρονοδιάγραμμα, πρακτικά βήματα.",
    heroEyebrow: "Ρυθμιστικός Οδηγός",
    heroSubtitle:
      "Η Οδηγία για την Εταιρική Αναφορά Βιωσιμότητας αλλάζει τον τρόπο με τον οποίο οι επιχειρήσεις της ΕΕ δημοσιεύουν τα ESG δεδομένα τους. Ορίστε τι σημαίνει πρακτικά η συμμόρφωση.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Η Οδηγία CSRD αποτελεί τη μεγαλύτερη επέκταση εταιρικής αναφοράς στην ιστορία της ΕΕ. Αντικαθιστά την NFRD και εντάσσει περίπου 50.000 εταιρείες σε υποχρεωτική, ελεγχόμενη αναφορά βιωσιμότητας — από περίπου 11.700 στο προηγούμενο πλαίσιο.",
      "Για CFOs, υπεύθυνους βιωσιμότητας και ιδιοκτήτες ΜμΕ σε αλυσίδες αξίας, η CSRD δεν είναι πλέον πρόβλημα του 2027. Οι απαιτήσεις δεδομένων από πελάτες, τράπεζες και επενδυτές έφτασαν ήδη. Αυτός ο οδηγός εξηγεί ποιοι υποχρεούνται, ποια είναι τα πρότυπα ESRS και πώς χτίζεται μια βιώσιμη βάση αναφοράς.",
      "Θα καλύψουμε το σταδιακό χρονοδιάγραμμα, τα δώδεκα πρότυπα ESRS, τη διπλή ουσιαστικότητα, την ψηφιακή σήμανση XBRL, τις απαιτήσεις διασφάλισης και τη ροή εργασίας των δεδομένων.",
    ],
    sections: [
      {
        heading: "Ποιος υποχρεούται να αναφέρει;",
        body: [
          "Η CSRD εφαρμόζεται σε κύματα. Οι μεγάλες οντότητες δημοσίου συμφέροντος με άνω των 500 εργαζομένων ήταν πρώτες, για τη χρήση 2024. Άλλες μεγάλες εταιρείες της ΕΕ που πληρούν δύο από τα τρία κριτήρια (>250 εργαζόμενοι, >€50εκ κύκλος, >€25εκ ισολογισμός) ακολουθούν για τη χρήση 2025.",
          "Οι εισηγμένες ΜμΕ και τα μικρά πιστωτικά ιδρύματα ξεκινούν τη χρήση 2026, με δυνατότητα εξαίρεσης δύο ετών έως το 2028. Τέλος, μη-ΕΕ μητρικές εταιρείες με κύκλο εργασιών στην ΕΕ >€150εκ εντάσσονται από τη χρήση 2028.",
          "Ακόμη κι αν είστε ιδιωτική ΜμΕ εκτός άμεσου πεδίου, θα δεχθείτε αιτήματα δεδομένων Scope 1–3 από πελάτες και τράπεζες. Το πρότυπο VSME δημιουργήθηκε ακριβώς γι' αυτό.",
        ],
      },
      {
        heading: "Τα δώδεκα πρότυπα ESRS",
        body: [
          "Η CSRD υλοποιείται μέσω των Ευρωπαϊκών Προτύπων Αναφοράς Βιωσιμότητας (ESRS). Υπάρχουν δύο διατομεακά πρότυπα (ESRS 1 γενικές απαιτήσεις, ESRS 2 γενικές γνωστοποιήσεις) και δέκα θεματικά πρότυπα.",
          "Περιβάλλον: E1 Κλιματική αλλαγή, E2 Ρύπανση, E3 Ύδατα & θαλάσσιοι πόροι, E4 Βιοποικιλότητα, E5 Χρήση πόρων & κυκλική οικονομία. Κοινωνία: S1 Ίδιο εργατικό δυναμικό, S2 Εργαζόμενοι αλυσίδας αξίας, S3 Θιγόμενες κοινότητες, S4 Καταναλωτές. Διακυβέρνηση: G1 Επιχειρηματική δεοντολογία.",
          "Δεν αναφέρετε αυτόματα και τα δώδεκα — μόνο όσα η διπλή ουσιαστικότητα εντοπίζει ως ουσιώδη. Το ESRS E1 (κλίμα) είναι ουσιώδες για σχεδόν κάθε επιχείρηση.",
        ],
      },
      {
        heading: "Διπλή ουσιαστικότητα: το πιο δύσκολο κομμάτι",
        body: [
          "Η CSRD εισάγει τη διπλή ουσιαστικότητα: αξιολογείτε πώς τα ζητήματα βιωσιμότητας επηρεάζουν την εταιρεία (χρηματοοικονομική ουσιαστικότητα) αλλά και πώς η εταιρεία επηρεάζει ανθρώπους και περιβάλλον (ουσιαστικότητα επιπτώσεων).",
          "Στην πράξη απαιτείται δομημένη διαδικασία: εντοπισμός επιπτώσεων/κινδύνων/ευκαιριών, εμπλοκή ενδιαφερομένων, βαθμολόγηση, ορισμός κατωφλίων και τεκμηρίωση. Οι ελεγκτές αξιολογούν τη μεθοδολογία, όχι μόνο το αποτέλεσμα.",
        ],
      },
      {
        heading: "Ψηφιακή σήμανση, διασφάλιση και το αρχείο αναφοράς",
        body: [
          "Οι γνωστοποιήσεις CSRD δημοσιεύονται εντός της έκθεσης διαχείρισης και σημαίνονται ψηφιακά με τη ταξινομία ESEF/XBRL. Απαιτείται περιορισμένη διασφάλιση από το πρώτο έτος, με στόχο τη λογική διασφάλιση στο μέλλον.",
          "Αυτό ωθεί τις εταιρείες μακριά από αναφορές σε Word και προς δομημένες πλατφόρμες δεδομένων, όπου κάθε στοιχείο συνδέεται με στοιχεία τεκμηρίωσης και είναι μηχαναγνώσιμο.",
        ],
      },
      {
        heading: "Πρακτικό σχέδιο ετοιμότητας σε 6 βήματα",
        body: [
          "1. Επιβεβαιώστε το έτος πεδίου και το όριο ενοποιημένης αναφοράς. 2. Εκτελέστε διπλή ουσιαστικότητα και τεκμηριώστε τη μεθοδολογία. 3. Αναλύστε τα κενά έναντι των ουσιωδών ESRS datapoints. 4. Χτίστε απογραφή αερίων θερμοκηπίου Scope 1, 2, και υλικά Scope 3 βάσει GHG Protocol. 5. Στήστε πλατφόρμα συλλογής δεδομένων που αντιστοιχίζεται σε ESRS datapoints. 6. Εμπλέξτε ελεγκτή έγκαιρα.",
          "Οι ΜμΕ που τροφοδοτούν μεγαλύτερους αναφέροντες θα πρέπει να υιοθετήσουν το VSME: αντιστοιχίζεται καθαρά με ESRS και ικανοποιεί τα περισσότερα αιτήματα πελατών σε ένα μορφότυπο.",
        ],
      },
    ],
    keyTakeaways: [
      "Η CSRD επεκτείνει την υποχρεωτική ESG αναφορά σε ~50.000 εταιρείες της ΕΕ, σταδιακά 2024–2028.",
      "Οι αναφορές ακολουθούν δώδεκα πρότυπα ESRS· το πεδίο καθορίζεται από διπλή ουσιαστικότητα.",
      "Οι γνωστοποιήσεις σημαίνονται ψηφιακά (XBRL) και υπόκεινται σε διασφάλιση από το πρώτο έτος.",
      "Οι ιδιωτικές ΜμΕ είναι έμμεσα εντός πεδίου μέσω αλυσίδας αξίας — το VSME είναι η αναλογική απάντηση.",
      "Ξεκινήστε με ουσιαστικότητα και απογραφή Scope 1–3· το κατάλληλο λογισμικό εξοικονομεί μήνες συμβουλευτικής δαπάνης.",
    ],
    faq: [
      {
        q: "Πότε εφαρμόζεται η CSRD στην εταιρεία μου;",
        a: "Κύμα 1 (πρώην NFRD) αναφέρει για τη χρήση 2024. Κύμα 2 (άλλες μεγάλες εταιρείες ΕΕ) για τη χρήση 2025. Κύμα 3 (εισηγμένες ΜμΕ) για τη χρήση 2026 με εξαίρεση έως το 2028. Κύμα 4 (μη-ΕΕ μητρικές >€150εκ) για τη χρήση 2028.",
      },
      {
        q: "Πρέπει να αναφέρω και τα δώδεκα ESRS;",
        a: "Όχι. Αναφέρετε μόνο όσα η διπλή ουσιαστικότητα εντοπίζει ως ουσιώδη. Τα ESRS 1 και 2 είναι πάντα εφαρμόσιμα. Στην πράξη, το E1 (κλίμα) είναι ουσιώδες σχεδόν πάντα.",
      },
      {
        q: "Τι είναι απλά η διπλή ουσιαστικότητα;",
        a: "Αξιολογείτε πώς η βιωσιμότητα επηρεάζει την εταιρεία (κίνδυνοι/ευκαιρίες) και πώς η εταιρεία επηρεάζει ανθρώπους/πλανήτη. Αν κάποιο θέμα είναι ουσιώδες από οποιαδήποτε οπτική, αναφέρεται.",
      },
      {
        q: "Ελέγχονται οι αναφορές CSRD;",
        a: "Ναι. Από το πρώτο έτος απαιτείται περιορισμένη διασφάλιση από πιστοποιημένο ελεγκτή. Η ΕΕ στοχεύει σε λογική διασφάλιση στο μέλλον.",
      },
      {
        q: "Τι γίνεται με τις ΜμΕ εκτός άμεσου πεδίου;",
        a: "Θα λάβουν αιτήματα δεδομένων από μεγάλους πελάτες και τράπεζες. Το VSME σχεδιάστηκε γι' αυτό — αναλογικό, ευθυγραμμισμένο με ESRS, καλύπτει τα περισσότερα αιτήματα σε ένα μορφότυπο.",
      },
    ],
    ctaHeading: "Ετοιμαστείτε για έλεγχο χωρίς το χάος των spreadsheets",
    ctaBody:
      "Η Vuneli αντιστοιχίζει τα δεδομένα σας απευθείας σε ESRS datapoints, εκτελεί τη διπλή ουσιαστικότητα και παράγει γνωστοποιήσεις XBRL έτοιμες για ελεγκτή. Ειδικά σχεδιασμένη για ΜμΕ και mid-caps της ΕΕ.",
  },
};
