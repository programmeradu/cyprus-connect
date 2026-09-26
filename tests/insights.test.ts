import { describe, expect, it } from "vitest";
import { parseGrid, shiftGain } from "@/lib/insights/grid";
import { parseAdvice } from "@/lib/insights/advice";

describe("grid", () => {
  const co2 = { unix_seconds: [1790370000, 1790373600, 1790377200, 1790380800], co2eq: [885.7, null, 409.2, 578.1] };
  const power = { production_types: [{ name: "Renewable share of load", data: [9.7, 30, null] }] };
  it("keeps measured hours only and finds extremes", () => {
    const g = parseGrid("CY", co2, power)!;
    expect(g.hours).toHaveLength(3);
    expect(g.cleanest.grams).toBe(409.2);
    expect(g.dirtiest.grams).toBe(885.7);
    expect(g.latest.grams).toBe(578.1);
    expect(g.renewableShare).toBe(30);
    expect(shiftGain(g)).toBeCloseTo(476.5);
  });
  it("returns null without usable hours", () => {
    expect(parseGrid("CY", { unix_seconds: [1], co2eq: [null] }, null)).toBeNull();
    expect(parseGrid("CY", {}, null)).toBeNull();
  });
});

describe("advice", () => {
  const facts = [{ id: 1, text: "a" }, { id: 2, text: "b" }];
  it("drops points that cite no given fact", () => {
    const raw = '```json {"points":[{"text":"Move the kiln to noon.","facts":[1,9]},{"text":"Buy offsets now please.","facts":[7]},{"text":"x","facts":[1]}]} ```';
    expect(parseAdvice(raw, facts)).toEqual([{ text: "Move the kiln to noon.", facts: [1] }]);
  });
  it("survives garbage", () => {
    expect(parseAdvice("no json", facts)).toEqual([]);
  });
});
