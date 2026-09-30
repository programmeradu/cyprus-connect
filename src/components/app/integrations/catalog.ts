/**
 * The connector catalogue.
 *
 * Every entry names a real service and carries its real mark. The marks are
 * the artwork already held in /public/integrations, in a light and a dark
 * cut, so a logo never sits on a plate it cannot be read against.
 *
 * `state` says what the platform can do with the service today:
 *   live       the data flows now, no account needed from the operator
 *   oauth      the operator links an account, and the link is read at runtime
 *   upload     the operator uploads a document (a bill) and it is read
 *   scheduled  the connector is built but held for a later release
 *
 * A connector that is `scheduled` never shows a control that does nothing.
 */

export type ConnectorState = "live" | "oauth" | "upload" | "scheduled";

export type ConnectorCategory = "accounting" | "grid" | "reference" | "public";

export interface Connector {
  id: string;
  name: string;
  /** One line, both locales. Says what the connection gives the workspace. */
  desc: { en: string; el: string };
  /** What the figures are used for, once connected. */
  gives: { en: string; el: string };
  category: ConnectorCategory;
  state: ConnectorState;
  /** Marks live in /public/integrations and ship in two cuts. */
  light: string;
  dark: string;
  /** Height of the mark inside the 40px tile, in px. Tuned per artwork. */
  markHeight: number;
  /** Where the data comes from, named for the audit trail. */
  source: string;
  href?: string;
}

export const CATEGORY_ORDER: ConnectorCategory[] = [
  "accounting",
  "grid",
  "reference",
  "public",
];

export const CATEGORY_LABEL: Record<ConnectorCategory, { en: string; el: string }> = {
  accounting: { en: "Banking and accounting", el: "Τράπεζα και λογιστική" },
  grid: { en: "Energy, water and grid", el: "Ενέργεια, νερό και δίκτυο" },
  reference: { en: "Reference and benchmark data", el: "Δεδομένα αναφοράς" },
  public: { en: "Cyprus public services", el: "Δημόσιες υπηρεσίες Κύπρου" },
};

export const CATEGORY_NOTE: Record<ConnectorCategory, { en: string; el: string }> = {
  accounting: {
    en: "Payments and ledger lines show where energy, fuel and freight money goes, with each line kept as evidence.",
    el: "Πληρωμές και λογιστικές γραμμές δείχνουν πού πάνε τα χρήματα για ενέργεια, καύσιμα και μεταφορές, με κάθε γραμμή ως τεκμήριο.",
  },
  grid: {
    en: "Measured grid carbon for Cyprus, and your own electricity and water use read from your EAC and water board bills.",
    el: "Μετρημένος άνθρακας δικτύου για την Κύπρο και η δική σας κατανάλωση ρεύματος και νερού από τους λογαριασμούς ΑΗΚ και υδατοπρομήθειας.",
  },
  reference: {
    en: "Sector averages and third-party emission estimates used to test your own figures.",
    el: "Μέσοι όροι κλάδου και εκτιμήσεις τρίτων για έλεγχο των δικών σας αριθμών.",
  },
  public: {
    en: "Cyprus registries and payment rails. Held for the release that files on your behalf.",
    el: "Κυπριακά μητρώα και συστήματα πληρωμών. Σε αναμονή για επόμενη έκδοση.",
  },
};

