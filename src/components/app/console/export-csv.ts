/**
 * CSV export of the console records. Built from the same overview payload the
 * screen draws, so the file never shows a figure the screen does not.
 */
import type { ConsoleOverviewData } from "./types";

export type ExportSection = "overview" | "evidence" | "obligations" | "connections" | "audit";

export type Cell = string | number | null | undefined;

/** RFC 4180 quoting, plus a guard against spreadsheet formula injection. */
export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export interface SectionTable {
  header: string[];
  rows: Cell[][];
}

const table = (header: string[], rows: Cell[][]): SectionTable => ({ header, rows });

/** The rows a section exports. CSV and PDF both read this, so they match. */
export function sectionTable(data: ConsoleOverviewData, section: ExportSection): SectionTable {
  switch (section) {
    case "overview":
      return table(
        ["metric", "category", "unit", "period", "period_start", "site", "value", "source", "confidence"],
        data.metrics.flatMap((m) =>
          m.points.map((p) => [m.label, m.category, m.unit, p.label, p.periodStart, p.site ?? "All sites", p.value, p.source, p.confidence]),
        ),
      );
    case "evidence":
    case "connections":
      return table(
        ["provider", "category", "status", "coverage_pct", "last_sync_at", "note"],
        data.connections.map((c) => [c.provider, c.category, c.status, c.coveragePct, c.lastSyncAt, c.note]),
      );
    case "obligations":
      return table(
        ["framework", "title", "due_date", "status", "progress_pct", "owner", "agent", "detail"],
        data.obligations.map((o) => [o.framework, o.title, o.dueDate, o.status, o.progressPct, o.ownerName, o.agentKey, o.detail]),
      );
    case "audit":
      return table(
        ["time", "actor_type", "actor", "verb", "object", "detail"],
        data.events.map((e) => [e.createdAt, e.actorType, e.actorName, e.verb, e.object, e.detail]),
      );
  }
}

export function buildSectionCsv(data: ConsoleOverviewData, section: ExportSection): string {
  const t = sectionTable(data, section);
  return toCsv(t.header, t.rows);
}

export function exportFileName(data: ConsoleOverviewData, section: ExportSection, ext: string, suffix = ""): string {
  const slug = (data.workspace.name || "workspace").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `vuneli-${slug || "workspace"}-${section}${suffix}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

export function downloadSectionCsv(data: ConsoleOverviewData, section: ExportSection, suffix = "") {
  // BOM so Excel opens Greek text correctly.
  const blob = new Blob(["\uFEFF", buildSectionCsv(data, section)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = exportFileName(data, section, "csv", suffix);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
