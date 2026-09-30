/**
 * Shared Salt Edge client/server types and the Cyprus bank list.
 *
 * The list follows Salt Edge's public Cyprus coverage page
 * (saltedge.com/products/account_information/coverage/cy, checked 30 Sep 2026)
 * and the 2025 bank mergers:
 * - Hellenic Bank and Eurobank Cyprus merged on 1 Sep 2025 into Eurobank Ltd.
 *   Salt Edge still lists the two online-banking systems separately, so both
 *   rows stay until the bank moves every customer to one system.
 * - AstroBank was absorbed by Alpha Bank Cyprus. Ancoria Bank is not covered
 *   by Salt Edge. Neither is listed.
 * - Bank of Cyprus is covered by Salt Edge, but Vuneli links it directly, so it
 *   is not offered here.
 *
 * `code` is the Salt Edge provider code sent as `provider_code`. Confirm each
 * code in the Salt Edge dashboard before production (founder checklist).
 */

export interface CyprusBankInstitution {
  code: string;
  /** Brand name as the customer knows it today. */
  name: { en: string; el: string };
  /** Which online-banking system this row is, in the customer's words. */
  system: { en: string; el: string };
  /** Official app icon, square. */
  icon: string;
}

export const CYPRUS_BANKS: CyprusBankInstitution[] = [
  {
    code: "hellenic_bank_cy",
    name: { en: "Eurobank", el: "Eurobank" },
    system: {
      en: "Former Hellenic Bank online banking",
      el: "Πρώην Online Banking Ελληνικής Τράπεζας",
    },
    icon: "/integrations/banks/eurobank.png",
  },
  {
    code: "eurobank_cy",
    name: { en: "Eurobank", el: "Eurobank" },
    system: {
      en: "Former Eurobank Cyprus digital banking",
      el: "Πρώην Digital Banking Eurobank Κύπρου",
    },
    icon: "/integrations/banks/eurobank.png",
  },
  {
    code: "alpha_bank_cy",
    name: { en: "Alpha Bank Cyprus", el: "Alpha Bank Κύπρου" },
    system: {
      en: "Alpha Bank online banking",
      el: "Online Banking Alpha Bank",
    },
    icon: "/integrations/banks/alpha.png",
  },
];

export const CYPRUS_BANK_CODES = CYPRUS_BANKS.map((b) => b.code) as [string, ...string[]];
