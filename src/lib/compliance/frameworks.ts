/**
 * Frameworks a Cyprus SME can meet, with the dates that come from the rule
 * itself. One list for the regulation tracker and the report generator, so
 * both show the same dates. No "compliant" status is set here: status only
 * changes when the user records it.
 *
 * Dates to re-check against primary sources each year:
 * - CBAM: definitive period from 1 Jan 2026; first annual declaration for 2026
 *   due 30 Sep 2027 (Reg. (EU) 2023/956 as amended by Reg. (EU) 2025/2083).
 * - CSRD: second-wave companies moved to financial year 2027, reported in 2028
 *   (Directive (EU) 2025/794, "stop-the-clock").
 * - VSME and GHG Protocol are voluntary; the date is the end of the user's
 *   reporting year, not a legal deadline.
 */

export interface FrameworkDef {
  regulationId: string;
  label: string;
  name: string;
  jurisdiction: string;
  description: string;
  requirements: string[];
  /** Returns the next due date as yyyy-mm-dd. */
  nextDeadline: (now?: Date) => string;
  legalDeadline: boolean;
}

const yearEnd = (now = new Date()) => `${now.getUTCFullYear()}-12-31`;

export const FRAMEWORKS: FrameworkDef[] = [
  {
    regulationId: "vsme",
    label: "VSME",
    name: "VSME - Voluntary Sustainability Reporting Standard for SMEs",
    jurisdiction: "European Union",
    description:
      "EFRAG standard that banks and large buyers use to ask SMEs for sustainability data. Voluntary; the date is the end of your reporting year.",
    requirements: ["Basic module B1-B11", "Energy and GHG emissions", "Workforce data"],
    nextDeadline: yearEnd,
    legalDeadline: false,
  },
  {
    regulationId: "cbam",
    label: "CBAM",
    name: "CBAM - Carbon Border Adjustment Mechanism",
    jurisdiction: "European Union",
    description:
      "Importers above 50 tonnes a year of covered goods declare embedded emissions each year. First annual declaration covers 2026.",
    requirements: ["Authorised declarant status", "Embedded emissions per import", "Annual declaration"],
    nextDeadline: (now = new Date()) => {
      const y = now.getUTCFullYear();
      if (y < 2027) return "2027-09-30";
      return now <= new Date(Date.UTC(y, 8, 30, 23, 59)) ? `${y}-09-30` : `${y + 1}-09-30`;
    },
    legalDeadline: true,
  },
  {
    regulationId: "csrd",
    label: "CSRD",
    name: "CSRD - Corporate Sustainability Reporting Directive",
    jurisdiction: "European Union",
    description:
      "Applies to large companies. Second-wave companies report on financial year 2027 in 2028. Most SMEs are asked for data by these companies, not covered directly.",
    requirements: ["Double materiality assessment", "ESRS disclosure", "Limited assurance"],
    nextDeadline: (now = new Date()) => (now.getUTCFullYear() <= 2028 ? "2028-12-31" : yearEnd(now)),
    legalDeadline: true,
  },
  {
    regulationId: "ghg",
    label: "GHG Protocol",
    name: "GHG Protocol Corporate Standard",
    jurisdiction: "Global",
    description:
      "Method standard for counting Scope 1, 2 and 3 emissions. Voluntary; the date is the end of your reporting year.",
    requirements: ["Scope 1 and 2 emissions", "Scope 3 screening", "Annual inventory"],
    nextDeadline: yearEnd,
    legalDeadline: false,
  },
];

export const frameworkByLabel = (label: string) =>
  FRAMEWORKS.find((f) => f.label.toLowerCase() === label.toLowerCase());
