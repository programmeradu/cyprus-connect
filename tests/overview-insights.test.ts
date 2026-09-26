import { describe, expect, it } from "vitest";
import { buildInsights } from "@/components/app/dashboard/overview/insights";
import type { ConsoleOverviewData } from "@/components/app/console/types";

const base = {
  metrics: [],
  runs: [],
  tasks: [],
  connections: [],
  obligations: [],
  events: [],
  agents: [],
} as unknown as ConsoleOverviewData;

describe("overview insights", () => {
  it("says steady when nothing needs a decision", () => {
    const out = buildInsights(base);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("steady");
  });

  it("puts failed runs before decisions and caps the list", () => {
    const data = {
      ...base,
      runs: [{ status: "needs_review", summary: "Bad file" }],
      tasks: [{ severity: "normal", title: "Sign CBAM" }],
    } as unknown as ConsoleOverviewData;
    const out = buildInsights(data, 1);
    expect(out.map((i) => i.id)).toEqual(["runs"]);
  });
});
