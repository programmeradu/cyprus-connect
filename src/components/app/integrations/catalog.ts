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
 *   scheduled  the connector is built but held for a later release
 *
 * A connector that is `scheduled` never shows a control that does nothing.
 */

export type ConnectorState = "live" | "oauth" | "scheduled";

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
  accounting: { en: "Accounting and billing", el: "Λογιστική και τιμολόγηση" },
  grid: { en: "Energy and grid", el: "Ενέργεια και δίκτυο" },
  reference: { en: "Reference and benchmark data", el: "Δεδομένα αναφοράς" },
  public: { en: "Cyprus public services", el: "Δημόσιες υπηρεσίες Κύπρου" },
};

export const CATEGORY_NOTE: Record<ConnectorCategory, { en: string; el: string }> = {
  accounting: {
    en: "Ledger lines become spend-based emission factors, with the invoice held as evidence.",
    el: "Οι λογιστικές γραμμές γίνονται συντελεστές εκπομπών, με το τιμολόγιο ως τεκμήριο.",
  },
  grid: {
    en: "Half-hourly grid carbon and tariff data for the Cyprus and EU zones.",
    el: "Δεδομένα άνθρακα δικτύου και τιμολογίων για Κύπρο και ΕΕ.",
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
    id: "quickbooks",
    name: "QuickBooks",
    desc: {
      en: "Accounting ledger, expenses and supplier invoices.",
      el: "Λογιστικό βιβλίο, δαπάνες και τιμολόγια προμηθευτών.",
    },
    gives: {
      en: "Spend-based Scope 3 lines, utility and travel expense capture.",
      el: "Γραμμές Scope 3 από δαπάνες, ενέργεια και ταξίδια.",
    },
    category: "accounting",
    state: "oauth",
    light: "/integrations/quickbooks-official-light.svg",
    dark: "/integrations/quickbooks-official-dark.svg",
    markHeight: 22,
    source: "Intuit QuickBooks Online API",
  },
  {
    id: "xero",
    name: "Xero",
    desc: {
      en: "Accounting ledger for Cyprus SMEs on Xero.",
      el: "Λογιστικό βιβλίο για κυπριακές ΜμΕ στο Xero.",
    },
    gives: {
      en: "The same spend-based lines as QuickBooks, from a Xero organisation.",
      el: "Οι ίδιες γραμμές δαπανών με το QuickBooks, από οργανισμό Xero.",
    },
    category: "accounting",
    state: "scheduled",
    light: "/integrations/xero-official-light.svg",
    dark: "/integrations/xero-official-dark.svg",
    markHeight: 26,
    source: "Xero Accounting API",
  },
  {
    id: "eac",
    name: "Electricity Authority of Cyprus",
    desc: {
      en: "The Cyprus grid operator: tariffs and metered consumption.",
      el: "Ο διαχειριστής δικτύου Κύπρου: τιμολόγια και καταναλώσεις.",
    },
    gives: {
      en: "Scope 2 electricity from the bill, at the Cyprus grid factor.",
      el: "Scope 2 ηλεκτρισμού από τον λογαριασμό, με τον κυπριακό συντελεστή.",
    },
    category: "grid",
    state: "scheduled",
    light: "/integrations/eac-light.png",
    dark: "/integrations/eac-dark.png",
    markHeight: 30,
    source: "EAC customer portal",
  },
  {
    id: "electricity-maps",
    name: "Electricity Maps",
    desc: {
      en: "Live carbon intensity and the renewable share of the grid.",
      el: "Ζωντανή ένταση άνθρακα και μερίδιο ανανεώσιμων στο δίκτυο.",
    },
    gives: {
      en: "The gCO2 per kWh applied to every hour of electricity use.",
      el: "Τα gCO2 ανά kWh για κάθε ώρα κατανάλωσης.",
    },
    category: "grid",
    state: "live",
    light: "/integrations/electricitymaps-light.png",
    dark: "/integrations/electricitymaps-dark.png",
    markHeight: 24,
    source: "Electricity Maps API",
    href: "https://www.electricitymaps.com",
  },
  {
    id: "openei",
    name: "OpenEI",
    desc: {
      en: "Utility tariff library, used for rate comparison.",
      el: "Βιβλιοθήκη τιμολογίων παρόχων, για σύγκριση τιμών.",
    },
    gives: {
      en: "The per-kWh rate behind the cost figures on this page.",
      el: "Η τιμή ανά kWh πίσω από τα κόστη αυτής της σελίδας.",
    },
    category: "grid",
    state: "live",
    light: "/integrations/openei-light.svg",
    dark: "/integrations/openei-dark.svg",
    markHeight: 22,
    source: "NREL OpenEI URDB",
    href: "https://openei.org",
  },
  {
    id: "climate-trace",
    name: "Climate TRACE",
    desc: {
      en: "Independent emission estimates by asset and by country.",
      el: "Ανεξάρτητες εκτιμήσεις εκπομπών ανά εγκατάσταση και χώρα.",
    },
    gives: {
      en: "The country total your own footprint is measured against.",
      el: "Το σύνολο χώρας με το οποίο συγκρίνεται το αποτύπωμά σας.",
    },
    category: "reference",
    state: "live",
    light: "/integrations/climatetrace-light.png",
    dark: "/integrations/climatetrace-dark.png",
    markHeight: 22,
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
      en: "Sector peer figures for the benchmark comparison.",
      el: "Στοιχεία ομοειδών εταιρειών για τη σύγκριση.",
    },
    category: "reference",
    state: "live",
    light: "/integrations/wikirate-light.png",
    dark: "/integrations/wikirate-dark.png",
    markHeight: 22,
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
      en: "Sector output and employment, used to size a Cyprus peer group.",
      el: "Παραγωγή και απασχόληση κλάδου, για ομάδα σύγκρισης στην Κύπρο.",
    },
    category: "reference",
    state: "scheduled",
    light: "/integrations/cystat-light.png",
    dark: "/integrations/cystat-dark.png",
    markHeight: 22,
    source: "CyStat open data",
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
    markHeight: 24,
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
    markHeight: 20,
    source: "JCC Gateway",
  },
];
