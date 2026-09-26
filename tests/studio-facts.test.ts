import { describe, expect, it } from "vitest";
import { studioBriefPrompt, studioFacts, type StudioSource } from "@/lib/studio/facts";

const empty: StudioSource = { company: null, emissions: [], completedActions: 0, openActionTitles: [] };
const full: StudioSource = {
  company: { companyName: "Akamas Foods", companyIndustry: "Food", teamSize: "11-50", countryCode: "CY" },
  emissions: [
    { totalCo2e: 9, electricity: 1200, gas: 0, transport: 300, periodMonth: 8, periodYear: 2026 },
    { totalCo2e: 10, electricity: 1300, gas: 0, transport: 320, periodMonth: 7, periodYear: 2026 },
  ],
  completedActions: 4,
  openActionTitles: ["Install PV", "LED lighting", "Route planning", "Fourth"],
};

describe("studio facts", () => {
  it("gives no facts when records are missing, for every data topic", () => {
    for (const c of ["company_data", "progress", "insights", "recommendations"] as const) {
      expect(studioFacts(c, empty)).toEqual([]);
    }
  });

  it("never uses records for a free brief", () => {
    expect(studioFacts("custom", full)).toEqual([]);
  });

  it("states the real change between the two latest periods", () => {
    expect(studioFacts("progress", full)[0]).toBe("Emissions 2026-08: 9 tCO2e, down 10% from 2026-07");
  });

  it("skips zero sources and caps planned actions at three", () => {
    expect(studioFacts("insights", full).some((f) => f.startsWith("Gas"))).toBe(false);
    expect(studioFacts("recommendations", full)).toHaveLength(3);
  });

  it("forbids figures in the prompt when none are given", () => {
    expect(studioBriefPrompt("poster", [])).toMatch(/Do not put any numbers/);
    expect(studioBriefPrompt("poster", ["Total: 9 tCO2e"])).toMatch(/- Total: 9 tCO2e/);
  });
});
