/**
 * Board Summary PDF: the Home page on paper, for a director who has two
 * minutes. Reads only ConsoleOverviewData, so it never shows a figure the
 * app does not. Layout: public/pdf-typst/board.typ.
 */

import type { ConsoleOverviewData } from "@/components/app/console/types";
import { fingerprint } from "./kit/fingerprint";
import { docId, fmt, fmtSmart, longDate, shortDate, unitText } from "./format";

export function boardSummaryContent(data: ConsoleOverviewData) {
  const footprint = data.metrics.find((m) => m.key === "co2e_total" && m.points.length > 0) ?? null;
  const coverage = data.metrics.find((m) => m.key === "data_coverage" && m.points.length > 0) ?? null;
  const last12 = footprint ? footprint.points.slice(-12) : [];
  const yearTotal = last12.reduce((a, p) => a + p.value, 0);
  const latest = last12[last12.length - 1] ?? null;
  const prev = last12[last12.length - 2] ?? null;
  return {
    company: data.workspace.legalName || data.workspace.name || "Workspace",
    sector: data.workspace.sector,
    country: data.workspace.country,
    footprint: footprint
      ? {
          unit: footprint.unit,
          months: last12.map((p) => ({ label: p.label, value: p.value, source: p.source })),
          yearTotal,
          latest: latest ? { label: latest.label, value: latest.value } : null,
          changePct: latest && prev && prev.value !== 0 ? ((latest.value - prev.value) / prev.value) * 100 : null,
          goodDirection: footprint.goodDirection,
        }
      : null,
    coveragePct: coverage ? Math.round(coverage.current) : null,
    deadlines: data.obligations
      .filter((o) => o.status !== "done")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 8)
      .map((o) => ({ framework: o.framework, title: o.title, dueDate: o.dueDate, status: o.status, progressPct: Math.round(o.progressPct) })),
    decisions: data.tasks.slice(0, 10).map((t) => ({ title: t.title, kind: t.kind, severity: t.severity, dueAt: t.dueAt })),
    decisionsTotal: data.tasks.length,
    activity: data.events.slice(0, 10).map((e) => ({ when: e.createdAt, who: e.actorName, actorType: e.actorType, what: `${e.verb} ${e.object}` })),
    activeAgents: data.agents.filter((a) => a.status === "active").length,
  };
}

type Content = ReturnType<typeof boardSummaryContent>;

/** The exact JSON the template prints. */
export function boardSummaryData(c: Content, hash: string, generatedAt: Date) {
  const fp = c.footprint;
  const unit = unitText(fp?.unit);
  const changeGood = fp?.changePct == null ? null : (fp.changePct < 0) === (fp.goodDirection === "down");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    lang: "en",
    hash,
    docId: docId("BS", hash, generatedAt),
    issued: longDate(generatedAt),
    company: c.company,
    sector: c.sector || "Not set",
    country: c.country || "Not set",
    decisionsTotal: c.decisionsTotal,
    cover: { footprint: fp ? `${fmtSmart(fp.yearTotal)} ${unit}` : "No readings yet" },
    kpis: [
      { label: "Footprint, 12 months", value: fp ? fmtSmart(fp.yearTotal) : "—", unit: fp ? unit : "", note: fp ? `${fp.months.length} monthly readings` : "No readings yet", tone: "" },
      {
        label: fp?.latest ? `Latest month · ${fp.latest.label}` : "Latest month",
        value: fp?.latest ? fmtSmart(fp.latest.value) : "—",
        unit: fp?.latest ? unit : "",
        note: fp?.changePct == null ? "No earlier month to compare" : `${fp.changePct > 0 ? "+" : "−"}${fmt(Math.abs(fp.changePct), 1)}% on the month before`,
        tone: changeGood == null ? "" : changeGood ? "good" : "warn",
      },
      { label: "Data health", value: c.coveragePct == null ? "—" : `${c.coveragePct}%`, unit: "", note: "Figures backed by primary records", tone: c.coveragePct != null && c.coveragePct < 60 ? "warn" : "" },
      { label: "Decisions waiting", value: String(c.decisionsTotal), unit: "", note: `${c.activeAgents} agent${c.activeAgents === 1 ? "" : "s"} working`, tone: c.decisionsTotal > 0 ? "warn" : "good" },
    ],
    unit,
    months: fp ? fp.months.map((m) => ({ label: m.label, value: m.value })) : [],
    sources: [
      ...new Set([...(fp ? fp.months.map((m) => m.source).filter(Boolean) : []), "Workspace obligation list", "Approval queue and activity log"]),
    ].slice(0, 6),
    deadlines: c.deadlines.map((d) => ({ framework: d.framework, title: d.title, due: shortDate(d.dueDate), status: d.status, progress: d.progressPct })),
    decisions: c.decisions.map((d) => ({
      title: d.title,
      kind: cap(d.kind),
      severity: d.severity === "high" ? "high" : d.severity === "low" ? "Low" : "Normal",
      due: shortDate(d.dueAt),
    })),
    activity: c.activity.map((a) => ({ when: shortDate(a.when), who: a.who, agent: a.actorType === "agent", what: a.what })),
  };
}

export async function buildBoardSummaryData(data: ConsoleOverviewData, generatedAt = new Date()) {
  const c = boardSummaryContent(data);
  const hash = await fingerprint({ kind: "board-summary", c });
  return boardSummaryData(c, hash, generatedAt);
}

export async function downloadBoardSummary(data: ConsoleOverviewData, fileName: string) {
  const { renderTypst, downloadBytes, siteBase } = await import("./typst-render");
  const json = await buildBoardSummaryData(data);
  const bytes = await renderTypst("board.typ", json, { base: siteBase() });
  downloadBytes(bytes, fileName);
}
