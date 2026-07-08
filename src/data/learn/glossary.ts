/**
 * Central glossary of sustainability / ESG terms.
 * Used by <GlossaryText> to render inline tooltips across all pillar pages.
 *
 * Rules:
 * - Terms are matched case-insensitively as WHOLE WORDS.
 * - Sort by length DESC when scanning to prefer longer matches ("Scope 3 emissions" before "Scope 3").
 * - Keep entries under ~120 chars per locale for tooltip legibility.
 */

export type GlossaryEntry = {
  term: string;                 // canonical English term (matched case-insensitive)
  aliases?: string[];           // extra strings that map to the same definition
  slug?: string;                // optional pillar slug to deep-link "Read more"
  en: string;
  el: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "CSRD",
    aliases: ["Corporate Sustainability Reporting Directive"],
    slug: "csrd-reporting-guide",
    en: "EU directive requiring large and listed companies to disclose sustainability information under ESRS.",
    el: "Οδηγία ΕΕ που απαιτεί από μεγάλες και εισηγμένες εταιρείες να δημοσιοποιούν πληροφορίες βιωσιμότητας κατά ESRS.",
  },
  {
    term: "VSME",
    aliases: ["Voluntary SME standard", "VSME standard"],
    slug: "vsme-reporting-guide",
    en: "Voluntary reporting standard from EFRAG designed for non-listed SMEs — a simplified alternative to full ESRS.",
    el: "Εθελοντικό πρότυπο αναφοράς του EFRAG για μη εισηγμένες ΜμΕ — απλοποιημένη εναλλακτική του πλήρους ESRS.",
  },
  {
    term: "CBAM",
    aliases: ["Carbon Border Adjustment Mechanism"],
    slug: "cbam-explained",
    en: "EU mechanism that puts a carbon price on imports of cement, steel, aluminium, fertilisers, hydrogen and electricity.",
    el: "Μηχανισμός ΕΕ που επιβάλλει τιμή άνθρακα στις εισαγωγές τσιμέντου, χάλυβα, αλουμινίου, λιπασμάτων, υδρογόνου και ηλεκτρισμού.",
  },
  {
    term: "ESRS",
    aliases: ["European Sustainability Reporting Standards"],
    slug: "esrs-standards-explained",
    en: "The set of 12 European Sustainability Reporting Standards that companies use to comply with CSRD.",
    el: "Το σύνολο 12 Ευρωπαϊκών Προτύπων Αναφοράς Βιωσιμότητας για συμμόρφωση με την CSRD.",
  },
  {
    term: "ESG",
    en: "Environmental, Social and Governance — the three pillars used to assess corporate sustainability performance.",
    el: "Περιβαλλοντικά, Κοινωνικά και Διακυβέρνηση — οι τρεις πυλώνες αξιολόγησης εταιρικής βιωσιμότητας.",
  },
  {
    term: "Scope 1",
    aliases: ["Scope 1 emissions"],
    slug: "scope-1-2-3-emissions",
    en: "Direct GHG emissions from sources you own or control — fuel combustion, company vehicles, fugitive emissions.",
    el: "Άμεσες εκπομπές αερίων θερμοκηπίου από πηγές που κατέχετε ή ελέγχετε — καύση καυσίμων, οχήματα εταιρείας, διαρροές.",
  },
  {
    term: "Scope 2",
    aliases: ["Scope 2 emissions"],
    slug: "scope-1-2-3-emissions",
    en: "Indirect emissions from purchased electricity, steam, heat and cooling consumed by your organisation.",
    el: "Έμμεσες εκπομπές από αγορασμένο ηλεκτρισμό, ατμό, θέρμανση και ψύξη που καταναλώνει ο οργανισμός σας.",
  },
  {
    term: "Scope 3",
    aliases: ["Scope 3 emissions"],
    slug: "scope-3-emissions-calculation",
    en: "All other indirect emissions across your value chain — purchased goods, travel, transport, use of sold products.",
    el: "Όλες οι υπόλοιπες έμμεσες εκπομπές στην αλυσίδα αξίας — αγορές, ταξίδια, μεταφορές, χρήση πωλούμενων προϊόντων.",
  },
  {
    term: "GHG Protocol",
    aliases: ["Greenhouse Gas Protocol"],
    slug: "ghg-protocol-guide",
    en: "The global standard for corporate GHG accounting and reporting, defining Scope 1/2/3 boundaries.",
    el: "Το παγκόσμιο πρότυπο εταιρικής λογιστικής αερίων θερμοκηπίου, που ορίζει τα όρια Scope 1/2/3.",
  },
  {
    term: "SBTi",
    aliases: ["Science Based Targets initiative", "science-based targets"],
    slug: "science-based-targets-sbti",
    en: "Initiative that validates corporate emissions targets against a 1.5°C-aligned pathway.",
    el: "Πρωτοβουλία που επικυρώνει εταιρικούς στόχους εκπομπών σε πορεία συμβατή με τους 1,5°C.",
  },
  {
    term: "EU Taxonomy",
    slug: "eu-taxonomy-explained",
    en: "EU classification system defining which economic activities count as environmentally sustainable.",
    el: "Σύστημα ταξινόμησης ΕΕ που ορίζει ποιες οικονομικές δραστηριότητες θεωρούνται περιβαλλοντικά βιώσιμες.",
  },
  {
    term: "double materiality",
    slug: "double-materiality-assessment",
    en: "CSRD principle: report topics that are material either to your business (financial) or to people & planet (impact).",
    el: "Αρχή CSRD: αναφέρετε θέματα που είναι ουσιώδη είτε για την επιχείρησή σας (οικονομικά) είτε για ανθρώπους & πλανήτη.",
  },
  {
    term: "net zero",
    slug: "net-zero-roadmap-smes",
    en: "Reducing GHG emissions as close to zero as possible and neutralising residual emissions with permanent removals.",
    el: "Μείωση εκπομπών όσο το δυνατόν πιο κοντά στο μηδέν και εξουδετέρωση υπολειπόμενων με μόνιμες αφαιρέσεις.",
  },
  {
    term: "carbon footprint",
    en: "The total GHG emissions caused by an organisation, product or activity, expressed in tonnes of CO₂-equivalent.",
    el: "Το σύνολο εκπομπών αερίων θερμοκηπίου ενός οργανισμού, προϊόντος ή δραστηριότητας, σε τόνους CO₂-ισοδύναμο.",
  },
  {
    term: "PIE",
    aliases: ["Public Interest Entity"],
    en: "Public-Interest Entity — listed companies, banks, insurers and other entities designated by EU member states.",
    el: "Οντότητα Δημοσίου Συμφέροντος — εισηγμένες εταιρείες, τράπεζες, ασφαλιστές και άλλες οντότητες.",
  },
  {
    term: "materiality assessment",
    slug: "double-materiality-assessment",
    en: "Process of identifying which sustainability topics are significant enough to disclose under CSRD/ESRS.",
    el: "Διαδικασία εντοπισμού θεμάτων βιωσιμότητας αρκετά σημαντικών ώστε να αποκαλυφθούν κατά CSRD/ESRS.",
  },
  {
    term: "tCO₂e",
    aliases: ["tCO2e", "CO2e", "CO₂e"],
    en: "Tonnes of carbon-dioxide-equivalent — the standard unit that normalises all greenhouse gases to CO₂.",
    el: "Τόνοι διοξειδίου του άνθρακα-ισοδύναμα — η τυπική μονάδα που κανονικοποιεί όλα τα αέρια θερμοκηπίου σε CO₂.",
  },
  {
    term: "EU ETS",
    aliases: ["Emissions Trading System"],
    en: "EU cap-and-trade system for carbon allowances covering power, heavy industry and intra-EU aviation.",
    el: "Σύστημα εμπορίας δικαιωμάτων εκπομπών ΕΕ για ενέργεια, βαριά βιομηχανία και ενδοευρωπαϊκές αερομεταφορές.",
  },
  {
    term: "LSME",
    aliases: ["Listed SME standard"],
    en: "Simplified ESRS standard for listed small and medium-sized enterprises, effective from FY 2028 reporting.",
    el: "Απλοποιημένο πρότυπο ESRS για εισηγμένες ΜμΕ, με ισχύ από τη χρήση 2028.",
  },
];

