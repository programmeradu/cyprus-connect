import { describe, expect, it } from "vitest";
import { checkGrounding } from "@/lib/copilot/grounding";
import { parseAction } from "@/lib/copilot/prompt";
import { FIXED_BRIEFING as B } from "./verde-fixtures";

describe("Verde figure check", () => {
  it("passes figures from the records when the record is named", () => {
    const r = checkGrounding("Total emissions were 18.4 tCO2e in Jun 2026, down 6.1% vs May (total_co2e).", B);
    expect(r).toEqual({ ok: true, unsupported: [], unsourced: [] });
  });
  it("accepts rounding of a recorded figure", () => {
    expect(checkGrounding("Electricity used was about 14,200 kWh in Jun 2026.", B).ok).toBe(true);
    expect(checkGrounding("Total emissions: 18 tCO2e in June (total_co2e).", B).ok).toBe(true);
  });
  it("fails a made-up figure", () => {
    const r = checkGrounding("Your renewable share is 42% (renewable_share).", B);
    expect(r.ok).toBe(false);
    expect(r.unsupported).toEqual(["42%"]);
  });
  it("fails a made-up saving even when it sounds plausible", () => {
    expect(checkGrounding("Switching to solar would save 7.5 tCO2e a year.", B).unsupported).toEqual(["7.5"]);
  });
  it("fails a recorded figure quoted with no source", () => {
    const r = checkGrounding("You are at 18.4 now.", B);
    expect(r.unsupported).toEqual([]);
    expect(r.unsourced).toHaveLength(1);
  });
  it("ignores years, dates, laws, task ids and small counts", () => {
    expect(checkGrounding("Under Regulation (EU) 2023/956, Article 35, report by 2027-04-30. Task #41 is one of 3 open items in 2026.", B).ok).toBe(true);
  });
  it("an honest 'not recorded' answer passes", () => {
    expect(checkGrounding("There is no renewable_share reading yet, so I cannot give a share.", B).ok).toBe(true);
  });
  it("reads only allowed action blocks", () => {
    expect(parseAction('x ```action\n{"kind":"create_task","title":"t","summary":"s","payload":{}}\n```')?.kind).toBe("create_task");
    expect(parseAction('```action\n{"kind":"delete_everything","title":"t","summary":"s","payload":{}}\n```')).toBeNull();
  });
});

import { dropRepeatedParagraphs } from "@/lib/agents/planner";
describe("planner summary", () => {
  it("drops a short opener that the next paragraph repeats", () => {
    const a = "I have drafted an email to Acme requesting data. This email is awaiting approval.";
    const b = "I found one supplier, Acme. I have drafted an email to Acme requesting data, which is awaiting approval.";
    expect(dropRepeatedParagraphs(`${a}\n\n${b}`)).toBe(b);
    expect(dropRepeatedParagraphs("One thing happened.\n\nA different thing happened later.")).toContain("One thing");
  });
});
