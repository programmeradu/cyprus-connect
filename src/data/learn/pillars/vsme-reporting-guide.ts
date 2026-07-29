import { makePillar } from "./_factory";

export const vsmeReportingGuide = makePillar({
  slug: "vsme-reporting-guide",
  category: "sme",
  primaryKeyword: "VSME reporting",
  monthlyVolume: 20,
  readingMinutes: 14,
  relatedSlugs: ["csrd-reporting-guide", "carbon-accounting-for-smes", "esrs-standards-explained", "sustainability-kpis-for-smes"],
  en: {
    title: "VSME Reporting Standard: The SME Guide to Proportionate ESG Disclosure",
    metaTitle: "VSME Standard Guide 2026 — Voluntary SME Reporting Explained",
    metaDescription:
      "The VSME (Voluntary SME) standard gives non-listed SMEs a proportionate way to answer CSRD data requests. Modules, timelines, datapoints, and how to adopt it.",
    heroEyebrow: "SME Standard",
    heroSubtitle:
      "Built by EFRAG for the ~50m non-listed SMEs in Europe, VSME lets you answer customer, bank, and investor ESG questions once — in a format aligned with CSRD.",
    tocLabel: "On this page",
    introduction: [
      "The Voluntary Sustainability Reporting Standard for non-listed SMEs (VSME) was published by EFRAG to solve one specific problem: the flood of inconsistent ESG questionnaires SMEs receive from customers, lenders, and investors trying to complete their own CSRD reports.",
      "Instead of filling in a different template for every counterparty, an SME publishes one VSME report and shares it with everyone. VSME is deliberately proportionate — no double materiality assessment, no XBRL tagging, no mandatory assurance — while still mapping cleanly to ESRS datapoints.",
      "This guide covers the two-module structure, what each disclosure actually asks for, the exact datapoints per module, cost benchmarks, and how to produce a first VSME report in weeks rather than months.",
    ],
    sections: [
      {
        heading: "The two modules: Basic and Comprehensive",
        body: [
          "The Basic Module is the minimum. It covers organizational information, environmental data (energy, GHG Scope 1 and 2, water, pollution, biodiversity, waste), and social data (workforce, health & safety, human rights, community). Most SMEs start here.",
          "The Comprehensive Module adds strategy, business-model resilience, transition plan alignment, additional workforce metrics, GHG Scope 3 (where material), and governance disclosures. It's the format larger customers and banks increasingly request from Tier-1 suppliers.",
          "The two modules are cumulative, not alternative. A Comprehensive report includes everything in Basic plus the additional disclosures — so an SME that starts Basic and later upgrades never has to redo prior work.",
        ],
      },
      {
        heading: "Why VSME is the pragmatic choice for SMEs",
        body: [
          "VSME uses simplified methodology (spend-based emission factors accepted), no assurance requirement, and disclosures scale to size. Adoption cost is a fraction of CSRD's, but the output satisfies most upstream data requests including EBA Pillar 3 ESG, bank ESG questionnaires, and EU Taxonomy alignment for lender partners.",
          "For SMEs already receiving 3+ different ESG questionnaires per year, publishing a VSME report typically pays back the effort inside one cycle. The alternative — bespoke responses per counterparty — scales the cost linearly with every new customer or lender you win.",
        ],
      },
      {
        heading: "The Basic Module datapoints in detail",
        body: [
          "General information (B1): legal form, NACE code, countries of operation, group boundary, and whether the report covers a consolidated or standalone entity. This section takes about an hour if your registrations are current.",
          "Environmental (B3–B8): energy consumption by fuel type (kWh); Scope 1 emissions from combustion, fugitive refrigerants, and process; Scope 2 emissions with both location-based and market-based methods; water withdrawal in areas of water stress; hazardous and non-hazardous waste by disposal route; land use and pollution incidents where material.",
          "Social (B9–B11): headcount split by gender and country, employee turnover, health and safety incident rate (recordable injuries per million hours worked), collective bargaining coverage, and training hours per employee. Most of this is already in payroll or HR systems.",
          "Governance (B12): convictions and fines related to corruption or bribery in the reporting period. Usually a one-line disclosure of 'none' for SMEs with clean records.",
        ],
      },
      {
        heading: "The Comprehensive Module: what's added",
        body: [
          "Strategy and business model (C1–C2): a concise narrative on how sustainability risks and opportunities affect the business model, and any transition plan aligned to 1.5°C.",
          "Additional environmental (C3–C4): Scope 3 emissions where material — the standard accepts spend-based for a first pass — plus GHG reduction targets if publicly committed.",
          "Additional social (C5–C7): human rights due diligence in the supply chain, incidents of discrimination, and community engagement disclosures.",
          "Governance (C8–C9): board composition, gender diversity of management, and revenue derived from controversial sectors (fossil, tobacco, weapons, gambling) — the same list banks screen against under SFDR.",
        ],
      },
      {
        heading: "A four-step VSME implementation plan",
        body: [
          "1. Pick the module (Basic first). 2. Assemble one year of energy bills, fuel purchases, waste manifests, and HR headcount data. 3. Run a Scope 1+2 inventory using the GHG Protocol; use spend-based factors for Scope 3 if you elect the Comprehensive Module. 4. Publish the disclosure — a PDF, a webpage, or an entry in your customer's data portal.",
          "Companies typically complete a first Basic report in 4–8 weeks with software and 3–5 months with spreadsheets and a consultant. The second cycle drops to under two weeks because the data-collection templates are already wired to source systems.",
        ],
      },
      {
        heading: "Cost, effort, and payback",
        body: [
          "Direct software cost for a mid-sized SME (50–250 FTE) sits in the €3–8k/year range for Basic Module reporting. Consultant-led first reports typically land at €10–25k. In both cases, the biggest hidden cost is the internal time to chase down electricity meter data, refrigerant logs, and supplier invoices — which is exactly what a purpose-built tool automates.",
          "Payback shows up in three places: fewer bespoke questionnaires (each takes 20–60 hours of finance/ops time), better lending terms as banks fold ESG into pricing under EBA Pillar 3, and shorter procurement cycles with large customers who screen suppliers on ESG data availability.",
        ],
      },
    ],
    keyTakeaways: [
      "VSME is EFRAG's voluntary standard for non-listed SMEs, published to align with ESRS/CSRD without the full compliance burden.",
      "Two cumulative modules: Basic (minimum) and Comprehensive (for larger suppliers). Comprehensive includes everything in Basic plus additions.",
      "No double materiality, no XBRL, no mandatory assurance — proportionate by design.",
      "One VSME report replaces many bespoke ESG questionnaires from customers and banks.",
      "Realistic budget: €3–8k software or €10–25k consultant for a first Basic report; year-two effort drops by 5–10×.",
    ],
    faq: [
      { q: "Is VSME mandatory?", a: "No. VSME is voluntary. But if your customers or banks are CSRD-scoped, they will effectively require you to provide equivalent data — VSME is the proportionate way to do it." },
      { q: "Do I need an auditor for VSME?", a: "No, VSME does not require assurance. Some banks or customers may request it for higher-risk suppliers, but it is not part of the standard." },
      { q: "How does VSME map to CSRD/ESRS?", a: "Every VSME datapoint traces to an ESRS datapoint. Your report can be consumed directly by CSRD-reporting customers with no re-mapping." },
      { q: "Which module should I start with?", a: "Start with Basic. Move to Comprehensive when a large customer or lender specifically asks for it, or when you supply into a Tier-1 CSRD reporter." },
      { q: "Can I use spend-based emission factors for Scope 3 under VSME?", a: "Yes. The Comprehensive Module explicitly accepts spend-based methodology for Scope 3 in the first cycles, upgrading to activity-based or supplier-specific over time." },
      { q: "How often do I have to publish a VSME report?", a: "Annually, aligned with your financial year. There is no formal filing deadline — the standard leaves timing to the reporter, though most publish alongside annual accounts." },
    ],
    ctaHeading: "Publish a VSME report in weeks, not months",
    ctaBody:
      "Vuneli generates a compliant VSME Basic or Comprehensive report from your energy bills and HR data — no consultants, no spreadsheets. Share it with every customer and bank in one link.",
  },
  el: {
    title: "Πρότυπο VSME: Ο Οδηγός ΜμΕ για Αναλογική ESG Αναφορά",
    metaTitle: "Οδηγός VSME 2026 — Εθελοντική Αναφορά ΜμΕ",
    metaDescription:
      "Το VSME δίνει στις μη-εισηγμένες ΜμΕ έναν αναλογικό τρόπο να απαντούν σε αιτήματα δεδομένων CSRD. Ενότητες, χρονοδιαγράμματα, datapoints, υιοθέτηση.",
    heroEyebrow: "Πρότυπο ΜμΕ",
    heroSubtitle:
      "Δημιουργήθηκε από την EFRAG για τις ~50 εκατ. μη-εισηγμένες ΜμΕ της Ευρώπης. Απαντάτε σε ερωτήσεις πελατών, τραπεζών και επενδυτών μία φορά — σε μορφή συμβατή με CSRD.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Το Εθελοντικό Πρότυπο Αναφοράς Βιωσιμότητας για μη-εισηγμένες ΜμΕ (VSME) δημοσιεύτηκε από την EFRAG για να λύσει ένα συγκεκριμένο πρόβλημα: την πλημμύρα ασυνεπών ESG ερωτηματολογίων που λαμβάνουν οι ΜμΕ.",
      "Αντί να συμπληρώνετε διαφορετικά templates για κάθε αντισυμβαλλόμενο, δημοσιεύετε μία αναφορά VSME και τη μοιράζεστε. Το VSME είναι σκόπιμα αναλογικό — χωρίς διπλή ουσιαστικότητα, χωρίς XBRL, χωρίς υποχρεωτική διασφάλιση — και αντιστοιχίζεται καθαρά με ESRS.",
      "Αυτός ο οδηγός καλύπτει τις δύο ενότητες, τα ακριβή datapoints, το κόστος, και πώς να παράξετε την πρώτη σας αναφορά VSME σε εβδομάδες.",
    ],
    sections: [
      {
        heading: "Οι δύο ενότητες: Βασική και Περιεκτική",
        body: [
          "Η Βασική Ενότητα είναι το ελάχιστο. Καλύπτει οργανωτικά στοιχεία, περιβαλλοντικά δεδομένα (ενέργεια, Scope 1 & 2, νερό, ρύπανση, βιοποικιλότητα, απόβλητα) και κοινωνικά (εργατικό δυναμικό, ΥΑΕ, ανθρώπινα δικαιώματα).",
          "Η Περιεκτική Ενότητα προσθέτει στρατηγική, ανθεκτικότητα, Scope 3 (όπου ουσιώδες), και γνωστοποιήσεις διακυβέρνησης. Συχνά ζητείται από Tier-1 πελάτες.",
          "Οι δύο ενότητες είναι αθροιστικές: μια Περιεκτική αναφορά περιλαμβάνει τα πάντα της Βασικής συν τις προσθήκες. Δεν υπάρχει επανάληψη εργασίας όταν αναβαθμίζεστε.",
        ],
      },
      {
        heading: "Γιατί το VSME είναι η πραγματιστική επιλογή",
        body: [
          "Το VSME χρησιμοποιεί απλοποιημένη μεθοδολογία (spend-based συντελεστές), δεν απαιτεί διασφάλιση, και οι γνωστοποιήσεις κλιμακώνονται στο μέγεθος. Το κόστος υιοθέτησης είναι κλάσμα του CSRD.",
          "Για ΜμΕ με 3+ διαφορετικά ESG ερωτηματολόγια ετησίως, η δημοσίευση μιας αναφοράς VSME αποσβήνεται σε έναν κύκλο.",
        ],
      },
      {
        heading: "Τα datapoints της Βασικής Ενότητας",
        body: [
          "Γενικά (B1): νομική μορφή, ΚΑΔ/NACE, χώρες δραστηριοποίησης, όριο ομίλου. Περίπου μία ώρα εργασίας.",
          "Περιβαλλοντικά (B3–B8): κατανάλωση ενέργειας ανά τύπο καυσίμου, Scope 1 από καύση/ψυκτικά/διεργασία, Scope 2 (location- και market-based), νερό σε περιοχές υδατικής πίεσης, επικίνδυνα/μη-επικίνδυνα απόβλητα ανά τρόπο διάθεσης.",
          "Κοινωνικά (B9–B11): αριθμός εργαζομένων ανά φύλο/χώρα, κύκλος εργαζομένων, δείκτης ΥΑΕ ατυχημάτων, κάλυψη συλλογικών συμβάσεων, ώρες εκπαίδευσης. Τα περισσότερα υπάρχουν ήδη στο μισθολογικό σας.",
          "Διακυβέρνηση (B12): καταδίκες/πρόστιμα για δωροδοκία ή διαφθορά. Συνήθως μία γραμμή 'κανένα'.",
        ],
      },
      {
        heading: "Η Περιεκτική Ενότητα: τι προστίθεται",
        body: [
          "Στρατηγική (C1–C2): σύντομη αφήγηση πώς κίνδυνοι/ευκαιρίες βιωσιμότητας επηρεάζουν το μοντέλο, τυχόν σχέδιο μετάβασης 1,5°C.",
          "Επιπλέον περιβαλλοντικά (C3–C4): Scope 3 όπου ουσιώδες (spend-based αρχικά), στόχοι μείωσης εκπομπών αν έχετε δεσμευθεί.",
          "Επιπλέον κοινωνικά (C5–C7): δέουσα επιμέλεια ανθρωπίνων δικαιωμάτων, περιστατικά διακρίσεων, εμπλοκή κοινότητας.",
          "Διακυβέρνηση (C8–C9): σύνθεση ΔΣ, ισότητα φύλων σε διοίκηση, έσοδα από αμφιλεγόμενους τομείς (ορυκτά καύσιμα, καπνός, όπλα, τυχερά παίγνια).",
        ],
      },
      {
        heading: "Πλάνο υλοποίησης σε 4 βήματα",
        body: [
          "1. Επιλέξτε ενότητα (Βασική πρώτα). 2. Συγκεντρώστε ενός έτους λογαριασμούς ενέργειας, καύσιμα, απόβλητα, δεδομένα HR. 3. Απογραφή Scope 1+2 βάσει GHG Protocol. 4. Δημοσιεύστε — PDF, ιστοσελίδα, ή πύλη πελάτη.",
          "Πρώτη αναφορά Βασικής: 4–8 εβδομάδες με λογισμικό, 3–5 μήνες με σύμβουλο. Ο δεύτερος κύκλος πέφτει σε <2 εβδομάδες.",
        ],
      },
      {
        heading: "Κόστος, προσπάθεια και απόσβεση",
        body: [
          "Λογισμικό για μεσαία ΜμΕ (50–250 FTE): €3–8χιλ./έτος για Βασική Ενότητα. Πρώτη αναφορά με σύμβουλο: €10–25χιλ. Το μεγαλύτερο κρυφό κόστος είναι ο εσωτερικός χρόνος για συλλογή στοιχείων.",
          "Η απόσβεση έρχεται από: λιγότερα ερωτηματολόγια (20–60 ώρες το καθένα), καλύτερους όρους δανεισμού μέσω EBA Pillar 3, ταχύτερους κύκλους προμηθειών.",
        ],
      },
    ],
    keyTakeaways: [
      "Το VSME είναι το εθελοντικό πρότυπο της EFRAG για μη-εισηγμένες ΜμΕ, ευθυγραμμισμένο με ESRS/CSRD.",
      "Δύο αθροιστικές ενότητες: Βασική και Περιεκτική.",
      "Χωρίς διπλή ουσιαστικότητα, XBRL ή υποχρεωτική διασφάλιση.",
      "Μία αναφορά VSME αντικαθιστά πολλά ερωτηματολόγια.",
      "Ρεαλιστικός προϋπολογισμός: €3–8χιλ. λογισμικό ή €10–25χιλ. σύμβουλος πρώτης χρονιάς.",
    ],
    faq: [
      { q: "Είναι υποχρεωτικό το VSME;", a: "Όχι, εθελοντικό. Αλλά αν οι πελάτες/τράπεζές σας είναι εντός CSRD, θα σας ζητήσουν ισοδύναμα δεδομένα." },
      { q: "Χρειάζομαι ελεγκτή για VSME;", a: "Όχι, δεν απαιτείται διασφάλιση από το πρότυπο." },
      { q: "Πώς αντιστοιχίζεται στο CSRD;", a: "Κάθε datapoint του VSME συνδέεται με ESRS datapoint. Καταναλώνεται απευθείας από CSRD-αναφέροντες." },
      { q: "Ποια ενότητα να ξεκινήσω;", a: "Ξεκινήστε από τη Βασική. Μεταβείτε σε Περιεκτική όταν το ζητήσει μεγάλος πελάτης ή τράπεζα." },
      { q: "Μπορώ να χρησιμοποιήσω spend-based συντελεστές για Scope 3;", a: "Ναι. Η Περιεκτική Ενότητα δέχεται ρητά spend-based μεθοδολογία στους πρώτους κύκλους." },
      { q: "Πόσο συχνά δημοσιεύω;", a: "Ετησίως, μαζί με τις οικονομικές καταστάσεις. Το πρότυπο δεν επιβάλλει επίσημη προθεσμία." },
    ],
    ctaHeading: "Δημοσιεύστε αναφορά VSME σε εβδομάδες",
    ctaBody:
      "Η Vuneli παράγει συμμορφούμενη αναφορά VSME (Βασική ή Περιεκτική) από τους λογαριασμούς ενέργειας και τα HR δεδομένα σας — χωρίς συμβούλους.",
  },
});
