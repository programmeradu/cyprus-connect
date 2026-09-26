/**
 * PDF export of one console section.
 *
 * Reads the same rows as the CSV (`sectionTable`), so the two files never
 * disagree. Landscape A4, a fixed type scale, columns sized from their
 * content, and cells that wrap instead of being cut. Long tables continue on
 * new pages with the header repeated.
 */

import jsPDF from "jspdf";
import type { Cell, SectionTable } from "@/components/app/console/export-csv";
import { plainPdfText } from "./plain-text";

const INK: [number, number, number] = [26, 31, 27];
const QUIET: [number, number, number] = [104, 114, 105];
const RULE: [number, number, number] = [206, 214, 205];
const ACCENT: [number, number, number] = [74, 106, 61];
const BAND: [number, number, number] = [244, 246, 242];

export interface SectionPdfInput {
  workspaceName: string;
  sectionLabel: string;
  filterLabel: string;
  table: SectionTable;
  generatedAt?: Date;
}

function cellText(value: Cell): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString("en-GB") : value.toLocaleString("en-GB", { maximumFractionDigits: 3 });
  }
  return plainPdfText(String(value));
}

function headerText(value: string): string {
  const s = value.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Column widths: each column gets room for its header and a capped sample
 * of its content, then everything is scaled to the page width. A column
 * never drops below a readable minimum; text wraps within it.
 */
export function columnWidths(
  measure: (s: string) => number,
  table: SectionTable,
  total: number,
  min = 44,
  cap = 220,
): number[] {
  const want = table.header.map((h, i) => {
    let w = measure(headerText(h));
    for (const row of table.rows.slice(0, 200)) w = Math.max(w, Math.min(cap, measure(cellText(row[i]))));
    return Math.max(min, w + 12);
  });
  const sum = want.reduce((a, b) => a + b, 0);
  if (sum <= total) return want.map((w) => (w / sum) * total);
  // Shrink wide columns first, keeping every column at least `floor`. With
  // very many columns the floor itself drops so the table never leaves the page.
  const floor = Math.min(min, total / want.length);
  const scale = (total - floor * want.length) / Math.max(1, sum - floor * want.length);
  return want.map((w) => floor + (Math.max(floor, w) - floor) * Math.max(0, scale));
}

export function buildSectionPdf(input: SectionPdfInput): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
  const margin = 40;
  const width = page.w - margin * 2;
  const size = 8.4;
  const lead = 10.6;
  const padY = 5;
  const bottom = page.h - margin - 20;
  const when = input.generatedAt ?? new Date();

  // Cover lines
  let y = margin;
  doc.setFillColor(...ACCENT);
  doc.rect(margin, y, 36, 3, "F");
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...INK);
  doc.text(plainPdfText(`${input.workspaceName} - ${input.sectionLabel}`), margin, y, { maxWidth: width });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...QUIET);
  doc.text(
    plainPdfText(
      `${input.filterLabel}. ${input.table.rows.length} row${input.table.rows.length === 1 ? "" : "s"}. Exported ${when.toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}.`,
    ),
    margin,
    y,
    { maxWidth: width },
  );
  y += 18;

  doc.setFontSize(size);
  doc.setFont("helvetica", "bold");
  const widths = columnWidths((s) => doc.getTextWidth(s), input.table, width);
  const xs = widths.reduce<number[]>((acc, w, i) => [...acc, (acc[i] ?? margin) + w], [margin]);

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    const lines = input.table.header.map((h, i) => doc.splitTextToSize(headerText(h), widths[i] - 8) as string[]);
    const h = Math.max(...lines.map((l) => l.length)) * lead + padY * 2;
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.8);
    lines.forEach((l, i) => doc.text(l, xs[i] + 4, y + padY + size));
    y += h;
    doc.line(margin, y, margin + width, y);
  };

  if (input.table.rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...QUIET);
    doc.text("No records match this filter.", margin, y + 14);
    footer(doc, page, margin);
    return doc;
  }

  drawHeader();
  doc.setFont("helvetica", "normal");
  input.table.rows.forEach((row, r) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = input.table.header.map((_, i) => doc.splitTextToSize(cellText(row[i]), widths[i] - 8) as string[]);
    const h = Math.max(1, ...lines.map((l) => l.length)) * lead + padY * 2;
    if (y + h > bottom) {
      footer(doc, page, margin);
      doc.addPage();
      y = margin;
      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
    }
    if (r % 2 === 1) {
      doc.setFillColor(...BAND);
      doc.rect(margin, y, width, h, "F");
    }
    doc.setTextColor(...INK);
    lines.forEach((l, i) => doc.text(l, xs[i] + 4, y + padY + size));
    y += h;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + width, y);
  });

  footer(doc, page, margin);
  return doc;
}

function footer(doc: jsPDF, page: { w: number; h: number }, margin: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...QUIET);
  doc.text("Exported from the Vuneli console. Figures as recorded; review before you file them.", margin, page.h - 24);
  doc.text(String(doc.getNumberOfPages()), page.w - margin, page.h - 24, { align: "right" });
}
