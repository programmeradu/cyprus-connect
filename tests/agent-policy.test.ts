import { describe, expect, it } from "vitest";
import { budgetAllows, decideStep, retryDelayMs, spentToday } from "@/lib/agents/policy";
import { stableStringify, sha256Hex } from "@/lib/agents/hash";
import { findAtRiskObligations, findStaleMetrics } from "@/lib/agents/evidence-sweep";

describe("autonomy policy", () => {
  it("uses safe defaults", () => {
    expect(decideStep(0)).toBe("execute");
    expect(decideStep(1)).toBe("execute");
    expect(decideStep(2)).toBe("ask");
    expect(decideStep(3)).toBe("ask");
  });
  it("lets the owner allow level 2 or deny any level", () => {
    expect(decideStep(2, { 2: "auto" })).toBe("execute");
    expect(decideStep(1, { 1: "deny" })).toBe("block");
    expect(decideStep(0, { 0: "ask" })).toBe("ask");
  });
  it("never runs level 3 alone, whatever the policy says", () => {
    expect(decideStep(3, { 3: "auto" })).toBe("ask");
    expect(decideStep(3, { 3: "deny" })).toBe("block");
  });
});

describe("budget and retries", () => {
  it("resets spend on a new day", () => {
    const s = { dailyBudgetUsd: 1, spentUsd: 0.9, spentOn: "2026-09-25" };
    expect(spentToday(s, "2026-09-26")).toBe(0);
    expect(budgetAllows(s, "2026-09-25", 0.2)).toBe(false);
    expect(budgetAllows(s, "2026-09-26", 0.2)).toBe(true);
  });
  it("backs off 1, 4, 16 minutes then caps at 60", () => {
    expect([1, 2, 3, 4, 9].map(retryDelayMs)).toEqual([60_000, 240_000, 960_000, 3_600_000, 3_600_000]);
  });
});

describe("ledger hashing", () => {
  it("is stable across key order", async () => {
    expect(stableStringify({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
    expect(await sha256Hex(stableStringify({ a: 1, b: 2 }))).toBe(await sha256Hex(stableStringify({ b: 2, a: 1 })));
  });
});

describe("evidence sweep rules", () => {
  const now = new Date("2026-09-26T00:00:00Z");
  it("flags missing and stale metrics", () => {
    const out = findStaleMetrics(
      [
        { key: "electricity_kwh", label: "A", latestPeriod: "2026-09-01" },
        { key: "cost_eur", label: "B", latestPeriod: "2026-06-01" },
        { key: "scope1", label: "C", latestPeriod: null },
        { key: "co2e_total", label: "Derived", latestPeriod: null },
      ],
      now,
    );
    expect(out.map((m) => m.key)).toEqual(["cost_eur", "scope1"]);
  });
  it("flags due-soon and overdue obligations under 50%", () => {
    const base = { title: "t", framework: "VSME", status: "on_track" };
    const out = findAtRiskObligations(
      [
        { ...base, id: "soon", dueDate: "2026-10-10", progressPct: 20 },
        { ...base, id: "done-enough", dueDate: "2026-10-10", progressPct: 80 },
        { ...base, id: "far", dueDate: "2027-03-01", progressPct: 0 },
        { ...base, id: "late", dueDate: "2026-09-01", progressPct: 10 },
        { ...base, id: "bad-date", dueDate: "soon", progressPct: 0 },
      ],
      now,
    );
    expect(out.map((o) => o.id)).toEqual(["soon", "late"]);
  });
});
