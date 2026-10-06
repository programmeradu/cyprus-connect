import { describe, expect, it } from "vitest";
import { checkFit, yearsSince } from "@/lib/funding/match";
import { sanitizeRules } from "@/lib/funding/extract.server";
import { staffBand } from "@/lib/funding/funding.server";
import type { BusinessPicture, CallRules } from "@/lib/funding/rules";

const none: CallRules = {
  countries: null, applicantTypes: null, smeOnly: null, minEmployees: null, maxEmployees: null, maxRevenueEur: null,
  minCompanyAgeYears: null, maxCompanyAgeYears: null, sectors: null, consortiumRequired: null, requiredDocuments: [], evidence: [],
};
const biz: BusinessPicture = { country: "CY", employees: 12, employeesMax: 12, revenueEur: 800_000, companyAgeYears: 3, sector: "technology" as BusinessPicture["sector"] };

describe("funding fit check", () => {
  it("hides calls that state almost nothing (unknown rules never count as met)", () => {
    expect(checkFit(none, biz).verdict).toBe("hidden");
  });

  it("shows a strong fit when stated rules are positively met", () => {
    const r = checkFit({ ...none, countries: ["EU"], applicantTypes: ["company"], smeOnly: true }, biz);
    expect(r.verdict).toBe("strong");
    expect(r.failed).toHaveLength(0);
  });

  it("hides calls that only match generic applicant type and country (avoids false-positive strong fit)", () => {
    const r = checkFit({ ...none, countries: ["CY"], applicantTypes: ["company"] }, biz);
    expect(r.verdict).toBe("hidden");
  });

  it("fails a consortium-only call for a single company", () => {
    expect(checkFit({ ...none, countries: ["CY"], applicantTypes: ["company"], consortiumRequired: true }, biz).verdict).toBe("hidden");
  });

  it("fails a call for another country", () => {
    expect(checkFit({ ...none, countries: ["GR"], applicantTypes: ["company"], smeOnly: true }, biz).verdict).toBe("hidden");
  });

  it("asks for revenue when it is missing and the rest fits", () => {
    const r = checkFit({ ...none, countries: ["CY"], applicantTypes: ["company"], maxRevenueEur: 2_000_000 }, { ...biz, revenueEur: null });
    expect(r.verdict).toBe("needs_info");
    expect(r.missing.map((m) => m.fact)).toEqual(["revenue"]);
  });

  it("asks for an exact headcount when the size band straddles the limit", () => {
    const r = checkFit({ ...none, countries: ["CY"], applicantTypes: ["company"], maxEmployees: 25 }, { ...biz, employees: 11, employeesMax: 50 });
    expect(r.verdict).toBe("needs_info");
    expect(r.missing[0].fact).toBe("employees");
  });

  it("passes a band entirely under the limit and fails one entirely over it", () => {
    const rules = { ...none, countries: ["CY"], applicantTypes: ["company" as const], maxEmployees: 60 };
    expect(checkFit(rules, { ...biz, employees: 11, employeesMax: 50 }).verdict).toBe("strong");
    expect(checkFit(rules, { ...biz, employees: 201, employeesMax: 500 }).verdict).toBe("hidden");
  });

  it("reads staff bands", () => {
    expect(staffBand("11-50")).toEqual({ lo: 11, hi: 50 });
    expect(staffBand("500+")).toEqual({ lo: 500, hi: null });
    expect(staffBand(null)).toBeNull();
  });

  it("works out company age from both date formats", () => {
    const now = new Date("2026-10-01T00:00:00Z");
    expect(yearsSince("2020-03-15", now)).toBe(6);
    expect(yearsSince("15/03/2020", now)).toBe(6);
    expect(yearsSince("unknown", now)).toBeNull();
  });
});

describe("rule reading safeguards", () => {
  it("drops a rule whose quote is not in the call text", () => {
    const raw = { ...none, smeOnly: true, countries: ["CY"], evidence: [{ rule: "smeOnly", quote: "only SMEs may apply" }, { rule: "countries", quote: "invented quote" }] };
    const out = sanitizeRules(raw, "Call text: Only SMEs may apply. Open to all sectors.")!;
    expect(out.smeOnly).toBe(true);
    expect(out.countries).toBeNull();
  });
});
