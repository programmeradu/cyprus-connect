/**
 * The one rulebook of legal deadlines. Browser-safe: no server imports.
 *
 * Each rule has its official source, a date rule and a fixed applicability
 * test on company facts. No AI decides whether a rule applies or what the
 * date is. Only rules verified against official texts are here; see
 * docs/research/DEADLINES_2026-10-01.md. When EUR-Lex shows a new act amending
 * a rule's base law, the rule shows as "under review" until a person confirms
 * it (law_watch).
 */

export type Match = "applies" | "might" | "not";
export type ObligationFactKey = "employees" | "revenue" | "cbam_goods" | "eudr_goods" | "consumer_claims";

export interface ObligationFacts {
  /** Lowest possible staff count. */
  employees: number | null;
  /** Highest possible staff count (null when open-ended band or unknown). */
  employeesMax: number | null;
  revenueEur: number | null;
  /** Tonnes of CBAM goods (excluding electricity and hydrogen) per import year. */
  cbamTonnesByYear: Record<number, number>;
  /** Imports electricity (CN 2716) or hydrogen (CN 2804 10 00): no mass threshold. */
  cbamNoThresholdGoods: boolean;
  /** Answer to "Do you import CBAM goods from outside the EU?" */
  importsCbamGoods: boolean | null;
  eudrCommodities: boolean | null;
  consumerClaims: boolean | null;
  /** Electricity used in the last 12 months, kWh, from bills/readings. Null = none recorded. */
  electricityKwh12m: number | null;
}

export interface Evaluation {
  match: Match;
  /** yyyy-mm-dd, or "" for ongoing duties with no single date. */
  dueDate: string;
  reason: { en: string; el: string };
  /** Set on "might": the fact that would settle it. */
  fact?: ObligationFactKey;
}

export interface Rule {
  id: string;
  framework: string;
  title: { en: string; el: string };
  detail: { en: string; el: string };
  /** CELEX numbers of the base laws; an amendment to any puts the rule under review. */
  baseCelex: string[];
  source: { label: string; url: string };
  agentKey: string;
  evaluate: (f: ObligationFacts, now: Date) => Evaluation;
}

const TJ_PER_KWH = 0.0000036;
const fmt = (n: number) => Math.round(n).toLocaleString("en-GB");
const r = (en: string, el: string) => ({ en, el });

/** Next 30 September on or after today, never before the first (2027). */
export function nextCbamDeclaration(now: Date): string {
  const y = now.getUTCFullYear();
  if (y < 2027) return "2027-09-30";
  const thisYear = new Date(Date.UTC(y, 8, 30, 23, 59));
  return now <= thisYear ? `${y}-09-30` : `${y + 1}-09-30`;
}

