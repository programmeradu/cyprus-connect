/**
 * EU Taxonomy — NACE Rev. 2 activities covered by the Climate Delegated Act
 * (Reg. 2021/2139) and Environmental Delegated Act (Reg. 2023/2486).
 *
 * Each activity lists which of the six environmental objectives it can make a
 * substantial contribution to (CCM = climate mitigation, CCA = adaptation,
 * WTR = water, CE = circular economy, PPC = pollution, BIO = biodiversity).
 *
 * This is a curated set of the most-referenced eligible activities across the
 * two acts. Not exhaustive — the underlying legal texts remain authoritative.
 */

export type TaxonomyObjective = "CCM" | "CCA" | "WTR" | "CE" | "PPC" | "BIO";

export const OBJECTIVES: {
  id: TaxonomyObjective;
  en: string;
  el: string;
  regulation: string;
}[] = [
  { id: "CCM", en: "Climate change mitigation", el: "Μετριασμός κλιματικής αλλαγής", regulation: "Reg. 2021/2139 Annex I" },
  { id: "CCA", en: "Climate change adaptation", el: "Προσαρμογή στην κλιματική αλλαγή", regulation: "Reg. 2021/2139 Annex II" },
  { id: "WTR", en: "Water & marine resources", el: "Νερό και θαλάσσιοι πόροι", regulation: "Reg. 2023/2486 Annex I" },
  { id: "CE", en: "Circular economy", el: "Κυκλική οικονομία", regulation: "Reg. 2023/2486 Annex II" },
  { id: "PPC", en: "Pollution prevention & control", el: "Πρόληψη και έλεγχος ρύπανσης", regulation: "Reg. 2023/2486 Annex III" },
  { id: "BIO", en: "Biodiversity & ecosystems", el: "Βιοποικιλότητα και οικοσυστήματα", regulation: "Reg. 2023/2486 Annex IV" },
];

export type TaxonomyActivity = {
  nace: string; // NACE Rev.2 code(s), comma-separated
  ref: string; // Legal reference in Delegated Act (e.g. "CCM 4.1")
  en: { name: string; description: string };
  el: { name: string; description: string };
  /** Objectives the activity can substantially contribute to. */
  objectives: TaxonomyObjective[];
};