// Pre-computed list sorted by descending term length (longer matches first).
const SORTED_TERMS: Array<{ needle: string; entry: GlossaryEntry }> = GLOSSARY
  .flatMap((e) => [
    { needle: e.term.toLowerCase(), entry: e },
    ...(e.aliases ?? []).map((a) => ({ needle: a.toLowerCase(), entry: e })),
  ])
  .sort((a, b) => b.needle.length - a.needle.length);

export type GlossaryMatch = {
  index: number;
  length: number;
  entry: GlossaryEntry;
  raw: string;
};

/** Find non-overlapping glossary matches, at most `maxMatches` per input. */
export function findGlossaryMatches(text: string, maxMatches = 3): GlossaryMatch[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const taken: Array<[number, number]> = [];
  const isBoundary = (c: string | undefined) =>
    c === undefined || /[^a-z0-9\u0370-\u03ff\u1f00-\u1fff]/i.test(c);

  const matches: GlossaryMatch[] = [];
  for (const { needle, entry } of SORTED_TERMS) {
    let from = 0;
    // one match per entry per paragraph to keep it readable
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      const end = idx + needle.length;
      const before = lower[idx - 1];
      const after = lower[end];
      const overlaps = taken.some(([s, e]) => idx < e && end > s);
      if (isBoundary(before) && isBoundary(after) && !overlaps) {
        matches.push({ index: idx, length: needle.length, entry, raw: text.slice(idx, end) });
        taken.push([idx, end]);
        break;
      }
      from = idx + 1;
    }
    if (matches.length >= maxMatches) break;
  }
  return matches.sort((a, b) => a.index - b.index);
}
