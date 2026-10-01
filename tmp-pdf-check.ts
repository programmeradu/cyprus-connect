import { readFileSync, writeFileSync } from "fs";
import { buildBoardSummaryData } from "@/lib/pdf/board-summary";
import { buildReportData } from "@/lib/pdf/report";
import { buildCbamData } from "@/lib/pdf/cbam";
import { renderTypst } from "@/lib/pdf/typst-render";

const wasm = readFileSync("node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm");
const opts = { base: "http://localhost:8765", wasm };
const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const vals = [31, 27, 26, 28, 27, 30, 33, 36, 42, 48, 41, 38.4];

const overview: any = {
  workspace: { legalName: "Kyrenia Coastal Hospitality Ltd", name: "Kyrenia", sector: "Hotels and accommodation", country: "Cyprus" },
  metrics: [
    { key: "co2e_total", unit: "tCO2e", goodDirection: "down", current: 38.4, points: months.map((label, i) => ({ label, value: vals[i], source: i % 2 ? "EAC electricity bills" : "Bank of Cyprus payments" })) },
    { key: "data_coverage", current: 78, points: [{ label: "x", value: 78 }] },
  ],
  obligations: [
    { framework: "CBAM", title: "Quarterly report Q3 2026 — imported steel fixtures", dueDate: "2026-10-31", status: "at_risk", progressPct: 45 },
    { framework: "VSME", title: "Basic module sustainability report for the bank, with a very long title that must wrap properly in its column", dueDate: "2026-11-30", status: "on_track", progressPct: 70 },
  ],
  tasks: Array.from({ length: 12 }, (_, i) => ({ title: `Decision number ${i + 1}: approve supplier data request`, kind: "email", severity: i % 3 ? "normal" : "high", dueAt: i % 2 ? "2026-10-08" : null })),
  events: Array.from({ length: 10 }, (_, i) => ({ createdAt: "2026-09-30", actorName: i % 2 ? "Ledger" : "Maria Georgiou", actorType: i % 2 ? "agent" : "user", verb: "uploaded", object: "EAC bill" })),
  agents: [{ status: "active" }, { status: "active" }],
};
const empty: any = { ...overview, metrics: [], obligations: [], tasks: [], events: [], workspace: { legalName: "Νέα Εταιρεία Λτδ", sector: "", country: "" } };

const report: any = {
  title: "VSME Basic Module report 2025", framework: "VSME", periodLabel: "FY 2025", status: "in_review", workspaceName: "Kyrenia Coastal Hospitality Ltd", agentName: "Scribe",
  summary: "The company emitted 412 tCO₂e in 2025.\n\nElectricity is the largest source.",
  sections: [
    { code: "B1", title: "Basis for preparation", body: "This report follows the VSME Basic Module.\n\n" + "Lorem ipsum text for length. ".repeat(60), figures: [], gaps: [] },
    { code: "B3", title: "Energy and greenhouse gas emissions", body: "Electricity uses the Cyprus grid factor.", figures: [{ label: "Electricity", value: "612,400 kWh", source: "EAC bills" }, { label: "Scope 2", value: "338.0 tCO₂e", source: "Grid factor 2024" }], gaps: ["Missing August bill", "LPG invoices for Q4 not uploaded"] },
    { code: "B8", title: "Workforce — Ελληνικά στοιχεία", body: "Η εταιρεία απασχολεί 84 άτομα.", figures: [], gaps: [] },
  ],
};

const line = (i: number) => ({ cnCode: "7308 90 98", supplierName: i % 2 ? "Limassol Steel Works" : "Anadolu Metal A.Ş.", originCountry: i % 2 ? "CN" : "TR", installationId: i % 3 ? "" : "TR-INST-00421", netMass: 12.5 + i, unit: "t", basis: ["actual", "default", "no_default"][i % 3], defaultSource: i % 3 === 1 ? { tableName: "TR iron & steel", total: 2.134 } : null, embeddedT: 20 + i * 1.3, costEur: i % 3 === 2 ? null : 900 + i * 12, priceProvisional: i > 30 });
const cbam: any = {
  year: 2026, company: "Kyrenia Coastal Hospitality Ltd", declarant: { legalName: "Kyrenia Coastal Hospitality Ltd", eori: "CY10012345X", accountNumber: null }, status: "signed", draftHash: "a".repeat(64), signedBy: "Andreas Christou", signedAt: "2026-09-29",
  draft: {
    dueDate: "2027-09-30", belowThreshold: false,
    totals: { embeddedT: 1012.4, directT: 800, indirectT: 212.4, massTonnesCounted: 1190, electricityMWh: 0, lines: 40, certificates: 312.55, costMissingLines: 13, costEur: 24800, costProvisional: true, defaultShare: 0.42 },
    bySector: [{ sector: "iron-steel", embeddedT: 900, massTonnes: 1000 }, { sector: "aluminium", embeddedT: 112.4, massTonnes: 190 }],
    bySupplier: [{ supplierName: "Limassol Steel Works", lines: 20, defaultLines: 0, embeddedT: 500 }, { supplierName: "Anadolu Metal A.Ş.", lines: 20, defaultLines: 13, embeddedT: 512.4 }],
    lines: Array.from({ length: 40 }, (_, i) => line(i)),
    issues: [{ message: "13 lines need a supplier value: no EU default exists for this CN code.", lineIds: ["L3", "L6", "L9"] }],
  },
};

for (const [name, tpl, data] of [
  ["board", "board.typ", await buildBoardSummaryData(overview)],
  ["board-empty", "board.typ", await buildBoardSummaryData(empty)],
  ["report", "report.typ", await buildReportData(report)],
  ["cbam", "cbam.typ", await buildCbamData(cbam)],
] as const) {
  const bytes = await renderTypst(tpl, data as any, opts);
  writeFileSync(`/tmp/pdfbake/app-${name}.pdf`, bytes);
  console.log(name, bytes.length);
}
