/**
 * CSV export of the console records. Built from the same overview payload the
 * screen draws, so the file never shows a figure the screen does not.
 */
import type { ConsoleOverviewData } from "./types";

export type ExportSection = "overview" | "evidence" | "obligations" | "connections" | "audit";

type Cell = string | number | null | undefined;

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

export function buildSectionCsv(data: ConsoleOverviewData, section: ExportSection): string {
  switch (section) {
    case "overview":
      return toCsv(
        ["metric", "category", "unit", "period", "period_start", "value", "source", "confidence"],
        data.metrics.flatMap((m) =>
          m.points.map((p) => [m.label, m.category, m.unit, p.label, p.periodStart, p.value, p.source, p.confidence]),
        ),
      );
    case "evidence":
    case "connections":
      return toCsv(
        ["provider", "category", "status", "coverage_pct", "last_sync_at", "note"],
        data.connections.map((c) => [c.provider, c.category, c.status, c.coveragePct, c.lastSyncAt, c.note]),
      );
    case "obligations":
      return toCsv(
        ["framework", "title", "due_date", "status", "progress_pct", "owner", "agent", "detail"],
        data.obligations.map((o) => [o.framework, o.title, o.dueDate, o.status, o.progressPct, o.ownerName, o.agentKey, o.detail]),
      );
    case "audit":
      return toCsv(
        ["time", "actor_type", "actor", "verb", "object", "detail"],
        data.events.map((e) => [e.createdAt, e.actorType, e.actorName, e.verb, e.object, e.detail]),
      );
  }
}

export function downloadSectionCsv(data: ConsoleOverviewData, section: ExportSection) {
  // BOM so Excel opens Greek text correctly.
  const blob = new Blob(["\uFEFF", buildSectionCsv(data, section)], { type: "text/csv;charset=utf-8" });
  const slug = (data.workspace.name || "workspace").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vuneli-${slug || "workspace"}-${section}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