/** CBAM: authorised declarant above 50 t/year combined, or any electricity/hydrogen. */
function cbamApplies(f: ObligationFacts, now: Date): Evaluation & { year?: number; tonnes?: number } {
  const due = nextCbamDeclaration(now);
  const declYear = Number(due.slice(0, 4)) - 1;
  const tonnes = f.cbamTonnesByYear[declYear] ?? 0;
  if (f.cbamNoThresholdGoods) {
    return { match: "applies", dueDate: due, reason: r("You import electricity or hydrogen, which CBAM covers with no 50-tonne threshold.", "Εισάγετε ηλεκτρική ενέργεια ή υδρογόνο, που καλύπτονται από τον CBAM χωρίς όριο 50 τόνων.") };
  }
  if (tonnes > 50) {
    return { match: "applies", dueDate: due, year: declYear, tonnes, reason: r(`You recorded ${fmt(tonnes)} t of CBAM goods imported in ${declYear}, above the 50 t yearly threshold.`, `Καταγράψατε ${fmt(tonnes)} τ. αγαθών CBAM που εισήχθησαν το ${declYear}, πάνω από το ετήσιο όριο των 50 τ.`) };
  }
  if (tonnes > 0) {
    return { match: "not", dueDate: due, reason: r(`You recorded ${fmt(tonnes)} t of CBAM goods for ${declYear}, under the 50 t yearly threshold. This changes if imports pass 50 t.`, `Καταγράψατε ${fmt(tonnes)} τ. αγαθών CBAM για το ${declYear}, κάτω από το ετήσιο όριο των 50 τ.`) };
  }
  if (f.importsCbamGoods === false) {
    return { match: "not", dueDate: due, reason: r("You told us you do not import steel, aluminium, cement, fertilisers, hydrogen or electricity from outside the EU.", "Μας είπατε ότι δεν εισάγετε χάλυβα, αλουμίνιο, τσιμέντο, λιπάσματα, υδρογόνο ή ηλεκτρική ενέργεια από χώρες εκτός ΕΕ.") };
  }
  if (f.importsCbamGoods === true) {
    return { match: "might", dueDate: due, reason: r(`You import CBAM goods. It applies if ${declYear} imports pass 50 t; add your import lines on the CBAM page to check.`, `Εισάγετε αγαθά CBAM. Ισχύει αν οι εισαγωγές του ${declYear} ξεπεράσουν τους 50 τ.· προσθέστε τις γραμμές εισαγωγής στη σελίδα CBAM.`) };
  }
  return { match: "might", dueDate: due, fact: "cbam_goods", reason: r("Applies only to importers of steel, aluminium, cement, fertilisers, hydrogen or electricity from outside the EU.", "Ισχύει μόνο για εισαγωγείς χάλυβα, αλουμινίου, τσιμέντου, λιπασμάτων, υδρογόνου ή ηλεκτρικής ενέργειας από χώρες εκτός ΕΕ.") };
}

/** EU accounting size class from 2 of 3 criteria; we only hold staff and turnover. */
export function isMicroOrSmall(f: ObligationFacts): boolean | null {
  const staffSmall = f.employeesMax !== null && f.employeesMax <= 50;
  const staffLarge = f.employees !== null && f.employees > 50;
  const turnoverSmall = f.revenueEur !== null && f.revenueEur <= 15_000_000;
  const turnoverLarge = f.revenueEur !== null && f.revenueEur > 15_000_000;
  if (staffSmall && turnoverSmall) return true;
  if (staffLarge && turnoverLarge) return false;
  return null;
}

