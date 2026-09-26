import { describe, expect, it } from "vitest";
import { isFutureMonth, previousMonth, referenceLine, summarise, trendPercent } from "@/lib/emissions/footprint";

describe("footprint", () => {
  it("uses the published factor per line", () => {
    const l = referenceLine("electricity", 1000);
    expect(l.tonnes).toBeCloseTo(0.61, 6);
    expect(l.scope).toBe(2);
    expect(l.basis).toBe("reference");
  });

  it("splits scopes, drops empty lines and reports the basis", () => {
    const f = summarise([
      referenceLine("electricity", 1000),
      referenceLine("gas", 100),
      referenceLine("water", 0),
      { ...referenceLine("transport", 1000), basis: "climatiq", tonnes: 0.2 },
    ]);
    expect(f.lines.map((l) => l.key)).toEqual(["electricity", "gas", "transport"]);
    expect(f.scopes.scope1).toBeCloseTo(0.2141, 4);
    expect(f.scopes.scope2).toBeCloseTo(0.61, 6);
    expect(f.scopes.scope3).toBeCloseTo(0.2, 6);
    expect(f.totalTonnes).toBeCloseTo(1.0241, 4);
    expect(f.basis).toBe("mixed");
  });

  it("claims no trend without an earlier month", () => {
    expect(trendPercent(5, null)).toBeNull();
    expect(trendPercent(5, 0)).toBeNull();
    expect(trendPercent(4, 5)).toBeCloseTo(-20);
  });

  it("handles month edges", () => {
    expect(previousMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
    const now = new Date(Date.UTC(2026, 8, 26));
    expect(isFutureMonth(2026, 9, now)).toBe(false);
    expect(isFutureMonth(2026, 10, now)).toBe(true);
    expect(isFutureMonth(2027, 1, now)).toBe(true);
  });
});
