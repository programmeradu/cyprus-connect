/**
 * Central glossary of sustainability / ESG terms.
 * Each entry is a routable page at /[locale]/glossary/[termSlug].
 * Used inline by <GlossaryText> and standalone by /glossary/*.
 */

export type GlossaryEntry = {
  term: string;                 // canonical English term (matched case-insensitive)
  termSlug: string;             // kebab-case slug for the standalone glossary page
  aliases?: string[];
  slug?: string;                // optional deep-link to a related pillar guide
  en: string;                   // short definition
  el: string;
  enLong?: string;              // longer body copy for the standalone page
  elLong?: string;
  category?: "reporting" | "carbon" | "policy" | "standards" | "finance" | "general";
};

export const GLOSSARY: GlossaryEntry[] = [
  { term: "CSRD", termSlug: "csrd", aliases: ["Corporate Sustainability Reporting Directive"], slug: "csrd-reporting-guide", category: "reporting",
    en: "EU directive requiring large and listed companies to disclose sustainability information under ESRS.",
    el: "Οδηγία ΕΕ που απαιτεί από μεγάλες και εισηγμένες εταιρείες να δημοσιοποιούν πληροφορίες βιωσιμότητας κατά ESRS.",
    enLong: "The Corporate Sustainability Reporting Directive (CSRD) is the EU law that governs corporate sustainability disclosure. It phased in from FY 2024 and expands the number of in-scope companies from around 11,700 (under NFRD) to roughly 50,000. Reports must follow the European Sustainability Reporting Standards (ESRS) and are subject to limited assurance.",
    elLong: "Η CSRD διέπει την εταιρική αναφορά βιωσιμότητας στην ΕΕ, με σταδιακή εφαρμογή από το 2024 και πλήρη κάλυψη σχεδόν 50.000 εταιρειών. Οι αναφορές ακολουθούν τα πρότυπα ESRS και υπόκεινται σε περιορισμένη διασφάλιση." },
  { term: "VSME", termSlug: "vsme", aliases: ["Voluntary SME standard", "VSME standard"], slug: "vsme-reporting-guide", category: "reporting",
    en: "Voluntary reporting standard from EFRAG designed for non-listed SMEs — a simplified alternative to full ESRS.",
    el: "Εθελοντικό πρότυπο αναφοράς του EFRAG για μη εισηγμένες ΜμΕ — απλοποιημένη εναλλακτική του πλήρους ESRS." },
  { term: "CBAM", termSlug: "cbam", aliases: ["Carbon Border Adjustment Mechanism"], slug: "cbam-explained", category: "policy",
    en: "EU mechanism putting a carbon price on imports of cement, steel, aluminium, fertilisers, hydrogen and electricity.",
    el: "Μηχανισμός ΕΕ που επιβάλλει τιμή άνθρακα στις εισαγωγές τσιμέντου, χάλυβα, αλουμινίου, λιπασμάτων, υδρογόνου και ηλεκτρισμού." },
  { term: "ESRS", termSlug: "esrs", aliases: ["European Sustainability Reporting Standards"], slug: "esrs-standards-explained", category: "standards",
    en: "The 12 European Sustainability Reporting Standards companies use to comply with CSRD.",
    el: "Τα 12 Ευρωπαϊκά Πρότυπα Αναφοράς Βιωσιμότητας για συμμόρφωση με την CSRD." },
  { term: "ESG", termSlug: "esg", category: "general",
    en: "Environmental, Social and Governance — the three pillars used to assess corporate sustainability performance.",
    el: "Περιβαλλοντικά, Κοινωνικά και Διακυβέρνηση — οι τρεις πυλώνες αξιολόγησης εταιρικής βιωσιμότητας." },
  { term: "Scope 1", termSlug: "scope-1", aliases: ["Scope 1 emissions"], slug: "scope-1-2-3-emissions", category: "carbon",
    en: "Direct GHG emissions from sources you own or control — fuel combustion, company vehicles, fugitive emissions.",
    el: "Άμεσες εκπομπές αερίων θερμοκηπίου από πηγές που κατέχετε ή ελέγχετε." },
  { term: "Scope 2", termSlug: "scope-2", aliases: ["Scope 2 emissions"], slug: "scope-1-2-3-emissions", category: "carbon",
    en: "Indirect emissions from purchased electricity, steam, heat and cooling consumed by your organisation.",
    el: "Έμμεσες εκπομπές από αγορασμένο ηλεκτρισμό, ατμό, θέρμανση και ψύξη." },
  { term: "Scope 3", termSlug: "scope-3", aliases: ["Scope 3 emissions"], slug: "scope-3-emissions-calculation", category: "carbon",
    en: "All other indirect emissions across your value chain — purchased goods, travel, transport, use of sold products.",
    el: "Όλες οι υπόλοιπες έμμεσες εκπομπές στην αλυσίδα αξίας." },
  { term: "GHG Protocol", termSlug: "ghg-protocol", aliases: ["Greenhouse Gas Protocol"], slug: "ghg-protocol-guide", category: "standards",
    en: "The global standard for corporate GHG accounting, defining Scope 1/2/3 boundaries.",
    el: "Το παγκόσμιο πρότυπο εταιρικής λογιστικής αερίων θερμοκηπίου." },
  { term: "SBTi", termSlug: "sbti", aliases: ["Science Based Targets initiative", "science-based targets"], slug: "science-based-targets-sbti", category: "carbon",
    en: "Initiative validating corporate emissions targets against a 1.5°C-aligned pathway.",
    el: "Πρωτοβουλία επικύρωσης εταιρικών στόχων εκπομπών σε πορεία 1,5°C." },
  { term: "EU Taxonomy", termSlug: "eu-taxonomy", slug: "eu-taxonomy-explained", category: "policy",
    en: "EU classification system defining which economic activities count as environmentally sustainable.",
    el: "Σύστημα ταξινόμησης ΕΕ για βιώσιμες οικονομικές δραστηριότητες." },
  { term: "double materiality", termSlug: "double-materiality", slug: "double-materiality-assessment", category: "reporting",
    en: "CSRD principle: report topics material either to your business (financial) or to people & planet (impact).",
    el: "Αρχή CSRD: αναφορά θεμάτων ουσιωδών είτε οικονομικά είτε ως προς αντίκτυπο." },
  { term: "net zero", termSlug: "net-zero", slug: "net-zero-roadmap-smes", category: "carbon",
    en: "Reducing GHG emissions as close to zero as possible and neutralising residual emissions with permanent removals.",
    el: "Μείωση εκπομπών όσο πιο κοντά στο μηδέν και εξουδετέρωση υπολειπόμενων." },
  { term: "carbon footprint", termSlug: "carbon-footprint", category: "carbon",
    en: "Total GHG emissions caused by an organisation, product or activity, in tonnes of CO₂-equivalent.",
    el: "Συνολικές εκπομπές αερίων θερμοκηπίου οργανισμού, προϊόντος ή δραστηριότητας σε τόνους CO₂-ισοδύναμο." },
  { term: "PIE", termSlug: "public-interest-entity", aliases: ["Public Interest Entity"], category: "reporting",
    en: "Public-Interest Entity — listed companies, banks, insurers and other entities designated by EU member states.",
    el: "Οντότητα Δημοσίου Συμφέροντος — εισηγμένες, τράπεζες, ασφαλιστές κ.α." },
  { term: "materiality assessment", termSlug: "materiality-assessment", slug: "double-materiality-assessment", category: "reporting",
    en: "Process of identifying which sustainability topics are significant enough to disclose under CSRD/ESRS.",
    el: "Εντοπισμός σημαντικών θεμάτων βιωσιμότητας για αποκάλυψη κατά CSRD/ESRS." },
  { term: "tCO₂e", termSlug: "tco2e", aliases: ["tCO2e", "CO2e", "CO₂e"], category: "carbon",
    en: "Tonnes of carbon-dioxide-equivalent — the standard unit that normalises all greenhouse gases to CO₂.",
    el: "Τόνοι CO₂-ισοδύναμα — η τυπική μονάδα κανονικοποίησης αερίων θερμοκηπίου." },
  { term: "EU ETS", termSlug: "eu-ets", aliases: ["Emissions Trading System"], category: "policy",
    en: "EU cap-and-trade system for carbon allowances covering power, heavy industry and intra-EU aviation.",
    el: "Σύστημα εμπορίας δικαιωμάτων ΕΕ για ενέργεια, βαριά βιομηχανία και αεροπορία." },
  { term: "LSME", termSlug: "lsme", aliases: ["Listed SME standard"], category: "standards",
    en: "Simplified ESRS standard for listed small and medium-sized enterprises, effective from FY 2028 reporting.",
    el: "Απλοποιημένο ESRS για εισηγμένες ΜμΕ, από τη χρήση 2028." },
  { term: "GHG", termSlug: "ghg", aliases: ["greenhouse gas", "greenhouse gases"], category: "carbon",
    en: "Greenhouse gas — atmospheric gases (CO₂, CH₄, N₂O, HFCs, PFCs, SF₆, NF₃) that trap heat and cause warming.",
    el: "Αέρια θερμοκηπίου — αέρια της ατμόσφαιρας που παγιδεύουν θερμότητα." },
  { term: "carbon accounting", termSlug: "carbon-accounting", slug: "carbon-accounting-for-smes", category: "carbon",
    en: "The practice of quantifying an organisation's GHG emissions using a recognised methodology.",
    el: "Ποσοτικοποίηση εκπομπών αερίων θερμοκηπίου με αναγνωρισμένη μεθοδολογία." },
  { term: "emission factor", termSlug: "emission-factor", category: "carbon",
    en: "A coefficient that converts activity data (kWh, litres, km) into CO₂-equivalent emissions.",
    el: "Συντελεστής μετατροπής δεδομένων δραστηριότητας σε εκπομπές CO₂-ισοδύναμο." },
  { term: "activity data", termSlug: "activity-data", category: "carbon",
    en: "The physical quantity of a resource consumed — e.g. litres of diesel or kWh of electricity — used with an emission factor.",
    el: "Η φυσική ποσότητα καταναλωμένου πόρου (λίτρα, kWh) που πολλαπλασιάζεται με συντελεστή εκπομπών." },
  { term: "location-based", termSlug: "location-based-method", category: "carbon",
    en: "Scope 2 method using the average emissions intensity of the grid where consumption occurs.",
    el: "Μέθοδος Scope 2 με τη μέση ένταση εκπομπών του δικτύου." },
  { term: "market-based", termSlug: "market-based-method", category: "carbon",
    en: "Scope 2 method using contractual instruments (PPAs, GOs, RECs) to reflect purchased electricity attributes.",
    el: "Μέθοδος Scope 2 βάσει συμβατικών εργαλείων (PPA, GO, REC)." },
  { term: "PPA", termSlug: "ppa", aliases: ["Power Purchase Agreement"], category: "finance",
    en: "Long-term contract to buy electricity from a specific generator, often used to source renewables.",
    el: "Μακροπρόθεσμο συμβόλαιο αγοράς ηλεκτρισμού από συγκεκριμένο παραγωγό." },
  { term: "REC", termSlug: "rec", aliases: ["Renewable Energy Certificate"], category: "finance",
    en: "Tradable certificate representing the environmental attributes of one MWh of renewable electricity.",
    el: "Διαπραγματεύσιμο πιστοποιητικό για 1 MWh ανανεώσιμου ηλεκτρισμού." },
  { term: "Guarantee of Origin", termSlug: "guarantee-of-origin", aliases: ["GO", "GoO"], category: "finance",
    en: "EU electronic certificate certifying that electricity was produced from renewable sources.",
    el: "Ευρωπαϊκό ηλεκτρονικό πιστοποιητικό ανανεώσιμης προέλευσης ηλεκτρισμού." },
  { term: "carbon offset", termSlug: "carbon-offset", aliases: ["carbon offsets", "offsetting"], slug: "carbon-offsetting-vs-reduction", category: "carbon",
    en: "Credit representing one tonne of CO₂e avoided or removed elsewhere — used to compensate residual emissions.",
    el: "Πιστοποιητικό για έναν τόνο CO₂e που αποφεύχθηκε ή απομακρύνθηκε αλλού." },
  { term: "carbon removal", termSlug: "carbon-removal", category: "carbon",
    en: "Permanently removing CO₂ from the atmosphere via nature-based sinks or engineered solutions like DAC.",
    el: "Μόνιμη απομάκρυνση CO₂ από την ατμόσφαιρα (φυσικά ή τεχνολογικά)." },
  { term: "science-based target", termSlug: "science-based-target", slug: "science-based-targets-sbti", category: "carbon",
    en: "Emissions target aligned with the Paris Agreement's 1.5°C pathway, validated by SBTi.",
    el: "Στόχος εκπομπών συμβατός με τη Συμφωνία των Παρισίων 1,5°C." },
  { term: "climate transition plan", termSlug: "climate-transition-plan", category: "reporting",
    en: "A time-bound plan showing how a company will shift its business model to a low-carbon economy.",
    el: "Χρονοδεσμευμένο σχέδιο μετάβασης της εταιρείας σε οικονομία χαμηλών εκπομπών." },
  { term: "TCFD", termSlug: "tcfd", aliases: ["Task Force on Climate-related Financial Disclosures"], category: "reporting",
    en: "Framework for disclosing climate-related financial risks — now absorbed into ISSB and ESRS E1.",
    el: "Πλαίσιο γνωστοποίησης κλιματικών χρηματοοικονομικών κινδύνων — ενσωματώθηκε σε ISSB και ESRS E1." },
  { term: "ISSB", termSlug: "issb", aliases: ["International Sustainability Standards Board"], category: "standards",
    en: "IFRS Foundation body issuing global sustainability disclosure standards (IFRS S1 and S2).",
    el: "Φορέας του IFRS που εκδίδει παγκόσμια πρότυπα γνωστοποίησης βιωσιμότητας." },
  { term: "GRI", termSlug: "gri", aliases: ["Global Reporting Initiative"], category: "standards",
    en: "Widely adopted multi-stakeholder sustainability reporting framework focused on impact materiality.",
    el: "Ευρέως υιοθετημένο πλαίσιο αναφοράς βιωσιμότητας με έμφαση στον αντίκτυπο." },
  { term: "SASB", termSlug: "sasb", aliases: ["Sustainability Accounting Standards Board"], category: "standards",
    en: "Industry-specific sustainability accounting standards, now under the IFRS Foundation.",
    el: "Πρότυπα λογιστικής βιωσιμότητας ανά κλάδο, υπό το IFRS Foundation." },
  { term: "SFDR", termSlug: "sfdr", aliases: ["Sustainable Finance Disclosure Regulation"], category: "policy",
    en: "EU regulation requiring financial market participants to disclose sustainability risks and impacts.",
    el: "Κανονισμός ΕΕ για γνωστοποιήσεις βιωσιμότητας από χρηματοπιστωτικούς παράγοντες." },
  { term: "PCF", termSlug: "product-carbon-footprint", aliases: ["Product Carbon Footprint"], category: "carbon",
    en: "The lifecycle GHG emissions of a specific product, from raw materials to end-of-life.",
    el: "Εκπομπές αερίων θερμοκηπίου κύκλου ζωής ενός προϊόντος." },
  { term: "LCA", termSlug: "lca", aliases: ["life cycle assessment", "life-cycle assessment"], category: "carbon",
    en: "Standardised methodology (ISO 14040/44) to assess environmental impacts across a product's life cycle.",
    el: "Μεθοδολογία (ISO 14040/44) για περιβαλλοντικές επιπτώσεις κύκλου ζωής." },
  { term: "biogenic emissions", termSlug: "biogenic-emissions", category: "carbon",
    en: "CO₂ emissions from combustion or decomposition of biomass — reported separately from fossil emissions.",
    el: "Εκπομπές CO₂ από βιομάζα — αναφέρονται χωριστά από τις ορυκτές." },
  { term: "avoided emissions", termSlug: "avoided-emissions", category: "carbon",
    en: "Emissions reductions occurring outside a company's inventory boundary due to its products or services.",
    el: "Μειώσεις εκπομπών εκτός ορίων απογραφής χάρη στα προϊόντα/υπηρεσίες μιας εταιρείας." },
  { term: "renewable energy", termSlug: "renewable-energy", category: "general",
    en: "Energy from sources that replenish naturally on a human timescale — solar, wind, hydro, geothermal, biomass.",
    el: "Ενέργεια από φυσικά ανανεώσιμες πηγές — ήλιος, άνεμος, νερό, γεωθερμία, βιομάζα." },
  { term: "circular economy", termSlug: "circular-economy", category: "general",
    en: "An economic model designed to eliminate waste and keep materials in use through reuse, repair and recycling.",
    el: "Μοντέλο εξάλειψης αποβλήτων μέσω επαναχρησιμοποίησης, επισκευής και ανακύκλωσης." },
  { term: "greenwashing", termSlug: "greenwashing", category: "general",
    en: "Misleading claims that overstate the environmental benefits of a company, product or activity.",
    el: "Παραπλανητικοί ισχυρισμοί που υπερτονίζουν τα περιβαλλοντικά οφέλη." },
  { term: "biodiversity", termSlug: "biodiversity", category: "general",
    en: "The variety of life on Earth — species, genes, ecosystems — increasingly disclosed under ESRS E4 and TNFD.",
    el: "Η ποικιλομορφία της ζωής — είδη, γονίδια, οικοσυστήματα." },
  { term: "TNFD", termSlug: "tnfd", aliases: ["Taskforce on Nature-related Financial Disclosures"], category: "reporting",
    en: "Framework for disclosing nature-related risks and dependencies, complementary to TCFD.",
    el: "Πλαίσιο γνωστοποίησης κινδύνων που σχετίζονται με τη φύση." },
  { term: "Paris Agreement", termSlug: "paris-agreement", category: "policy",
    en: "2015 UN treaty committing signatories to limit global warming to well below 2°C, pursuing 1.5°C.",
    el: "Συνθήκη ΟΗΕ 2015 για συγκράτηση της υπερθέρμανσης κάτω των 2°C, με στόχο τους 1,5°C." },
  { term: "Fit for 55", termSlug: "fit-for-55", category: "policy",
    en: "EU legislative package to cut net greenhouse gas emissions by at least 55% by 2030 versus 1990.",
    el: "Πακέτο ΕΕ για μείωση καθαρών εκπομπών τουλάχιστον 55% έως το 2030 έναντι 1990." },
  { term: "Green Deal", termSlug: "european-green-deal", aliases: ["European Green Deal"], category: "policy",
    en: "The EU's overarching strategy to become climate-neutral by 2050 across all sectors of the economy.",
    el: "Στρατηγική ΕΕ για κλιματική ουδετερότητα έως το 2050." },
  { term: "just transition", termSlug: "just-transition", category: "general",
    en: "Ensuring the shift to a low-carbon economy is fair for workers and communities affected by change.",
    el: "Δίκαιη μετάβαση σε οικονομία χαμηλών εκπομπών για εργαζόμενους και κοινότητες." },
  { term: "physical risk", termSlug: "physical-risk", category: "finance",
    en: "Financial risk from acute (storms, floods) or chronic (heat, sea-level rise) climate impacts.",
    el: "Χρηματοοικονομικός κίνδυνος από οξείες ή χρόνιες κλιματικές επιπτώσεις." },
  { term: "transition risk", termSlug: "transition-risk", category: "finance",
    en: "Financial risk from policy, technology, market or reputational shifts as economies decarbonise.",
    el: "Κίνδυνος από πολιτικές, τεχνολογικές και αγοραίες αλλαγές κατά την απανθρακοποίηση." },
];

export const GLOSSARY_SLUGS = GLOSSARY.map((e) => e.termSlug);

export function getGlossaryEntry(termSlug: string): GlossaryEntry | null {
  return GLOSSARY.find((e) => e.termSlug === termSlug) ?? null;
}

// Pre-computed list sorted by descending needle length (longer matches first).
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
