/**
 * Compiles every PDF template with real data shapes, so a template error is
 * caught here and not by a customer pressing Download.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";
import { buildBoardSummaryData } from "@/lib/pdf/board-summary";
import { buildReportData } from "@/lib/pdf/report";
import { buildCbamData } from "@/lib/pdf/cbam";
import { renderTypst } from "@/lib/pdf/typst-render";

const BASE = "http://pdf.test";
vi.stubGlobal("fetch", async (url: string) => {
  const path = join(process.cwd(), "public", url.replace(BASE, ""));
  return new Response(readFileSync(path));
});
const wasm = readFileSync("node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm");
const opts = { base: BASE, wasm };
const isPdf = (b: Uint8Array) => new TextDecoder().decode(b.slice(0, 5)) === "%PDF-";

const overview = (months: number) =>
  ({
    workspace: { legalName: "Δοκιμή Λτδ", name: "x", sector: "", country: "Cyprus" },
    metrics: months
      ? [{ key: "co2e_total", unit: "tCO2e", goodDirection: "down", current: 1, points: Array.from({ length: months }, (_, i) => ({ label: `M${i}`, value: i * 0.4, source: "manual" })) }]
      : [],
    obligations: [{ framework: "CBAM", title: "Q3", dueDate: "2026-10-31", status: "at_risk", progressPct: 40 }],
    tasks: [{ title: "Approve", kind: "email", severity: "high", dueAt: null }],
    events: [{ createdAt: "2026-09-30", actorName: "Ledger", actorType: "agent", verb: "asked", object: "bill" }],
    agents: [],
  }) as never;

describe("PDF templates compile", () => {
  it("board summary: no readings, one month, a full year", async () => {
    for (const m of [0, 1, 12]) expect(isPdf(await renderTypst("board.typ", await buildBoardSummaryData(overview(m)), opts))).toBe(true);
  }, 120_000);

  it("report with gaps, figures and Greek text", async () => {
    const data = await buildReportData({
      title: "VSME report", framework: "VSME", periodLabel: "FY 2025", status: "draft", workspaceName: "Δοκιμή Λτδ",
      summary: "Σύνοψη.", sections: [{ code: "", title: "Ενέργεια", body: "Κείμενο.", figures: [{ label: "kWh", value: "1", source: "EAC" }], gaps: ["Missing bill"] }],
    });
    expect(isPdf(await renderTypst("report.typ", data, opts))).toBe(true);
  }, 120_000);

  it("CBAM with no lines and unsigned", async () => {
    const data = await buildCbamData({
      year: 2026, company: "X", declarant: { legalName: null, eori: null, accountNumber: null }, status: "needs_data", draftHash: "0".repeat(64), signedBy: null, signedAt: null,
      draft: { dueDate: "2027-09-30", belowThreshold: true, totals: { embeddedT: 0, directT: 0, indirectT: 0, massTonnesCounted: 0, electricityMWh: 0, lines: 0, certificates: 0, costMissingLines: 0, costEur: null, costProvisional: false, defaultShare: 0 }, bySector: [], bySupplier: [], lines: [], issues: [] },
    } as never);
    expect(isPdf(await renderTypst("cbam.typ", data, opts))).toBe(true);
  }, 120_000);
});
