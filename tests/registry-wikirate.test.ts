import { describe, expect, it } from "vitest";
import { parseRegistrationNo } from "@/lib/integrations/registry.server";
import { median, peerFromFigures, pickFigures, tonnesFactor } from "@/lib/integrations/wikirate.server";

describe("registration numbers", () => {
  it("reads HE numbers in common forms", () => {
    expect(parseRegistrationNo("HE 123456")).toMatchObject({ number: "123456" });
    expect(parseRegistrationNo("he123456")).toMatchObject({ number: "123456" });
  });
  it("rejects plain names", () => {
    expect(parseRegistrationNo("Bank of Cyprus")).toBeNull();
  });
});

describe("WikiRate figures", () => {
  it("skips zero placeholders and takes the latest real year", () => {
    const f = pickFigures([
      { metric: "Global Reporting Initiative+Direct greenhouse gas (GHG) emissions (Scope 1) (GRI 305-1-a)", year: 2022, value: "0" },
      { metric: "Global Reporting Initiative+Direct greenhouse gas (GHG) emissions (Scope 1) (GRI 305-1-a)", year: 2021, value: "1,000" },
    ]);
    if (f.scope1) expect(f.scope1.value).toBe(1000);
  });
  it("converts units and refuses unknown ones", () => {
    expect(tonnesFactor("kilotonnes CO2e")).toBe(1000);
    expect(tonnesFactor("metric tonnes CO2 eq")).toBe(1);
    expect(tonnesFactor("MWh")).toBeNull();
  });
  it("does not divide by a head count from a distant year", () => {
    const row = peerFromFigures("X", {
      scope1: { key: "scope1", value: 100, unit: "tonnes", year: 2022, metric: "m", sourceUrl: "u" },
      employees: { key: "employees", value: 10, unit: null, year: 2018, metric: "m", sourceUrl: "u" },
    });
    expect(row.status).toBe("no_figures");
  });
  it("median", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([])).toBeNull();
  });
});
