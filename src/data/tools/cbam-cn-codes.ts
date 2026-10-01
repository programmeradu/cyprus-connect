/**
 * CBAM goods offered by the public CBAM tool (CN headings from Annex I of
 * Regulation (EU) 2023/956). Emission values are NOT kept here: official
 * default values live in src/data/cbam/ and are read via src/lib/cbam/official.ts.
 */

export type CbamSector =
  | "cement"
  | "iron-steel"
  | "aluminium"
  | "fertilisers"
  | "hydrogen"
  | "electricity";

export type CnCode = {
  code: string;
  sector: CbamSector;
  /** Short goods description (matches TARIC / Annex I). */
  description: string;
};

export const CN_CODES: CnCode[] = [
  // Cement
  { code: "2507 00 80", sector: "cement", description: "Kaolinic clays (calcined)" },
  { code: "2523 10 00", sector: "cement", description: "Cement clinkers" },
  { code: "2523 21 00", sector: "cement", description: "White Portland cement" },
  { code: "2523 29 00", sector: "cement", description: "Other Portland cement" },
  { code: "2523 30 00", sector: "cement", description: "Aluminous cement" },
  { code: "2523 90 00", sector: "cement", description: "Other hydraulic cements" },

  // Iron & steel
  { code: "7201", sector: "iron-steel", description: "Pig iron" },
  { code: "7202", sector: "iron-steel", description: "Ferro-alloys (Mn / Si / Cr etc.)" },
  { code: "7203", sector: "iron-steel", description: "Direct-reduced iron (DRI)" },
  { code: "7205", sector: "iron-steel", description: "Iron & steel powders / granules" },
  { code: "7206", sector: "iron-steel", description: "Iron & non-alloy steel ingots" },
  { code: "7207", sector: "iron-steel", description: "Semi-finished iron / non-alloy steel" },
  { code: "7208", sector: "iron-steel", description: "Flat hot-rolled steel (≥600 mm)" },
  { code: "7210", sector: "iron-steel", description: "Flat rolled steel, plated / coated" },
  { code: "7213", sector: "iron-steel", description: "Bars & rods, hot-rolled" },
  { code: "7214", sector: "iron-steel", description: "Other bars & rods, iron / non-alloy" },
  { code: "7216", sector: "iron-steel", description: "Angles, shapes, sections" },
  { code: "7217", sector: "iron-steel", description: "Wire of iron / non-alloy steel" },
  { code: "7301", sector: "iron-steel", description: "Sheet piling / welded profiles" },
  { code: "7304", sector: "iron-steel", description: "Tubes & pipes, seamless" },
  { code: "7305", sector: "iron-steel", description: "Tubes & pipes, large welded (>406 mm)" },
  { code: "7306", sector: "iron-steel", description: "Tubes & pipes, other welded" },
  { code: "7308", sector: "iron-steel", description: "Structures of iron / steel" },
  { code: "7318", sector: "iron-steel", description: "Screws, bolts, nuts, washers" },

  // Aluminium
  { code: "7601", sector: "aluminium", description: "Unwrought aluminium" },
  { code: "7603", sector: "aluminium", description: "Aluminium powders & flakes" },
  { code: "7604", sector: "aluminium", description: "Aluminium bars, rods, profiles" },
  { code: "7605", sector: "aluminium", description: "Aluminium wire" },
  { code: "7606", sector: "aluminium", description: "Aluminium plates, sheets, strip" },
  { code: "7607", sector: "aluminium", description: "Aluminium foil" },
  { code: "7608", sector: "aluminium", description: "Aluminium tubes & pipes" },
  { code: "7609", sector: "aluminium", description: "Aluminium tube / pipe fittings" },
  { code: "7610", sector: "aluminium", description: "Aluminium structures & parts" },

  // Fertilisers
  { code: "2808 00 00", sector: "fertilisers", description: "Nitric acid; sulphonitric acids" },
  { code: "2814", sector: "fertilisers", description: "Ammonia, anhydrous or in solution" },
  { code: "2834 21 00", sector: "fertilisers", description: "Potassium nitrate" },
  { code: "3102", sector: "fertilisers", description: "Nitrogen fertilisers, mineral" },
  { code: "3105", sector: "fertilisers", description: "Mineral / chemical fertilisers (mixed)" },

  // Hydrogen
  { code: "2804 10 00", sector: "hydrogen", description: "Hydrogen" },

  // Electricity — measured per MWh, kept as t/t of the CN good for uniform UI
  { code: "2716 00 00", sector: "electricity", description: "Electrical energy (per MWh)" },
];

export const SECTOR_META: Record<CbamSector, { en: string; el: string }> = {
  cement: { en: "Cement", el: "Τσιμέντο" },
  "iron-steel": { en: "Iron & steel", el: "Σίδηρος & χάλυβας" },
  aluminium: { en: "Aluminium", el: "Αλουμίνιο" },
  fertilisers: { en: "Fertilisers", el: "Λιπάσματα" },
  hydrogen: { en: "Hydrogen", el: "Υδρογόνο" },
  electricity: { en: "Electricity", el: "Ηλεκτρισμός" },
};

/** Common ISO country codes for CBAM origin declarations. */
export const CBAM_COUNTRIES: Array<{ code: string; en: string; el: string }> = [
  { code: "CN", en: "China", el: "Κίνα" },
  { code: "TR", en: "Türkiye", el: "Τουρκία" },
  { code: "IN", en: "India", el: "Ινδία" },
  { code: "RU", en: "Russia", el: "Ρωσία" },
  { code: "UA", en: "Ukraine", el: "Ουκρανία" },
  { code: "GB", en: "United Kingdom", el: "Ηνωμένο Βασίλειο" },
  { code: "US", en: "United States", el: "ΗΠΑ" },
  { code: "BR", en: "Brazil", el: "Βραζιλία" },
  { code: "KR", en: "South Korea", el: "Νότια Κορέα" },
  { code: "JP", en: "Japan", el: "Ιαπωνία" },
  { code: "EG", en: "Egypt", el: "Αίγυπτος" },
  { code: "MA", en: "Morocco", el: "Μαρόκο" },
  { code: "ZA", en: "South Africa", el: "Νότια Αφρική" },
  { code: "VN", en: "Vietnam", el: "Βιετνάμ" },
  { code: "TW", en: "Taiwan", el: "Ταϊβάν" },
  { code: "OTHER", en: "Other", el: "Άλλο" },
];
