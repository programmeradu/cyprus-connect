import { makePillar } from "./_factory";

export const vsmeReportingGuide = makePillar({
  slug: "vsme-reporting-guide",
  category: "sme",
  primaryKeyword: "VSME reporting",
  monthlyVolume: 20,
  readingMinutes: 10,
  relatedSlugs: ["csrd-reporting-guide", "carbon-accounting-for-smes", "esrs-standards-explained", "sustainability-kpis-for-smes"],
  en: {
    title: "VSME Reporting Standard: The SME Guide to Proportionate ESG Disclosure",
    metaTitle: "VSME Standard Guide 2026 — Voluntary SME Reporting Explained",
    metaDescription: "The VSME (Voluntary SME) standard gives non-listed SMEs a proportionate way to answer CSRD data requests. Modules, timelines, and how to adopt it.",
    heroEyebrow: "SME Standard",
    heroSubtitle: "Built by EFRAG for the ~50m non-listed SMEs in Europe, VSME lets you answer customer, bank, and investor ESG questions once — in a format aligned with CSRD.",
    tocLabel: "On this page",
    introduction: [
      "The Voluntary Sustainability Reporting Standard for non-listed SMEs (VSME) was published by EFRAG to solve one specific problem: the flood of inconsistent ESG questionnaires SMEs receive from customers, lenders, and investors trying to complete their own CSRD reports.",
      "Instead of filling in a different template for every counterparty, an SME publishes one VSME report and shares it with everyone. VSME is deliberately proportionate — no double materiality assessment, no XBRL tagging, no mandatory assurance — while still mapping cleanly to ESRS datapoints.",
      "This guide covers the two-module structure, what each disclosure actually asks for, and how to produce a first VSME report in weeks rather than months.",
    ],
    sections: [
      {
        heading: "The two modules: Basic and Comprehensive",
        body: [
          "The Basic Module is the minimum. It covers organizational information, environmental data (energy, GHG Scope 1 and 2, water, pollution, biodiversity, waste), and social data (workforce, health & safety, human rights, community). Most SMEs start here.",
          "The Comprehensive Module adds strategy, business-model resilience, transition plan alignment, additional workforce metrics, GHG Scope 3 (where material), and governance disclosures. It's the format larger customers and banks increasingly request from Tier-1 suppliers.",
        ],
      },
      {
        heading: "Why VSME is the pragmatic choice for SMEs",
        body: [
          "VSME uses simplified methodology (spend-based emission factors accepted), no assurance requirement, and disclosures scale to size. Adoption cost is a fraction of CSRD's, but the output satisfies most upstream data requests including EBA Pillar 3 ESG, bank ESG questionnaires, and EU Taxonomy alignment for lender partners.",
          "For SMEs already receiving 3+ different ESG questionnaires per year, publishing a VSME report typically pays back the effort inside one cycle.",
        ],
      },
      {
        heading: "A four-step VSME implementation plan",
        body: [
          "1. Pick the module (Basic first). 2. Assemble one year of energy bills, fuel purchases, waste manifests, and HR headcount data. 3. Run a Scope 1+2 inventory using the GHG Protocol; use spend-based factors for Scope 3 if you elect the Comprehensive Module. 4. Publish the disclosure — a PDF, a webpage, or an entry in your customer's data portal.",
        ],
      },
    ],
    keyTakeaways: [
      "VSME is EFRAG's voluntary standard for non-listed SMEs, published to align with ESRS/CSRD without the full compliance burden.",
      "Two modules: Basic (minimum) and Comprehensive (for larger suppliers).",
      "No double materiality, no XBRL, no mandatory assurance — proportionate by design.",
      "One VSME report replaces many bespoke ESG questionnaires from customers and banks.",
    ],
    faq: [
      { q: "Is VSME mandatory?", a: "No. VSME is voluntary. But if your customers or banks are CSRD-scoped, they will effectively require you to provide equivalent data — VSME is the proportionate way to do it." },
      { q: "Do I need an auditor for VSME?", a: "No, VSME does not require assurance. Some banks or customers may request it for higher-risk suppliers, but it is not part of the standard." },
      { q: "How does VSME map to CSRD/ESRS?", a: "Every VSME datapoint traces to an ESRS datapoint. Your report can be consumed directly by CSRD-reporting customers with no re-mapping." },
      { q: "Which module should I start with?", a: "Start with Basic. Move to Comprehensive when a large customer or lender specifically asks for it, or when you supply into a Tier-1 CSRD reporter." },
    ],
    ctaHeading: "Publish a VSME report in weeks, not months",
    ctaBody: "VerdeIQ generates a compliant VSME report from your energy bills and HR data — no consultants, no spreadsheets. Share it with every customer and bank in one link.",
  },
  el: {
    title: "Πρότυπο VSME: Ο Οδηγός ΜμΕ για Αναλογική ESG Αναφορά",
    metaTitle: "Οδηγός VSME 2026 — Εθελοντική Αναφορά ΜμΕ",
    metaDescription: "Το VSME δίνει στις μη-εισηγμένες ΜμΕ έναν αναλογικό τρόπο να απαντούν σε αιτήματα δεδομένων CSRD. Ενότητες, χρονοδιαγράμματα, υιοθέτηση.",
    heroEyebrow: "Πρότυπο ΜμΕ",
    heroSubtitle: "Δημιουργήθηκε από την EFRAG για τις ~50 εκατ. μη-εισηγμένες ΜμΕ της Ευρώπης. Απαντάτε σε ερωτήσεις πελατών, τραπεζών και επενδυτών μία φορά — σε μορφή συμβατή με CSRD.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Το Εθελοντικό Πρότυπο Αναφοράς Βιωσιμότητας για μη-εισηγμένες ΜμΕ (VSME) δημοσιεύτηκε από την EFRAG για να λύσει ένα συγκεκριμένο πρόβλημα: τον πλημμύρα ασυνεπών ESG ερωτηματολογίων που λαμβάνουν οι ΜμΕ.",
      "Αντί να συμπληρώνετε διαφορετικά templates για κάθε αντισυμβαλλόμενο, δημοσιεύετε μία αναφορά VSME και τη μοιράζεστε. Το VSME είναι σκόπιμα αναλογικό — χωρίς διπλή ουσιαστικότητα, χωρίς XBRL, χωρίς υποχρεωτική διασφάλιση — και αντιστοιχίζεται καθαρά με ESRS.",
      "Αυτός ο οδηγός καλύπτει τις δύο ενότητες, τι ζητά κάθε γνωστοποίηση, και πώς να παράξετε την πρώτη σας αναφορά VSME σε εβδομάδες.",
    ],
    sections: [
      {
        heading: "Οι δύο ενότητες: Βασική και Περιεκτική",
        body: [
          "Η Βασική Ενότητα είναι το ελάχιστο. Καλύπτει οργανωτικά στοιχεία, περιβαλλοντικά δεδομένα (ενέργεια, Scope 1 & 2, νερό, ρύπανση, βιοποικιλότητα, απόβλητα) και κοινωνικά (εργατικό δυναμικό, ΥΑΕ, ανθρώπινα δικαιώματα).",
          "Η Περιεκτική Ενότητα προσθέτει στρατηγική, ανθεκτικότητα επιχειρηματικού μοντέλου, Scope 3 (όπου ουσιώδες), και γνωστοποιήσεις διακυβέρνησης. Συχνά ζητείται από Tier-1 πελάτες.",
        ],
      },
      {
        heading: "Γιατί το VSME είναι η πραγματιστική επιλογή",
        body: [
          "Το VSME χρησιμοποιεί απλοποιημένη μεθοδολογία (γίνονται δεκτοί spend-based συντελεστές), δεν απαιτεί διασφάλιση, και οι γνωστοποιήσεις κλιμακώνονται στο μέγεθος. Το κόστος υιοθέτησης είναι κλάσμα του CSRD, αλλά καλύπτει τα περισσότερα αιτήματα.",
          "Για ΜμΕ που λαμβάνουν 3+ διαφορετικά ESG ερωτηματολόγια ετησίως, η δημοσίευση μιας αναφοράς VSME αποσβήνεται σε έναν κύκλο.",
        ],
      },
      {
        heading: "Πλάνο υλοποίησης σε 4 βήματα",
        body: [
          "1. Επιλέξτε ενότητα (Βασική πρώτα). 2. Συγκεντρώστε ενός έτους λογαριασμούς ενέργειας, καύσιμα, απόβλητα, δεδομένα HR. 3. Απογραφή Scope 1+2 βάσει GHG Protocol. 4. Δημοσιεύστε — PDF, ιστοσελίδα, ή στην πύλη δεδομένων του πελάτη.",
        ],
      },
    ],
    keyTakeaways: [
      "Το VSME είναι το εθελοντικό πρότυπο της EFRAG για μη-εισηγμένες ΜμΕ, ευθυγραμμισμένο με ESRS/CSRD.",
      "Δύο ενότητες: Βασική και Περιεκτική.",
      "Χωρίς διπλή ουσιαστικότητα, XBRL ή υποχρεωτική διασφάλιση.",
      "Μία αναφορά VSME αντικαθιστά πολλά ερωτηματολόγια.",
    ],
    faq: [
      { q: "Είναι υποχρεωτικό το VSME;", a: "Όχι, είναι εθελοντικό. Αλλά αν οι πελάτες/τράπεζές σας είναι εντός CSRD, θα σας ζητήσουν ισοδύναμα δεδομένα." },
      { q: "Χρειάζομαι ελεγκτή για VSME;", a: "Όχι, δεν απαιτείται διασφάλιση από το πρότυπο." },
      { q: "Πώς αντιστοιχίζεται στο CSRD;", a: "Κάθε datapoint του VSME συνδέεται με ESRS datapoint. Καταναλώνεται απευθείας από CSRD-αναφέροντες." },
      { q: "Ποια ενότητα να ξεκινήσω;", a: "Ξεκινήστε από τη Βασική. Μεταβείτε σε Περιεκτική όταν το ζητήσει μεγάλος πελάτης ή τράπεζα." },
    ],
    ctaHeading: "Δημοσιεύστε αναφορά VSME σε εβδομάδες",
    ctaBody: "Η VerdeIQ παράγει συμμορφούμενη αναφορά VSME από τους λογαριασμούς ενέργειας και τα HR δεδομένα σας — χωρίς συμβούλους.",
  },
});
