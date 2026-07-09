/**
 * CBAM CN-code reference (Annex I of Regulation (EU) 2023/956).
 *
 * Sectors in scope during the transitional and definitive periods:
 * cement, iron & steel, aluminium, fertilisers, hydrogen, electricity.
 * Default embedded-emission values are the European Commission fallback
 * ("default values") applicable when actual data is unavailable — used
 * for indicative planning only. Definitive period requires actual
 * verified data; these fallbacks stop being permitted 31 Dec 2025 for
 * most goods.
 *
 * Sources: Commission Implementing Regulation (EU) 2023/1773 + updated
 * default values table (DG TAXUD, Feb 2024).
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
  /** Default direct embedded emissions (tCO₂e per tonne of goods). */
  defaultDirect: number;
  /** Default indirect embedded emissions (tCO₂e per tonne of goods). */
  defaultIndirect: number;
  /** Whether indirect emissions are in scope during the definitive period. */
  indirectInScope: boolean;
};

export const CN_CODES: CnCode[] = [
  // Cement
  { code: "2507 00 80", sector: "cement", description: "Kaolinic clays (calcined)", defaultDirect: 0.242, defaultIndirect: 0.017, indirectInScope: true },
  { code: "2523 10 00", sector: "cement", description: "Cement clinkers", defaultDirect: 0.869, defaultIndirect: 0.061, indirectInScope: true },
  { code: "2523 21 00", sector: "cement", description: "White Portland cement", defaultDirect: 0.923, defaultIndirect: 0.067, indirectInScope: true },
  { code: "2523 29 00", sector: "cement", description: "Other Portland cement", defaultDirect: 0.677, defaultIndirect: 0.048, indirectInScope: true },
  { code: "2523 30 00", sector: "cement", description: "Aluminous cement", defaultDirect: 0.783, defaultIndirect: 0.055, indirectInScope: true },
  { code: "2523 90 00", sector: "cement", description: "Other hydraulic cements", defaultDirect: 0.677, defaultIndirect: 0.048, indirectInScope: true },

  // Iron & steel
  { code: "7201", sector: "iron-steel", description: "Pig iron", defaultDirect: 2.093, defaultIndirect: 0.13, indirectInScope: false },
  { code: "7202", sector: "iron-steel", description: "Ferro-alloys (Mn / Si / Cr etc.)", defaultDirect: 3.02, defaultIndirect: 0.55, indirectInScope: false },
  { code: "7203", sector: "iron-steel", description: "Direct-reduced iron (DRI)", defaultDirect: 2.13, defaultIndirect: 0.09, indirectInScope: false },
  { code: "7205", sector: "iron-steel", description: "Iron & steel powders / granules", defaultDirect: 2.34, defaultIndirect: 0.11, indirectInScope: false },
  { code: "7206", sector: "iron-steel", description: "Iron & non-alloy steel ingots", defaultDirect: 2.63, defaultIndirect: 0.14, indirectInScope: false },
  { code: "7207", sector: "iron-steel", description: "Semi-finished iron / non-alloy steel", defaultDirect: 2.09, defaultIndirect: 0.12, indirectInScope: false },
  { code: "7208", sector: "iron-steel", description: "Flat hot-rolled steel (≥600 mm)", defaultDirect: 2.22, defaultIndirect: 0.13, indirectInScope: false },
  { code: "7210", sector: "iron-steel", description: "Flat rolled steel, plated / coated", defaultDirect: 2.36, defaultIndirect: 0.19, indirectInScope: false },
  { code: "7213", sector: "iron-steel", description: "Bars & rods, hot-rolled", defaultDirect: 2.09, defaultIndirect: 0.16, indirectInScope: false },
  { code: "7214", sector: "iron-steel", description: "Other bars & rods, iron / non-alloy", defaultDirect: 2.03, defaultIndirect: 0.15, indirectInScope: false },
  { code: "7216", sector: "iron-steel", description: "Angles, shapes, sections", defaultDirect: 2.14, defaultIndirect: 0.16, indirectInScope: false },
  { code: "7217", sector: "iron-steel", description: "Wire of iron / non-alloy steel", defaultDirect: 2.26, defaultIndirect: 0.19, indirectInScope: false },
  { code: "7301", sector: "iron-steel", description: "Sheet piling / welded profiles", defaultDirect: 2.19, defaultIndirect: 0.15, indirectInScope: false },
  { code: "7304", sector: "iron-steel", description: "Tubes & pipes, seamless", defaultDirect: 2.51, defaultIndirect: 0.21, indirectInScope: false },
  { code: "7305", sector: "iron-steel", description: "Tubes & pipes, large welded (>406 mm)", defaultDirect: 2.36, defaultIndirect: 0.18, indirectInScope: false },
  { code: "7306", sector: "iron-steel", description: "Tubes & pipes, other welded", defaultDirect: 2.33, defaultIndirect: 0.19, indirectInScope: false },
  { code: "7308", sector: "iron-steel", description: "Structures of iron / steel", defaultDirect: 2.31, defaultIndirect: 0.18, indirectInScope: false },
  { code: "7318", sector: "iron-steel", description: "Screws, bolts, nuts, washers", defaultDirect: 2.61, defaultIndirect: 0.24, indirectInScope: false },

  // Aluminium
  { code: "7601", sector: "aluminium", description: "Unwrought aluminium", defaultDirect: 6.83, defaultIndirect: 8.6, indirectInScope: false },
  { code: "7603", sector: "aluminium", description: "Aluminium powders & flakes", defaultDirect: 7.12, defaultIndirect: 8.7, indirectInScope: false },
  { code: "7604", sector: "aluminium", description: "Aluminium bars, rods, profiles", defaultDirect: 7.05, defaultIndirect: 8.65, indirectInScope: false },
  { code: "7605", sector: "aluminium", description: "Aluminium wire", defaultDirect: 7.11, defaultIndirect: 8.7, indirectInScope: false },
  { code: "7606", sector: "aluminium", description: "Aluminium plates, sheets, strip", defaultDirect: 7.02, defaultIndirect: 8.6, indirectInScope: false },
  { code: "7607", sector: "aluminium", description: "Aluminium foil", defaultDirect: 7.19, defaultIndirect: 8.75, indirectInScope: false },
  { code: "7608", sector: "aluminium", description: "Aluminium tubes & pipes", defaultDirect: 7.09, defaultIndirect: 8.7, indirectInScope: false },
  { code: "7609", sector: "aluminium", description: "Aluminium tube / pipe fittings", defaultDirect: 7.24, defaultIndirect: 8.8, indirectInScope: false },
  { code: "7610", sector: "aluminium", description: "Aluminium structures & parts", defaultDirect: 7.16, defaultIndirect: 8.7, indirectInScope: false },

  // Fertilisers
  { code: "2808 00 00", sector: "fertilisers", description: "Nitric acid; sulphonitric acids", defaultDirect: 2.79, defaultIndirect: 0.28, indirectInScope: true },
  { code: "2814", sector: "fertilisers", description: "Ammonia, anhydrous or in solution", defaultDirect: 2.35, defaultIndirect: 0.36, indirectInScope: true },
  { code: "2834 21 00", sector: "fertilisers", description: "Potassium nitrate", defaultDirect: 1.65, defaultIndirect: 0.22, indirectInScope: true },
  { code: "3102", sector: "fertilisers", description: "Nitrogen fertilisers, mineral", defaultDirect: 2.65, defaultIndirect: 0.32, indirectInScope: true },
  { code: "3105", sector: "fertilisers", description: "Mineral / chemical fertilisers (mixed)", defaultDirect: 1.24, defaultIndirect: 0.19, indirectInScope: true },

  // Hydrogen
  { code: "2804 10 00", sector: "hydrogen", description: "Hydrogen", defaultDirect: 9.9, defaultIndirect: 0.6, indirectInScope: true },

  // Electricity — measured per MWh, kept as t/t of the CN good for uniform UI
  { code: "2716 00 00", sector: "electricity", description: "Electrical energy (per MWh)", defaultDirect: 0.716, defaultIndirect: 0, indirectInScope: false },
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
