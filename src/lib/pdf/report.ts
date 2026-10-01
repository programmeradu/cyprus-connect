/**
 * Drafted report PDF (VSME, CSRD and similar). Reads exactly what the report
 * page shows, so an auditor can compare paper and screen line by line.
 * Layout: public/pdf-typst/report.typ.
 */

import { fingerprint } from "./kit/fingerprint";
import { docId, longDate } from "./format";

export interface PdfFigure {
  label: string;
  value: string;
  source: string;
}

export interface PdfSection {
  code: string;
  title: string;
  body: string;
  figures: PdfFigure[];
  gaps: string[];
}

export interface PdfReport {
  title: string;
  framework: string;
  periodLabel: string;
  status: string;
  workspaceName: string;
  agentName?: string | null;
  summary?: string | null;
  sections: PdfSection[];
}

const statusWord = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const paras = (t: string | null | undefined) => (t ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export function reportData(r: PdfReport, hash: string, generatedAt: Date) {
  const gaps = r.sections.reduce((n, s) => n + s.gaps.length, 0);
  const figures = r.sections.reduce((n, s) => n + s.figures.length, 0);
  const draft = r.status !== "approved" && r.status !== "published";
  return {
    lang: "en",
    hash,
    docId: docId("RP", hash, generatedAt),
    issued: longDate(generatedAt),
    title: r.title,
    framework: r.framework,
    period: r.periodLabel,
    company: r.workspaceName,
    draft,
    draftNote: `This report is ${statusWord(r.status).toLowerCase()}. ${gaps ? `${gaps} gap${gaps === 1 ? " is" : "s are"} listed in the sections and must be closed before it is final.` : "No open gaps are recorded."}`,
    coverFacts: [
      { label: "Framework", value: r.framework },
      { label: "Status", value: statusWord(r.status) },
      { label: "Sections", value: String(r.sections.length) },
      { label: "Figures · open gaps", value: `${figures} · ${gaps}` },
    ],
    summary: paras(r.summary),
    chapters: r.sections.map((s, i) => ({
      n: s.code || String(i + 1).padStart(2, "0"),
      title: s.title,
      paras: paras(s.body),
      figures: s.figures,
      gaps: s.gaps,
    })),
    sources: [`Drafted${r.agentName ? ` by ${r.agentName}` : ""} in Vuneli from the workspace's stored records`, "each figure lists its own source in the table where it appears"],
  };
}

export async function buildReportData(r: PdfReport, generatedAt = new Date()) {
  const hash = await fingerprint({ kind: "report", r });
  return reportData(r, hash, generatedAt);
}

export async function downloadReport(r: PdfReport, fileName: string) {
  const { renderTypst, downloadBytes, siteBase, registerDocument } = await import("./typst-render");
  const { stampPdfDetails } = await import("./pdf-details");
  const issuedAt = new Date();
  const json = await buildReportData(r, issuedAt);
  const raw = await renderTypst("report.typ", json, { base: siteBase() });
  const bytes = await stampPdfDetails(raw, { kind: "report", docId: String(json.docId), hash: json.hash, issuedAt, title: String(json.title || "Sustainability report"), company: String(json.company || "Unnamed company") });
  await registerDocument("report", json, issuedAt);
  downloadBytes(bytes, fileName);
}
