import { describe, it, expect } from "vitest";
import { markdownToSections } from "@/lib/pdf/markdown-sections";

describe("drafted report → PDF sections", () => {
  it("splits headings, keeps intro as summary and strips markdown", () => {
    const r = markdownToSections("Intro\n## 1. Executive Summary\n**Hi** there\n- a\n## Next\nx");
    expect(r.sections.map((s) => s.title)).toEqual(["Executive Summary", "Next"]);
    expect(r.sections[0].body).toBe("Hi there\n• a");
    expect(r.summary).toBe("Intro");
  });
  it("falls back to one section when there are no headings", () => {
    expect(markdownToSections("Just text").sections).toHaveLength(1);
  });
});
