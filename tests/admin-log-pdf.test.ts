import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ requireVuneliUserId: vi.fn() }));

import { decideAdmin } from "@/lib/admin-auth";
import { QA_ACCOUNT } from "@/lib/qa-bypass";
import { errorFields, logger, newRef, redact } from "@/lib/log";
import { plainPdfText } from "@/lib/pdf/plain-text";
import { buildSectionPdf, columnWidths } from "@/lib/pdf/console-section-pdf";

describe("decideAdmin", () => {
  it("401 without a session", () => {
    const r = decideAdmin(null, false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(401);
  });
  it("403 for a signed-in account without the role", () => {
    const r = decideAdmin("u1", false);
    if (!r.ok) expect(r.response.status).toBe(403);
    else throw new Error("expected refusal");
  });
  it("403 for the QA identity even if a role row exists", () => {
    const r = decideAdmin(QA_ACCOUNT.id, true);
    expect(r.ok).toBe(false);
  });
  it("allows an admin", () => {
    expect(decideAdmin("u1", true)).toEqual({ ok: true, userId: "u1" });
  });
});

describe("log", () => {
  it("redacts sensitive keys at any depth", () => {
    expect(redact({ a: 1, password: "x", nested: { apiKey: "k", Email: "e@x" } })).toEqual({
      a: 1,
      password: "[redacted]",
      nested: { apiKey: "[redacted]", Email: "[redacted]" },
    });
  });
  it("caps long strings", () => {
    expect((redact("x".repeat(900)) as string).length).toBeLessThan(510);
  });
  it("returns an 8-hex reference and writes one JSON line", () => {
    expect(newRef()).toMatch(/^[0-9a-f]{8}$/);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const ref = logger("t").error("boom", new Error("bad"), { token: "secret" });
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line).toMatchObject({ level: "error", scope: "t", message: "boom", ref, token: "[redacted]", errorMessage: "bad" });
    spy.mockRestore();
  });
  it("handles non-Error throws", () => {
    expect(errorFields("oops")).toEqual({ errorMessage: "oops" });
  });
});

describe("pdf text and layout", () => {
  it("keeps Latin-1, swaps subscripts and transliterates Greek", () => {
    expect(plainPdfText("tCO₂e – €5")).toBe("tCO2e - EUR5");
    expect(plainPdfText("Λεμεσός")).toBe("Lemesos");
  });
  it("fits columns to the page and keeps a minimum width", () => {
    const widths = columnWidths((s) => s.length * 5, { header: ["a", "b"], rows: [["x".repeat(400), 1]] }, 300, 44);
    expect(widths.reduce((a, b) => a + b, 0)).toBeCloseTo(300);
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(44);
  });
  it("builds a multi-page PDF for a long table and a one-page PDF when empty", () => {
    const rows = Array.from({ length: 300 }, (_, i) => [`Metric ${i}`, "energy", i * 1.5, "long note ".repeat(8)]);
    const long = buildSectionPdf({ workspaceName: "Acme", sectionLabel: "Overview", filterLabel: "All time", table: { header: ["metric", "category", "value", "note"], rows } });
    expect(long.getNumberOfPages()).toBeGreaterThan(3);
    const empty = buildSectionPdf({ workspaceName: "Acme", sectionLabel: "Audit", filterLabel: "2025", table: { header: ["time"], rows: [] } });
    expect(empty.getNumberOfPages()).toBe(1);
  });
});
