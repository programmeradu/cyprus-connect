/**
 * EFRAG Voluntary SME Standard (VSME) — Basic Module schema.
 * Reference: EFRAG VSME ED "Basic Module", disclosures B1–B12.
 *
 * Each disclosure = a section with a set of fields. Types:
 *   - text          → multi-line textarea
 *   - shorttext     → single-line
 *   - number        → numeric
 *   - yesno         → yes/no radio
 *   - select        → one of options
 *
 * Bilingual EN + EL. All content stays client-side.
 */

export type VsmeFieldType = "text" | "shorttext" | "number" | "yesno" | "select";

export type VsmeField = {
  id: string;
  type: VsmeFieldType;
  label: { en: string; el: string };
  hint?: { en: string; el: string };
  unit?: string;
  options?: { value: string; en: string; el: string }[];
};

export type VsmeDisclosure = {
  id: string; // B1..B12
  code: string; // "B1"
  title: { en: string; el: string };
  purpose: { en: string; el: string };
  fields: VsmeField[];
};

export const VSME_BASIC: VsmeDisclosure[] = [
  {
    id: "B1",
    code: "B1",
    title: {
      en: "Basis for preparation",
      el: "Βάση κατάρτισης",
    },
    purpose: {
      en: "Identify the reporting entity, the period covered and the option applied (Basic or Basic + Comprehensive).",
      el: "Προσδιορισμός της αναφέρουσας οντότητας, της περιόδου και της επιλεγμένης ενότητας.",
    },
    fields: [
      { id: "entity", type: "shorttext", label: { en: "Legal entity name", el: "Επωνυμία νομικής οντότητας" } },
      { id: "vat", type: "shorttext", label: { en: "VAT / registration number", el: "Αριθμός ΦΠΑ / εγγραφής" } },
      { id: "country", type: "shorttext", label: { en: "Country of registration", el: "Χώρα εγγραφής" } },
      { id: "period", type: "shorttext", label: { en: "Reporting period", el: "Περίοδος αναφοράς" }, hint: { en: "e.g. 1 Jan – 31 Dec 2025", el: "π.χ. 1 Ιαν – 31 Δεκ 2025" } },
      {
        id: "option",
        type: "select",
        label: { en: "VSME option applied", el: "Επιλεγμένη ενότητα VSME" },
        options: [
          { value: "basic", en: "Basic Module only", el: "Μόνο Βασική Ενότητα" },
          { value: "basic_comprehensive", en: "Basic + Comprehensive Module", el: "Βασική + Ολοκληρωμένη Ενότητα" },
        ],
      },
      { id: "consolidation", type: "text", label: { en: "Consolidation scope", el: "Πεδίο ενοποίησης" }, hint: { en: "Subsidiaries, joint operations, associates included.", el: "Θυγατρικές, κοινές δραστηριότητες, συνδεδεμένες." } },
      { id: "omissions", type: "text", label: { en: "Omitted disclosures & reasoning", el: "Παραλείψεις αποκαλύψεων & αιτιολόγηση" }, hint: { en: "VSME allows 'if applicable' omissions — document them.", el: "Το VSME επιτρέπει παραλείψεις 'αν εφαρμόζεται' — τεκμηριώστε τις." } },
    ],
  },
  {
    id: "B2",
    code: "B2",
    title: { en: "Practices, policies and future initiatives", el: "Πρακτικές, πολιτικές και μελλοντικές πρωτοβουλίες" },
    purpose: {
      en: "Describe existing sustainability practices and any future initiatives for transitioning to a more sustainable economy.",
      el: "Περιγραφή υφιστάμενων πρακτικών βιωσιμότητας και μελλοντικών πρωτοβουλιών.",
    },
    fields: [
      { id: "hasPolicies", type: "yesno", label: { en: "Do you have formal sustainability policies?", el: "Έχετε επίσημες πολιτικές βιωσιμότητας;" } },
      { id: "policiesDesc", type: "text", label: { en: "Describe policies in force", el: "Περιγράψτε ισχύουσες πολιτικές" } },
      { id: "certifications", type: "text", label: { en: "Certifications held", el: "Πιστοποιήσεις" }, hint: { en: "e.g. ISO 14001, EMAS, B Corp, EU Ecolabel.", el: "π.χ. ISO 14001, EMAS, B Corp, EU Ecolabel." } },
      { id: "initiatives", type: "text", label: { en: "Planned initiatives (next 12 months)", el: "Προγραμματισμένες πρωτοβουλίες (12 μήνες)" } },
    ],
  },
  {
    id: "B3",
    code: "B3",
    title: { en: "Energy and greenhouse gas emissions", el: "Ενέργεια και εκπομπές αερίων του θερμοκηπίου" },
    purpose: {
      en: "Report total energy consumption split by source and Scope 1 + Scope 2 GHG emissions in tonnes CO₂-equivalent.",
      el: "Συνολική κατανάλωση ενέργειας ανά πηγή και εκπομπές Scope 1 + Scope 2 σε τόνους CO₂-eq.",
    },
    fields: [
      { id: "energyTotal", type: "number", label: { en: "Total energy consumption", el: "Συνολική κατανάλωση ενέργειας" }, unit: "MWh" },
      { id: "energyRenewable", type: "number", label: { en: "of which from renewable sources", el: "από ανανεώσιμες πηγές" }, unit: "MWh" },
      { id: "scope1", type: "number", label: { en: "Scope 1 emissions (direct)", el: "Scope 1 εκπομπές (άμεσες)" }, unit: "t CO₂e" },
      { id: "scope2Location", type: "number", label: { en: "Scope 2 emissions — location-based", el: "Scope 2 — location-based" }, unit: "t CO₂e" },
      { id: "scope2Market", type: "number", label: { en: "Scope 2 emissions — market-based", el: "Scope 2 — market-based" }, unit: "t CO₂e" },
      { id: "intensityRevenue", type: "number", label: { en: "GHG intensity per €M revenue", el: "Ένταση GHG ανά € εκ. εσόδων" }, unit: "t CO₂e / €M" },
      { id: "methodology", type: "text", label: { en: "Methodology & emission factors used", el: "Μεθοδολογία και συντελεστές εκπομπών" }, hint: { en: "e.g. GHG Protocol Corporate Standard, DEFRA 2024, IEA grid factors.", el: "π.χ. GHG Protocol, DEFRA 2024, συντελεστές IEA." } },
    ],
  },
  {
    id: "B4",
    code: "B4",
    title: { en: "Pollution of air, water and soil", el: "Ρύπανση αέρα, νερού και εδάφους" },
    purpose: {
      en: "Report pollutants released only if the entity is legally required to do so under EU or national environmental permits (E-PRTR).",
      el: "Ρύποι που εκλύονται μόνο αν απαιτείται από νομικές άδειες (E-PRTR).",
    },
    fields: [
      { id: "obligated", type: "yesno", label: { en: "Are you subject to E-PRTR or equivalent reporting?", el: "Υπόκειστε σε αναφορά E-PRTR ή ισοδύναμη;" } },
      { id: "pollutants", type: "text", label: { en: "Pollutants released (substance, medium, quantity)", el: "Ρύποι που εκλύθηκαν (ουσία, μέσο, ποσότητα)" }, hint: { en: "One line per pollutant. Skip if not obligated.", el: "Μία γραμμή ανά ρύπο. Παραλείψτε αν δεν υπόκειστε." } },
    ],
  },
  {
    id: "B5",
    code: "B5",
    title: { en: "Biodiversity", el: "Βιοποικιλότητα" },
    purpose: {
      en: "Disclose sites located in or near biodiversity-sensitive areas (Natura 2000, Key Biodiversity Areas).",
      el: "Χώροι σε ή κοντά σε ευαίσθητες περιοχές βιοποικιλότητας (Natura 2000).",
    },
    fields: [
      { id: "sensitiveSites", type: "yesno", label: { en: "Any sites in / near sensitive areas?", el: "Χώροι σε / κοντά σε ευαίσθητες περιοχές;" } },
      { id: "sitesList", type: "text", label: { en: "List sites and areas", el: "Λίστα χώρων και περιοχών" } },
    ],
  },
  {
    id: "B6",
    code: "B6",
    title: { en: "Water", el: "Νερό" },
    purpose: {
      en: "Report water withdrawal, with a breakdown for operations in water-stressed areas.",
      el: "Απορρόφηση νερού, με ανάλυση για δραστηριότητες σε περιοχές υδατικής πίεσης.",
    },
    fields: [
      { id: "withdrawal", type: "number", label: { en: "Total water withdrawal", el: "Συνολική απορρόφηση νερού" }, unit: "m³" },
      { id: "stressedWithdrawal", type: "number", label: { en: "of which in water-stressed areas", el: "εκ των οποίων σε περιοχές πίεσης" }, unit: "m³" },
    ],
  },
  {
    id: "B7",
    code: "B7",
    title: { en: "Resource use, circular economy and waste", el: "Πόροι, κυκλική οικονομία και απόβλητα" },
    purpose: {
      en: "Report total weight of waste generated, split by hazardous / non-hazardous, and share diverted from disposal.",
      el: "Συνολικό βάρος αποβλήτων, ανάλυση επικίνδυνων / μη-επικίνδυνων, ποσοστό εκτροπής.",
    },
    fields: [
      { id: "wasteTotal", type: "number", label: { en: "Total waste generated", el: "Συνολικά απόβλητα" }, unit: "t" },
      { id: "wasteHazardous", type: "number", label: { en: "Hazardous waste", el: "Επικίνδυνα απόβλητα" }, unit: "t" },
      { id: "wasteDiverted", type: "number", label: { en: "Diverted from disposal (recycled, reused)", el: "Εκτροπή από διάθεση (ανακύκλωση, επαναχρησιμοποίηση)" }, unit: "t" },
      { id: "circularNotes", type: "text", label: { en: "Circular practices notes", el: "Σημειώσεις κυκλικών πρακτικών" } },
    ],
  },
  {
    id: "B8",
    code: "B8",
    title: { en: "Workforce — general characteristics", el: "Ανθρώπινο δυναμικό — γενικά χαρακτηριστικά" },
    purpose: {
      en: "Headcount, contract type, gender split at reporting date.",
      el: "Αριθμός εργαζομένων, τύπος σύμβασης, κατανομή φύλου.",
    },
    fields: [
      { id: "headcount", type: "number", label: { en: "Total employees (headcount)", el: "Σύνολο εργαζομένων" } },
      { id: "permanent", type: "number", label: { en: "Permanent contracts", el: "Συμβάσεις αορίστου" } },
      { id: "temporary", type: "number", label: { en: "Temporary contracts", el: "Συμβάσεις ορισμένου" } },
      { id: "female", type: "number", label: { en: "Female employees", el: "Γυναίκες" } },
      { id: "male", type: "number", label: { en: "Male employees", el: "Άνδρες" } },
      { id: "other", type: "number", label: { en: "Other / not disclosed", el: "Άλλο / μη δηλωμένο" } },
      { id: "turnover", type: "number", label: { en: "Employee turnover rate", el: "Ποσοστό αποχώρησης" }, unit: "%" },
    ],
  },
  {
    id: "B9",
    code: "B9",
    title: { en: "Workforce — health and safety", el: "Ανθρώπινο δυναμικό — υγεία και ασφάλεια" },
    purpose: {
      en: "Report work-related injuries and fatalities among own workforce.",
      el: "Εργατικά ατυχήματα και θάνατοι στο δικό σας δυναμικό.",
    },
    fields: [
      { id: "recordable", type: "number", label: { en: "Recordable work-related injuries", el: "Καταγραφόμενα εργατικά ατυχήματα" } },
      { id: "fatalities", type: "number", label: { en: "Work-related fatalities", el: "Θάνατοι λόγω εργασίας" } },
      { id: "hoursWorked", type: "number", label: { en: "Total hours worked", el: "Συνολικές ώρες εργασίας" } },
    ],
  },
  {
    id: "B10",
    code: "B10",
    title: { en: "Remuneration, collective bargaining and training", el: "Αμοιβές, συλλογικές διαπραγματεύσεις και εκπαίδευση" },
    purpose: {
      en: "Gender pay gap, minimum wage compliance, collective bargaining coverage, average training hours.",
      el: "Μισθολογικό χάσμα φύλου, ελάχιστος μισθός, κάλυψη ΣΣΕ, ώρες εκπαίδευσης.",
    },
    fields: [
      { id: "payGap", type: "number", label: { en: "Gender pay gap", el: "Μισθολογικό χάσμα φύλου" }, unit: "%" },
      { id: "minWageCompliant", type: "yesno", label: { en: "All employees paid ≥ applicable minimum wage?", el: "Όλοι με μισθό ≥ κατώτατο;" } },
      { id: "cbaCoverage", type: "number", label: { en: "Collective bargaining coverage", el: "Κάλυψη ΣΣΕ" }, unit: "%" },
      { id: "trainingHours", type: "number", label: { en: "Average training hours per employee", el: "Μέσες ώρες εκπαίδευσης ανά εργαζόμενο" }, unit: "h" },
    ],
  },
  {
    id: "B11",
    code: "B11",
    title: { en: "Workers in the value chain, communities, consumers", el: "Εργαζόμενοι αλυσίδας αξίας, κοινότητες, καταναλωτές" },
    purpose: {
      en: "Confirmed incidents of human rights violations linked to your operations or value chain.",
      el: "Επιβεβαιωμένα περιστατικά παραβίασης ανθρωπίνων δικαιωμάτων.",
    },
    fields: [
      { id: "incidents", type: "number", label: { en: "Confirmed incidents in reporting period", el: "Επιβεβαιωμένα περιστατικά" } },
      { id: "actions", type: "text", label: { en: "Actions taken", el: "Ενέργειες" } },
    ],
  },
  {
    id: "B12",
    code: "B12",
    title: { en: "Convictions and fines for corruption and bribery", el: "Καταδίκες και πρόστιμα για διαφθορά και δωροδοκία" },
    purpose: {
      en: "Number of convictions and total amount of fines for violations of anti-corruption and anti-bribery laws.",
      el: "Αριθμός καταδικών και σύνολο προστίμων για παραβίαση νόμων κατά της διαφθοράς.",
    },
    fields: [
      { id: "convictions", type: "number", label: { en: "Number of convictions", el: "Αριθμός καταδικών" } },
      { id: "fines", type: "number", label: { en: "Total fines paid", el: "Συνολικά πρόστιμα" }, unit: "€" },
    ],
  },
];