export const RULES: Rule[] = [
  {
    id: "cbam_declaration",
    framework: "CBAM",
    title: r("Annual CBAM declaration", "Ετήσια δήλωση CBAM"),
    detail: r("Declare the embedded emissions of last year's CBAM imports and surrender certificates, in the CBAM Registry.", "Δήλωση των ενσωματωμένων εκπομπών των περσινών εισαγωγών CBAM και παράδοση πιστοποιητικών στο Μητρώο CBAM."),
    baseCelex: ["32023R0956"],
    source: { label: "Reg. (EU) 2023/956 as amended by 2025/2083", url: "https://eur-lex.europa.eu/eli/reg/2025/2083/oj" },
    agentKey: "cbam",
    evaluate: (f, now) => cbamApplies(f, now),
  },
  {
    id: "cbam_certificates",
    framework: "CBAM",
    title: r("CBAM certificate purchases begin", "Έναρξη αγοράς πιστοποιητικών CBAM"),
    detail: r("Authorised declarants start buying CBAM certificates for 2026 imports on the common central platform.", "Οι εγκεκριμένοι δηλούντες αρχίζουν να αγοράζουν πιστοποιητικά CBAM για τις εισαγωγές του 2026."),
    baseCelex: ["32023R0956"],
    source: { label: "Reg. (EU) 2023/956 Art. 20, as amended by 2025/2083", url: "https://eur-lex.europa.eu/eli/reg/2025/2083/oj" },
    agentKey: "cbam",
    evaluate: (f, now) => {
      const base = cbamApplies(f, now);
      return { ...base, dueDate: "2027-02-01" };
    },
  },
  {
    id: "csrd_report",
    framework: "CSRD",
    title: r("CSRD sustainability report", "Έκθεση βιωσιμότητας CSRD"),
    detail: r("Only EU companies with more than 1,000 employees and more than EUR 450m net turnover report. Smaller companies may refuse data requests beyond the voluntary SME standard.", "Υποβάλλουν μόνο εταιρείες με πάνω από 1.000 εργαζόμενους και κύκλο εργασιών πάνω από 450 εκατ. ευρώ. Οι μικρότερες μπορούν να αρνηθούν αιτήματα πέρα από το εθελοντικό πρότυπο ΜμΕ."),
    baseCelex: ["32022L2464"],
    source: { label: "Directive (EU) 2026/470 (Omnibus I)", url: "https://eur-lex.europa.eu/eli/dir/2026/470/oj/eng" },
    agentKey: "reporter",
    evaluate: (f) => {
      const due = "2028-12-31";
      if (f.employeesMax !== null && f.employeesMax <= 1000) {
        return { match: "not", dueDate: due, reason: r("You have 1,000 employees or fewer. CSRD now applies only above 1,000 employees and EUR 450m turnover. If a large customer asks for data, you may limit it to the voluntary SME standard (VSME).", "Έχετε έως 1.000 εργαζόμενους. Η CSRD ισχύει πλέον μόνο πάνω από 1.000 εργαζόμενους και 450 εκατ. ευρώ κύκλο εργασιών. Αν μεγάλος πελάτης ζητήσει δεδομένα, μπορείτε να τα περιορίσετε στο εθελοντικό πρότυπο VSME.") };
      }
      if (f.revenueEur !== null && f.revenueEur <= 450_000_000) {
        return { match: "not", dueDate: due, reason: r("Your turnover is EUR 450m or less, under the CSRD threshold.", "Ο κύκλος εργασιών σας είναι έως 450 εκατ. ευρώ, κάτω από το όριο της CSRD.") };
      }
      if (f.employees !== null && f.employees > 1000 && f.revenueEur !== null && f.revenueEur > 450_000_000) {
        return { match: "applies", dueDate: due, reason: r("Over 1,000 employees and over EUR 450m turnover. First report in 2028 on financial year 2027.", "Πάνω από 1.000 εργαζόμενοι και 450 εκατ. ευρώ κύκλος εργασιών. Πρώτη έκθεση το 2028 για το οικονομικό έτος 2027.") };
      }
      return { match: "might", dueDate: due, fact: f.employees === null ? "employees" : "revenue", reason: r("Applies only above 1,000 employees and EUR 450m turnover.", "Ισχύει μόνο πάνω από 1.000 εργαζόμενους και 450 εκατ. ευρώ κύκλο εργασιών.") };
    },
  },
  {
    id: "eudr_statement",
    framework: "EUDR",
    title: r("Deforestation due-diligence statements", "Δηλώσεις δέουσας επιμέλειας για την αποψίλωση"),
    detail: r("Before selling or exporting cattle, cocoa, coffee, palm oil, rubber, soya or wood products, file a due-diligence statement in the EU information system.", "Πριν από πώληση ή εξαγωγή προϊόντων βοοειδών, κακάο, καφέ, φοινικέλαιου, καουτσούκ, σόγιας ή ξύλου, υποβολή δήλωσης δέουσας επιμέλειας."),
    baseCelex: ["32023R1115"],
    source: { label: "Reg. (EU) 2023/1115 as amended by 2025/2650", url: "https://eur-lex.europa.eu/eli/reg/2023/1115" },
    agentKey: "advisor",
    evaluate: (f) => {
      if (f.eudrCommodities === false) {
        return { match: "not", dueDate: "2026-12-30", reason: r("You told us you do not sell or export products made from these commodities.", "Μας είπατε ότι δεν πουλάτε ούτε εξάγετε προϊόντα από αυτά τα εμπορεύματα.") };
      }
      if (f.eudrCommodities === null) {
        return { match: "might", dueDate: "2026-12-30", fact: "eudr_goods", reason: r("Applies if you sell or export cattle, cocoa, coffee, palm oil, rubber, soya or wood products.", "Ισχύει αν πουλάτε ή εξάγετε προϊόντα βοοειδών, κακάο, καφέ, φοινικέλαιου, καουτσούκ, σόγιας ή ξύλου.") };
      }
      const small = isMicroOrSmall(f);
      if (small === true) {
        return { match: "applies", dueDate: "2027-06-30", reason: r("You trade these products and are a micro or small company (up to 50 staff and EUR 15m turnover): applies from 30 June 2027.", "Εμπορεύεστε αυτά τα προϊόντα και είστε πολύ μικρή ή μικρή επιχείρηση: ισχύει από 30 Ιουνίου 2027.") };
      }
      if (small === false) {
        return { match: "applies", dueDate: "2026-12-30", reason: r("You trade these products and are a medium or large company: applies from 30 December 2026.", "Εμπορεύεστε αυτά τα προϊόντα και είστε μεσαία ή μεγάλη επιχείρηση: ισχύει από 30 Δεκεμβρίου 2026.") };
      }
      return { match: "applies", dueDate: "2026-12-30", fact: f.revenueEur === null ? "revenue" : "employees", reason: r("You trade these products. From 30 December 2026, or 30 June 2027 if you are a micro or small company; your size decides which.", "Εμπορεύεστε αυτά τα προϊόντα. Από 30 Δεκεμβρίου 2026, ή 30 Ιουνίου 2027 για πολύ μικρές/μικρές επιχειρήσεις.") };
    },
  },
  {
    id: "energy_audit",
    framework: "Energy efficiency",
    title: r("Energy audit (every 4 years)", "Ενεργειακός έλεγχος (κάθε 4 χρόνια)"),
    detail: r("Companies using more than 10 TJ of energy a year (about 2.8 GWh, all fuels and electricity) need an energy audit every 4 years, reported to the Cyprus Energy Service; above 85 TJ an energy management system.", "Επιχειρήσεις με κατανάλωση πάνω από 10 TJ τον χρόνο χρειάζονται ενεργειακό έλεγχο κάθε 4 χρόνια· πάνω από 85 TJ σύστημα ενεργειακής διαχείρισης."),
    baseCelex: ["32023L1791"],
    source: { label: "Directive (EU) 2023/1791 Art. 11", url: "https://eur-lex.europa.eu/eli/dir/2023/1791/oj" },
    agentKey: "advisor",
    evaluate: (f) => {
      if (f.electricityKwh12m === null) {
        return { match: "might", dueDate: "", reason: r("Applies above 10 TJ (about 2.8 GWh) of energy a year. Upload electricity bills so this can be checked.", "Ισχύει πάνω από 10 TJ (περίπου 2,8 GWh) τον χρόνο. Ανεβάστε λογαριασμούς ρεύματος για έλεγχο.") };
      }
      const tj = f.electricityKwh12m * TJ_PER_KWH;
      const tjText = tj.toFixed(tj < 1 ? 2 : 1);
      if (tj > 10) {
        return { match: "applies", dueDate: "", reason: r(`Your electricity alone was ${tjText} TJ in the last 12 months, above 10 TJ. An audit is due every 4 years from your last one.`, `Μόνο το ρεύμα σας ήταν ${tjText} TJ τους τελευταίους 12 μήνες, πάνω από 10 TJ. Έλεγχος κάθε 4 χρόνια από τον τελευταίο.`) };
      }
      if (tj > 3) {
        return { match: "might", dueDate: "", reason: r(`Your electricity was ${tjText} TJ in the last 12 months. With fuels added you may pass 10 TJ.`, `Το ρεύμα σας ήταν ${tjText} TJ τους τελευταίους 12 μήνες. Μαζί με τα καύσιμα ίσως ξεπεράσετε τα 10 TJ.`) };
      }
      return { match: "not", dueDate: "", reason: r(`Your electricity was ${tjText} TJ in the last 12 months, far below 10 TJ. Fuel use is not included; this changes only if fuels add several TJ.`, `Το ρεύμα σας ήταν ${tjText} TJ τους τελευταίους 12 μήνες, πολύ κάτω από 10 TJ. Τα καύσιμα δεν περιλαμβάνονται.`) };
    },
  },
  {
    id: "green_claims",
    framework: "Consumer law",
    title: r("Rules for green claims to consumers", "Κανόνες για περιβαλλοντικούς ισχυρισμούς"),
    detail: r("Since 27 September 2026, vague claims such as 'eco-friendly' or 'climate neutral' based on offsets, and self-made sustainability labels, are banned in consumer sales.", "Από 27 Σεπτεμβρίου 2026 απαγορεύονται ασαφείς ισχυρισμοί όπως «φιλικό προς το περιβάλλον» ή «κλιματικά ουδέτερο» μέσω αντισταθμίσεων, και αυτοσχέδια σήματα."),
    baseCelex: ["32024L0825"],
    source: { label: "Directive (EU) 2024/825", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024L0825" },
    agentKey: "advisor",
    evaluate: (f) => {
      if (f.consumerClaims === true) {
        return { match: "applies", dueDate: "", reason: r("You make environmental claims to consumers. Check every claim, label and 'neutral' statement now.", "Κάνετε περιβαλλοντικούς ισχυρισμούς σε καταναλωτές. Ελέγξτε κάθε ισχυρισμό και σήμα.") };
      }
      if (f.consumerClaims === false) {
        return { match: "not", dueDate: "", reason: r("You told us you make no environmental claims to consumers.", "Μας είπατε ότι δεν κάνετε περιβαλλοντικούς ισχυρισμούς σε καταναλωτές.") };
      }
      return { match: "might", dueDate: "", fact: "consumer_claims", reason: r("Applies to any business selling to consumers with environmental claims or labels.", "Ισχύει για κάθε επιχείρηση που πουλά σε καταναλωτές με περιβαλλοντικούς ισχυρισμούς.") };
    },
  },
];

export function evaluateAll(f: ObligationFacts, now = new Date()) {
  return RULES.map((rule) => ({ rule, result: rule.evaluate(f, now) }));
}

/** Fixed public dates for the landing page: same source as the rules. */
export const PUBLIC_DATES = [
  { date: "2026-01-01", en: "CBAM definitive period begins", el: "Έναρξη οριστικής περιόδου CBAM" },
  { date: "2026-09-27", en: "EU rules on green claims to consumers apply", el: "Ισχύουν οι κανόνες της ΕΕ για περιβαλλοντικούς ισχυρισμούς" },
  { date: "2026-12-30", en: "Deforestation rules apply to medium and large companies", el: "Οι κανόνες αποψίλωσης ισχύουν για μεσαίες και μεγάλες επιχειρήσεις" },
  { date: "2027-02-01", en: "Sale of CBAM certificates begins", el: "Έναρξη πώλησης πιστοποιητικών CBAM" },
  { date: "2027-06-30", en: "Deforestation rules apply to micro and small companies", el: "Οι κανόνες αποψίλωσης ισχύουν για πολύ μικρές και μικρές επιχειρήσεις" },
  { date: "2027-09-30", en: "First annual CBAM declaration (2026 imports)", el: "Πρώτη ετήσια δήλωση CBAM (εισαγωγές 2026)" },
] as const;

export const TRACKED_CELEX = [...new Set(RULES.flatMap((r) => r.baseCelex))];

export const OBLIGATION_FACT_LABEL: Record<ObligationFactKey, { en: string; el: string }> = {
  employees: { en: "Number of employees", el: "Αριθμός εργαζομένων" },
  revenue: { en: "Yearly revenue", el: "Ετήσιος κύκλος εργασιών" },
  cbam_goods: { en: "CBAM imports", el: "Εισαγωγές CBAM" },
  eudr_goods: { en: "Deforestation-rule products", el: "Προϊόντα κανόνων αποψίλωσης" },
  consumer_claims: { en: "Green claims to consumers", el: "Περιβαλλοντικοί ισχυρισμοί" },
};
