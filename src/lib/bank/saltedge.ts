/**
 * Shared Salt Edge client/server types and Cyprus bank catalog.
 */

export interface CyprusBankInstitution {
  code: string;
  name: { en: string; el: string };
  bic: string;
  popular?: boolean;
}

export const CYPRUS_BANKS: CyprusBankInstitution[] = [
  {
    code: "hellenic_bank_cy",
    name: { en: "Hellenic Bank", el: "Ελληνική Τράπεζα" },
    bic: "HEBACY2N",
    popular: true,
  },
  {
    code: "eurobank_cy",
    name: { en: "Eurobank Cyprus", el: "Eurobank Κύπρου" },
    bic: "ERBKCY2N",
    popular: true,
  },
  {
    code: "alpha_bank_cy",
    name: { en: "Alpha Bank Cyprus", el: "Alpha Bank Κύπρου" },
    bic: "ALBKCY2N",
    popular: true,
  },
  {
    code: "astrobank_cy",
    name: { en: "AstroBank", el: "AstroBank" },
    bic: "PIRBCY2N",
  },
  {
    code: "ancoria_bank_cy",
    name: { en: "Ancoria Bank", el: "Ancoria Bank" },
    bic: "ANCOCY2N",
  },
];