export const CONNECTORS: Connector[] = [
  {
    id: "bankofcyprus",
    name: "Bank of Cyprus",
    desc: {
      en: "Business account payments, read-only. Nothing can be paid or moved.",
      el: "Πληρωμές επαγγελματικού λογαριασμού, μόνο ανάγνωση. Δεν γίνεται καμία πληρωμή.",
    },
    gives: {
      en: "Fuel, electricity, water and freight spend found in your payments, with the rule that matched each one.",
      el: "Δαπάνες για καύσιμα, ρεύμα, νερό και μεταφορές από τις πληρωμές σας, με τον κανόνα που ταίριαξε σε καθεμία.",
    },
    category: "accounting",
    state: "oauth",
    light: "/integrations/bankofcyprus-light.png",
    dark: "/integrations/bankofcyprus-dark.png",
    markHeight: 22,
    source: "Bank of Cyprus PSD2 Accounts API",
  },
  {
    id: "saltedge",
    name: "Other Cyprus banks",
    desc: {
      en: "Eurobank (including former Hellenic Bank accounts) and Alpha Bank Cyprus, through Salt Edge. Read-only.",
      el: "Eurobank (και πρώην λογαριασμοί Ελληνικής Τράπεζας) και Alpha Bank Κύπρου, μέσω Salt Edge. Μόνο ανάγνωση.",
    },
    gives: {
      en: "Business payments sorted into fuel, electricity, water and freight spending.",
      el: "Επαγγελματικές πληρωμές ταξινομημένες σε καύσιμα, ρεύμα, νερό και μεταφορές.",
    },
    category: "accounting",
    state: "oauth",
    light: "/integrations/saltedge-light.svg",
    dark: "/integrations/saltedge-dark.svg",
    markHeight: 20,
    source: "Salt Edge account information (PSD2)",
    href: "https://www.saltedge.com",
  },
  {
    id: "nango",
    name: "ERP and accounting systems",
    desc: {
      en: "Sage, SAP Business One, NetSuite, Dynamics 365, QuickBooks, Xero, Zoho Books and FreshBooks, through Nango. Read-only.",
      el: "Sage, SAP Business One, NetSuite, Dynamics 365, QuickBooks, Xero, Zoho Books και FreshBooks, μέσω Nango. Μόνο ανάγνωση.",
    },
    gives: {
      en: "Supplier bills and ledger accounts turned into spend-based supply-chain (Scope 3) lines.",
      el: "Τιμολόγια προμηθευτών και λογαριασμοί καθολικού σε γραμμές Scope 3 βάσει δαπανών.",
    },
    category: "accounting",
    state: "oauth",
    light: "/integrations/nango-light.svg",
    dark: "/integrations/nango-dark.svg",
    markHeight: 18,
    source: "Nango unified API",
    href: "https://www.nango.dev",
  },
  {
    id: "eac",
    name: "Electricity Authority of Cyprus",
    desc: {
      en: "EAC has no public connection, so you upload the bill. Vuneli reads the period, kWh and amount, and keeps the bill as evidence.",
      el: "Η ΑΗΚ δεν έχει δημόσια σύνδεση, οπότε ανεβάζετε τον λογαριασμό. Η Vuneli διαβάζει περίοδο, kWh και ποσό, και κρατά τον λογαριασμό ως τεκμήριο.",
    },
    gives: {
      en: "Scope 2 electricity from each bill, at the published Cyprus grid factor.",
      el: "Scope 2 ηλεκτρισμού από κάθε λογαριασμό, με τον δημοσιευμένο κυπριακό συντελεστή.",
    },
    category: "grid",
    state: "upload",
    light: "/integrations/eac-light.png",
    dark: "/integrations/eac-dark.png",
    markHeight: 30,
    source: "Your EAC bills (PDF or photo)",
  },
  {
    id: "water",
    name: "Water Board of Nicosia",
    desc: {
      en: "Water boards have no public connection, so you upload the bill. Vuneli reads the period, m³ and amount. Limassol, Larnaca and Paphos bills are read too.",
      el: "Τα συμβούλια υδατοπρομήθειας δεν έχουν δημόσια σύνδεση, οπότε ανεβάζετε τον λογαριασμό. Η Vuneli διαβάζει περίοδο, m³ και ποσό. Διαβάζονται και λογαριασμοί Λεμεσού, Λάρνακας και Πάφου.",
    },
    gives: {
      en: "Scope 3 water supply and treatment from each bill, at the published factor.",
      el: "Scope 3 υδροδότησης και επεξεργασίας νερού από κάθε λογαριασμό, με τον δημοσιευμένο συντελεστή.",
    },
    category: "grid",
    state: "upload",
    light: "/integrations/wbn.png",
    dark: "/integrations/wbn.png",
    markHeight: 30,
    source: "Your water board bills (PDF or photo)",
    href: "https://www.wbn.org.cy",
  },
  {
    id: "energy-charts",
    name: "Energy-Charts",
    desc: {
      en: "Measured hourly carbon intensity and renewable share of the Cyprus grid.",
      el: "Μετρημένη ωριαία ένταση άνθρακα και μερίδιο ανανεώσιμων του κυπριακού δικτύου.",
    },
    gives: {
      en: "Today's grid on Insights: the cleanest and dirtiest hour to use electricity.",
      el: "Το σημερινό δίκτυο στις Αναλύσεις: η καθαρότερη και η πιο ρυπογόνος ώρα.",
    },
    category: "grid",
    state: "live",
    light: "/integrations/energycharts-light.svg",
    dark: "/integrations/energycharts-dark.svg",
    markHeight: 28,
    source: "Energy-Charts, Fraunhofer ISE",
    href: "https://www.energy-charts.info",
  },
  {
    id: "climate-trace",
    name: "Climate TRACE",
    desc: {
      en: "Independent emission estimates by asset and by country.",
      el: "Ανεξάρτητες εκτιμήσεις εκπομπών ανά εγκατάσταση και χώρα.",
    },
    gives: {
      en: "Country and sector totals, shown as context. Never used to fill your own figures.",
      el: "Σύνολα χώρας και κλάδου, ως πλαίσιο. Ποτέ δεν συμπληρώνουν τους δικούς σας αριθμούς.",
    },
    category: "reference",
    state: "live",
    light: "/integrations/climatetrace-light.png",
    dark: "/integrations/climatetrace-dark.png",
    markHeight: 26,
    source: "Climate TRACE public dataset",
    href: "https://climatetrace.org",
  },
  {
    id: "wikirate",
    name: "WikiRate",
    desc: {
      en: "Company-reported ESG figures, held open for inspection.",
      el: "Δημοσιευμένοι δείκτες ESG εταιρειών, ανοικτοί σε έλεγχο.",
    },
    gives: {
      en: "How many Cyprus companies publish ESG figures there. Peer comparison opens once enough report to compare fairly.",
      el: "Πόσες κυπριακές εταιρείες δημοσιεύουν στοιχεία ESG εκεί. Η σύγκριση ανοίγει όταν δημοσιεύουν αρκετές.",
    },
    category: "reference",
    state: "live",
    light: "/integrations/wikirate-light.png",
    dark: "/integrations/wikirate-dark.png",
    markHeight: 26,
    source: "WikiRate API",
    href: "https://wikirate.org",
  },
  {
    id: "cystat",
    name: "CyStat",
    desc: {
      en: "The Statistical Service of Cyprus.",
      el: "Η Στατιστική Υπηρεσία Κύπρου.",
    },
    gives: {
      en: "How many establishments in Cyprus work in your sector, from the national business register.",
      el: "Πόσες μονάδες στην Κύπρο δραστηριοποιούνται στον κλάδο σας, από το μητρώο επιχειρήσεων.",
    },
    category: "reference",
    state: "live",
    light: "/integrations/cystat-light.png",
    dark: "/integrations/cystat-dark.png",
    markHeight: 28,
    source: "CyStat Business Register, establishments by NACE",
    href: "https://cystatdb.cystat.gov.cy",
  },
  {
    id: "govcy",
    name: "gov.cy / Ariadni",
    desc: {
      en: "The national identity and services gateway.",
      el: "Η εθνική πύλη ταυτοποίησης και υπηρεσιών.",
    },
    gives: {
      en: "Signed-in company identity, so a filing carries a real signatory.",
      el: "Ταυτοποίηση εταιρείας, ώστε η υποβολή να φέρει πραγματικό υπογράφοντα.",
    },
    category: "public",
    state: "scheduled",
    light: "/integrations/govcy-light.png",
    dark: "/integrations/govcy-dark.png",
    markHeight: 30,
    source: "Ariadni identity gateway",
  },
  {
    id: "registrar",
    name: "Registrar of Companies",
    desc: {
      en: "The Cyprus companies and intellectual property registry.",
      el: "Το μητρώο εταιρειών και διανοητικής ιδιοκτησίας Κύπρου.",
    },
    gives: {
      en: "Legal name, registration number and filing dates for the report cover.",
      el: "Επωνυμία, αριθμός εγγραφής και ημερομηνίες για το εξώφυλλο.",
    },
    category: "public",
    state: "scheduled",
    light: "/integrations/companies-light.svg",
    dark: "/integrations/companies-dark.svg",
    markHeight: 28,
    source: "Department of Registrar of Companies",
  },
  {
    id: "jcc",
    name: "JCC Payment Systems",
    desc: {
      en: "The Cyprus card processor.",
      el: "Ο κυπριακός επεξεργαστής καρτών.",
    },
    gives: {
      en: "Subscription and credit payment in euro, settled locally.",
      el: "Πληρωμή συνδρομής και μονάδων σε ευρώ, τοπικά.",
    },
    category: "public",
    state: "scheduled",
    light: "/integrations/jcc-light.png",
    dark: "/integrations/jcc-dark.png",
    markHeight: 26,
    source: "JCC Gateway",
  },
];