export const ACTIVITIES: TaxonomyActivity[] = [
  {
    nace: "D35.11",
    ref: "CCM 4.1",
    en: { name: "Electricity generation using solar photovoltaic technology", description: "Construction or operation of electricity generation facilities that produce electricity using solar PV." },
    el: { name: "Παραγωγή ηλεκτρικής ενέργειας από φωτοβολταϊκά", description: "Κατασκευή ή λειτουργία μονάδων παραγωγής ηλεκτρικής ενέργειας με χρήση Φ/Β." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "D35.11",
    ref: "CCM 4.3",
    en: { name: "Electricity generation from wind power", description: "Construction or operation of electricity generation facilities that produce electricity from wind." },
    el: { name: "Παραγωγή ηλεκτρισμού από αιολική ενέργεια", description: "Κατασκευή ή λειτουργία αιολικών μονάδων παραγωγής ηλεκτρικής ενέργειας." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "D35.11",
    ref: "CCM 4.5",
    en: { name: "Electricity generation from hydropower", description: "Construction or operation of hydropower plants meeting run-of-river or density thresholds." },
    el: { name: "Παραγωγή ηλεκτρισμού από υδροηλεκτρικά", description: "Κατασκευή/λειτουργία υδροηλεκτρικών σταθμών με πλήρωση κριτηρίων." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "D35.30",
    ref: "CCM 4.15",
    en: { name: "District heating/cooling distribution", description: "Construction, refurbishment and operation of pipelines and associated infrastructure for distributing heating and cooling." },
    el: { name: "Διανομή τηλεθέρμανσης/τηλεψύξης", description: "Κατασκευή, ανακαίνιση και λειτουργία δικτύων διανομής." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "F41.10, F41.20",
    ref: "CCM 7.1",
    en: { name: "Construction of new buildings", description: "Development of building projects with PED ≥ 10% below NZEB threshold." },
    el: { name: "Κατασκευή νέων κτιρίων", description: "Ανάπτυξη κτιριακών έργων με PED ≥ 10% κάτω από όριο NZEB." },
    objectives: ["CCM", "CCA", "CE", "PPC"],
  },
  {
    nace: "F41.20, F43",
    ref: "CCM 7.2",
    en: { name: "Renovation of existing buildings", description: "Major renovation reducing primary energy demand by ≥ 30%." },
    el: { name: "Ανακαίνιση υφιστάμενων κτιρίων", description: "Μείζων ανακαίνιση με μείωση PED ≥ 30%." },
    objectives: ["CCM", "CCA", "CE"],
  },
  {
    nace: "F43.21, F43.22",
    ref: "CCM 7.3",
    en: { name: "Installation of energy efficiency equipment in buildings", description: "Installation, maintenance and repair of energy-efficient technologies (insulation, windows, heat pumps)." },
    el: { name: "Εγκατάσταση εξοπλισμού ενεργειακής απόδοσης", description: "Εγκατάσταση, συντήρηση, επισκευή τεχνολογιών ενεργ. απόδοσης." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "F43.21",
    ref: "CCM 7.6",
    en: { name: "Installation of renewable energy technologies", description: "Installation, maintenance and repair of on-site renewable energy technologies including solar PV and heat pumps." },
    el: { name: "Εγκατάσταση τεχνολογιών ανανεώσιμης ενέργειας", description: "Εγκατάσταση, συντήρηση, επισκευή επί τόπου ΑΠΕ." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "L68",
    ref: "CCM 7.7",
    en: { name: "Acquisition and ownership of buildings", description: "Buying real estate and exercising ownership over that real estate; EPC A or top 15% of stock." },
    el: { name: "Αγορά και ιδιοκτησία κτιρίων", description: "Αγορά ακινήτου και άσκηση ιδιοκτησίας· EPC A ή top 15%." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "H49.10, H49.20",
    ref: "CCM 6.14",
    en: { name: "Infrastructure for rail transport", description: "Construction, modernisation and operation of railway infrastructure for electrified networks or dedicated low-carbon rail." },
    el: { name: "Υποδομή σιδηροδρομικών μεταφορών", description: "Κατασκευή, εκσυγχρονισμός, λειτουργία σιδηροδρομικών υποδομών." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "H49.31, H49.39",
    ref: "CCM 6.3",
    en: { name: "Urban and suburban passenger land transport", description: "Passenger transport by urban buses, coaches and other collective land transport with zero direct tailpipe CO₂." },
    el: { name: "Αστικές και προαστιακές επιβατικές μεταφορές", description: "Επιβατικές μεταφορές με μηδενικές άμεσες εκπομπές CO₂." },
    objectives: ["CCM", "CCA", "PPC"],
  },
  {
    nace: "H49.41",
    ref: "CCM 6.6",
    en: { name: "Freight transport services by road", description: "Purchase, financing, leasing and operation of vehicles designated as category N1, N2, N3 with zero direct tailpipe CO₂." },
    el: { name: "Οδικές εμπορευματικές μεταφορές", description: "Οχήματα N1/N2/N3 με μηδενικές άμεσες εκπομπές CO₂." },
    objectives: ["CCM", "CCA", "PPC"],
  },
  {
    nace: "C23.51",
    ref: "CCM 3.7",
    en: { name: "Manufacture of cement", description: "Manufacture of grey cement clinker or cement below emissions intensity thresholds." },
    el: { name: "Παραγωγή τσιμέντου", description: "Παραγωγή κάτω από όρια έντασης εκπομπών." },
    objectives: ["CCM", "CE", "PPC"],
  },
  {
    nace: "C24.10",
    ref: "CCM 3.9",
    en: { name: "Manufacture of iron and steel", description: "Iron and steel production below emissions intensity thresholds for hot metal and crude steel." },
    el: { name: "Παραγωγή σιδήρου και χάλυβα", description: "Παραγωγή κάτω από όρια έντασης εκπομπών." },
    objectives: ["CCM", "CE", "PPC"],
  },
  {
    nace: "C24.42",
    ref: "CCM 3.8",
    en: { name: "Manufacture of aluminium", description: "Manufacture of primary and secondary aluminium below emissions intensity thresholds." },
    el: { name: "Παραγωγή αλουμινίου", description: "Παραγωγή πρωτογενούς/δευτερογενούς αλουμινίου εντός ορίων." },
    objectives: ["CCM", "CE", "PPC"],
  },
  {
    nace: "C20.15",
    ref: "CCM 3.4",
    en: { name: "Manufacture of hydrogen", description: "Manufacture of hydrogen with lifecycle emissions ≤ 3 t CO₂e / t H₂." },
    el: { name: "Παραγωγή υδρογόνου", description: "Παραγωγή με εκπομπές ≤ 3 t CO₂e / t H₂." },
    objectives: ["CCM", "CE"],
  },
  {
    nace: "C27.11, C27.12",
    ref: "CCM 3.1",
    en: { name: "Manufacture of renewable energy technologies", description: "Manufacture of components and equipment for solar PV, wind, hydro, geothermal, hydrogen and heat-pump systems." },
    el: { name: "Παραγωγή τεχνολογιών ΑΠΕ", description: "Κατασκευή εξαρτημάτων για Φ/Β, αιολικά, υδροηλεκτρικά κ.λπ." },
    objectives: ["CCM"],
  },
  {
    nace: "J61",
    ref: "CCM 8.1",
    en: { name: "Data processing, hosting and related activities", description: "Storage, manipulation, management, movement, control, display of data with adherence to the European Code of Conduct for Data Centre Energy Efficiency." },
    el: { name: "Επεξεργασία δεδομένων, φιλοξενία", description: "Data-centre λειτουργίες βάσει EU CoC for Data Centre Energy Efficiency." },
    objectives: ["CCM", "CCA"],
  },
  {
    nace: "E36.00",
    ref: "WTR 2.1",
    en: { name: "Water supply", description: "Abstraction, treatment and supply of water for human consumption with reduced leakage rate." },
    el: { name: "Ύδρευση", description: "Άντληση, επεξεργασία και παροχή πόσιμου νερού με χαμηλό ποσοστό διαρροών." },
    objectives: ["WTR", "CCM", "CCA"],
  },
  {
    nace: "E37.00",
    ref: "WTR 2.2",
    en: { name: "Centralised wastewater treatment", description: "Collection and treatment of wastewater; may include energy-recovery from sludge." },
    el: { name: "Κεντρική επεξεργασία λυμάτων", description: "Συλλογή και επεξεργασία λυμάτων· δυνατή ενεργειακή ανάκτηση." },
    objectives: ["WTR", "CCM", "CE"],
  },
  {
    nace: "E38.11, E38.21",
    ref: "CE 2.1",
    en: { name: "Collection and transport of non-hazardous waste for material recovery", description: "Separate collection and transport of non-hazardous waste fractions destined for preparation for reuse or recycling." },
    el: { name: "Συλλογή/μεταφορά μη επικίνδυνων αποβλήτων για ανάκτηση", description: "Χωριστή συλλογή και μεταφορά κλασμάτων για επαναχρησιμοποίηση/ανακύκλωση." },
    objectives: ["CE", "CCM"],
  },
  {
    nace: "E38.32",
    ref: "CE 2.7",
    en: { name: "Recovery of bio-waste by anaerobic digestion or composting", description: "Processing of biological waste, generating biogas and/or compost." },
    el: { name: "Αναερόβια χώνευση/κομποστοποίηση βιοαποβλήτων", description: "Επεξεργασία βιολογικών αποβλήτων, παραγωγή βιοαερίου/κομπόστ." },
    objectives: ["CE", "CCM"],
  },
  {
    nace: "E39.00",
    ref: "PPC 2.3",
    en: { name: "Remediation of contaminated sites and areas", description: "Cleaning up soil, groundwater or surface water polluted by hazardous substances." },
    el: { name: "Αποκατάσταση ρυπασμένων χώρων", description: "Καθαρισμός εδάφους/υπόγειων/επιφανειακών υδάτων από επικίνδυνες ουσίες." },
    objectives: ["PPC", "BIO"],
  },
  {
    nace: "A01",
    ref: "BIO 1.1",
    en: { name: "Conservation, including restoration, of habitats, ecosystems and species", description: "Land management activities dedicated to the conservation of habitats and species listed in EU nature directives." },
    el: { name: "Διατήρηση/αποκατάσταση οικοτόπων, οικοσυστημάτων και ειδών", description: "Δραστηριότητες διαχείρισης γης για διατήρηση οικοτόπων." },
    objectives: ["BIO", "CCA"],
  },
  {
    nace: "A02",
    ref: "CCM 1.3",
    en: { name: "Forestry — Rehabilitation and restoration of forests", description: "Restoration of forests as defined by FAO after natural disturbances or unsustainable use." },
    el: { name: "Αποκατάσταση δασών", description: "Αποκατάσταση δασών κατά FAO μετά διαταραχές." },
    objectives: ["CCM", "CCA", "BIO"],
  },
  {
    nace: "M74.90",
    ref: "CCM 9.3",
    en: { name: "Professional services related to energy performance of buildings", description: "Technical consulting, energy audits, energy performance contracting and building commissioning." },
    el: { name: "Επαγγελματικές υπηρεσίες ενεργ. απόδοσης κτιρίων", description: "Ενεργειακοί έλεγχοι, EPC, commissioning." },
    objectives: ["CCM"],
  },
  {
    nace: "K64, K65, K66",
    ref: "CCM 9.1",
    en: { name: "Close to market research, development and innovation", description: "Research, applied research and experimental development of solutions, processes, technologies enabling substantial GHG reductions." },
    el: { name: "Εφαρμοσμένη έρευνα και ανάπτυξη", description: "Έρευνα, εφαρμοσμένη έρευνα, πειραματική ανάπτυξη για μείωση GHG." },
    objectives: ["CCM"],
  },
  {
    nace: "S94",
    ref: "CCM 9.2",
    en: { name: "Non-life insurance: underwriting of climate-related perils", description: "Insurance underwriting covering climate-related perils, including reinsurance." },
    el: { name: "Ασφάλιση κατά κλιματικών κινδύνων", description: "Ασφαλιστική κάλυψη κλιματικών κινδύνων, και αντασφάλιση." },
    objectives: ["CCA"],
  },
  {
    nace: "C22.29, C25.99",
    ref: "CE 1.2",
    en: { name: "Manufacture of equipment for production and use of hydrogen", description: "Manufacture of components enabling hydrogen production, use, storage or transport." },
    el: { name: "Παραγωγή εξοπλισμού υδρογόνου", description: "Παραγωγή εξαρτημάτων για παραγωγή/χρήση/αποθήκευση Η₂." },
    objectives: ["CE", "CCM"],
  },
  {
    nace: "C17",
    ref: "CE 1.3",
    en: { name: "Manufacture of paper and paper products", description: "Manufacture of pulp, paper and paperboard meeting BAT and material-efficiency criteria." },
    el: { name: "Παραγωγή χαρτιού", description: "Παραγωγή χαρτιού με BAT και υλική αποδοτικότητα." },
    objectives: ["CE", "PPC", "CCM"],
  },
];

/** DNSH — generic checklist points that apply across activities.
 * Each activity must not significantly harm any of the other five objectives.
 * These are indicative screening questions, not full technical screening criteria.
 */
export const DNSH_CHECKS: {
  objective: TaxonomyObjective;
  en: string;
  el: string;
}[] = [
  { objective: "CCM", en: "Activity does not lead to significant GHG emissions (measured against best-in-class benchmarks).", el: "Η δραστηριότητα δεν οδηγεί σε σημαντικές εκπομπές GHG." },
  { objective: "CCA", en: "Physical climate risk assessment completed for the activity's assets and operations.", el: "Ολοκληρωμένη εκτίμηση φυσικού κλιματικού κινδύνου." },
  { objective: "WTR", en: "Environmental degradation risks to water bodies identified and addressed per WFD 2000/60/EC.", el: "Κίνδυνοι υποβάθμισης υδάτων εντοπίστηκαν και αντιμετωπίστηκαν κατά WFD." },
  { objective: "CE", en: "Waste hierarchy applied: prevention, reuse, recycling take precedence over disposal.", el: "Εφαρμογή ιεραρχίας αποβλήτων." },
  { objective: "PPC", en: "Emissions to air, water and soil below applicable BAT-associated emission levels (BAT-AEL).", el: "Εκπομπές κάτω από τα ισχύοντα BAT-AEL." },
  { objective: "BIO", en: "No activity in / near biodiversity-sensitive areas without full environmental impact assessment.", el: "Καμία δραστηριότητα κοντά σε ευαίσθητες περιοχές χωρίς πλήρη ΜΠΕ." },
];

/** Minimum safeguards — Art. 18 of the Taxonomy Regulation. */
export const MIN_SAFEGUARDS: { en: string; el: string }[] = [
  { en: "OECD Guidelines for Multinational Enterprises adherence.", el: "Τήρηση OECD Guidelines for Multinational Enterprises." },
  { en: "UN Guiding Principles on Business and Human Rights (including ILO core conventions).", el: "Τήρηση UN Guiding Principles on Business and Human Rights (και βασικών συμβάσεων ILO)." },
  { en: "No convictions for tax evasion, corruption, competition-law breaches or human-rights violations.", el: "Καμία καταδίκη για φοροδιαφυγή, διαφθορά, παραβίαση ανταγωνισμού ή ανθρωπίνων δικαιωμάτων." },
  { en: "Effective grievance and remediation mechanisms available to workers and stakeholders.", el: "Ενεργοί μηχανισμοί καταγγελιών και αποκατάστασης." },
];
