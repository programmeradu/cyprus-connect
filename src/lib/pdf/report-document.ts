/**
 * The PDF export for a drafted report.
 *
 * Typographic, not decorative: one accent rule, one type family, generous
 * margins. It must read the same as the document on the screen, because an
 * auditor compares the two.
 */

import jsPDF from "jspdf";

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

const INK: [number, number, number] = [26, 31, 27];
const QUIET: [number, number, number] = [104, 114, 105];
const RULE: [number, number, number] = [206, 214, 205];
const ACCENT: [number, number, number] = [74, 106, 61];

export function buildReportPdf(report: PdfReport): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
  const margin = 56;
  const width = page.w - margin * 2;
  let y = margin;

  const room = (needed: number) => {
    if (y + needed <= page.h - margin - 24) return;
    footer(doc, page, margin);
    doc.addPage();
    y = margin;
  };

  const text = (
    value: string,
    size: number,
    style: "normal" | "bold",
    colour: [number, number, number],
    lead: number,
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...colour);
    for (const line of doc.splitTextToSize(value, width) as string[]) {
      room(lead);
      doc.text(line, margin, y);
      y += lead;
    }
  };

  // Cover block
  doc.setFillColor(...ACCENT);
  doc.rect(margin, y, 40, 3, "F");
  y += 26;
  text(report.title, 22, "bold", INK, 27);
  y += 4;
  text(
    `${report.workspaceName} · ${report.framework} · Reporting period ${report.periodLabel}`,
    10.5,
    "normal",
    QUIET,
    15,
  );
  text(
    `Status ${report.status.replace("_", " ")}. Drafted by ${report.agentName ?? "the reporting agent"}. Exported ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`,
    10.5,
    "normal",
    QUIET,
    15,
  );

  y += 10;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + width, y);
  y += 22;

  if (report.summary) {
    text("Executive summary", 11, "bold", ACCENT, 16);
    y += 2;
    text(report.summary, 11, "normal", INK, 16.5);
    y += 14;
  }

  for (const section of report.sections) {
    room(70);
    text(`${section.code}  ${section.title}`, 13, "bold", INK, 19);
    y += 2;
    if (section.body) text(section.body, 10.8, "normal", INK, 16);

    if (section.figures.length > 0) {
      y += 8;
      for (const figure of section.figures) {
        room(30);
        doc.setDrawColor(...RULE);
        doc.line(margin, y - 9, margin + width, y - 9);
        text(`${figure.label}: ${figure.value}`, 10.5, "bold", INK, 14);
        if (figure.source) text(`Source: ${figure.source}`, 9.2, "normal", QUIET, 12.5);
        y += 4;
      }
    }

    if (section.gaps.length > 0) {
      y += 6;
      text("Data gaps", 9.5, "bold", ACCENT, 13);
      for (const gap of section.gaps) text(`- ${gap}`, 9.8, "normal", QUIET, 13.5);
    }

    y += 20;
  }

  footer(doc, page, margin);
  return doc;
}

function footer(doc: jsPDF, page: { w: number; h: number }, margin: number) {
  const index = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...QUIET);
  doc.text("Drafted in the Vuneli console. Review before you file it.", margin, page.h - 30);
  doc.text(String(index), page.w - margin, page.h - 30, { align: "right" });
}
