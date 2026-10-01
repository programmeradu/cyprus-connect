/**
 * Board Summary PDF: the Home page on paper, for a director who has two
 * minutes. Reads only ConsoleOverviewData, so it never shows a figure the
 * app does not.
 */

import React from "react";
import { View, Text } from "@react-pdf/renderer";
import type { ConsoleOverviewData } from "@/components/app/console/types";
import { BarChart, Callout, Cover, DataTable, FingerprintBlock, InnerPage, KpiRow, Para, PdfDocument, Section, type CellValue } from "./kit/components";
import { C, fmt, fmtSmart, longDate, registerPdfFonts } from "./kit/theme";
import { fingerprint } from "./kit/fingerprint";
import { assetBase, savePdf } from "./kit/save";

const STATUS: Record<string, { text: string; tone?: "warn" | "good" | "quiet" }> = {
  on_track: { text: "On track", tone: "good" },
  at_risk: { text: "At risk", tone: "warn" },
  planned: { text: "Planned", tone: "quiet" },
  done: { text: "Done", tone: "good" },
};

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

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

export function BoardSummaryDocument({ c, hash, base, generatedAt }: { c: Content; hash: string; base: string; generatedAt: Date }) {
  const title = "Board summary";
  const fp = c.footprint;
  const changeTone = fp?.changePct == null ? "default" : (fp.changePct < 0) === (fp.goodDirection === "down") ? "good" : "warn";
  return (
    <PdfDocument title={`${c.company} — ${title}`} subject="Sustainability board summary" hash={hash}>
      <Cover
        image={`${base}/pdf-art/board-cover.jpg`}
        wordmark={`${base}/pdf-art/wordmark.png`}
        eyebrow={`Board summary · ${longDate(generatedAt)}`}
        title={c.company}
        subtitle="Where the company stands on emissions, deadlines and the decisions waiting for the board."
        meta={[
          { label: "Sector", value: c.sector || "Not set" },
          { label: "Country", value: c.country || "Not set" },
          { label: "Footprint, last 12 months", value: fp ? `${fmtSmart(fp.yearTotal)} ${fp.unit}` : "No readings yet" },
          { label: "Decisions waiting", value: String(c.decisionsTotal) },
        ]}
        hash={hash}
        caption="Photograph: Nicosia rooftops. Generated illustration."
        contents={["At a glance", "Footprint", "Deadlines", "Decisions waiting", "Recent activity", "About this document"]}
      />

      <InnerPage docTitle={title} company={c.company} hash={hash}>
        <Section n="01" title="At a glance" lede="Four figures, each from the company's own records.">
          <KpiRow
            items={[
              { label: "Footprint, 12 months", value: fp ? fmtSmart(fp.yearTotal) : "—", unit: fp?.unit, note: fp ? `${fp.months.length} monthly readings` : "No readings yet" },
              {
                label: fp?.latest ? `Latest month · ${fp.latest.label}` : "Latest month",
                value: fp?.latest ? fmtSmart(fp.latest.value) : "—",
                unit: fp?.unit,
                note: fp?.changePct == null ? "No earlier month to compare" : `${fp.changePct > 0 ? "+" : ""}${fmt(fp.changePct, 1)}% on the month before`,
                tone: changeTone,
              },
              { label: "Data health", value: c.coveragePct == null ? "—" : `${c.coveragePct}%`, note: "Figures backed by primary records", tone: c.coveragePct != null && c.coveragePct < 60 ? "warn" : "default" },
              { label: "Decisions waiting", value: String(c.decisionsTotal), note: `${c.activeAgents} agent(s) working`, tone: c.decisionsTotal > 0 ? "warn" : "good" },
            ]}
          />
        </Section>

        <Section n="02" title="Footprint" lede={fp ? "Monthly emissions. The darker bar is the latest month." : null}>
          {fp ? (
            <>
              <BarChart points={fp.months} unit={fp.unit} />
              <Para style={{ marginTop: 8, fontSize: 8, color: C.quiet }}>
                Sources: {[...new Set(fp.months.map((m) => m.source))].slice(0, 4).join(" · ")}
              </Para>
            </>
          ) : (
            <Callout title="No footprint readings yet">Upload an electricity bill or connect the bank account on the Connect page, and the footprint appears here.</Callout>
          )}
        </Section>

        <Section n="03" title="Deadlines" lede="Open obligations, soonest first.">
          <DataTable
            columns={[
              { label: "Framework", w: 1.1 },
              { label: "Obligation", w: 3 },
              { label: "Due", w: 1.1 },
              { label: "Status", w: 0.9 },
              { label: "Prepared", w: 0.8, align: "right" },
            ]}
            rows={c.deadlines.map((d): CellValue[] => [d.framework, d.title, shortDate(d.dueDate), STATUS[d.status] ?? d.status, `${d.progressPct}%`])}
            empty="No open deadlines."
          />
        </Section>

        <Section n="04" title="Decisions waiting for a person" lede={c.decisionsTotal > c.decisions.length ? `Showing ${c.decisions.length} of ${c.decisionsTotal}.` : null}>
          <DataTable
            columns={[
              { label: "Decision", w: 4 },
              { label: "Type", w: 1 },
              { label: "Priority", w: 0.9 },
              { label: "Due", w: 1.1 },
            ]}
            rows={c.decisions.map((d): CellValue[] => [
              d.title,
              d.kind.charAt(0).toUpperCase() + d.kind.slice(1),
              d.severity === "high" ? { text: "High", tone: "warn", strong: true } : d.severity === "low" ? { text: "Low", tone: "quiet" } : "Normal",
              shortDate(d.dueAt),
            ])}
            empty="Nothing is waiting. Every proposed action has been approved or declined."
          />
        </Section>

        <Section n="05" title="Recent activity" lede="What people and agents changed most recently.">
          <DataTable
            columns={[
              { label: "When", w: 1 },
              { label: "Who", w: 1.4 },
              { label: "What", w: 4 },
            ]}
            rows={c.activity.map((a): CellValue[] => [shortDate(a.when), { text: a.who, tone: a.actorType === "agent" ? "good" : undefined }, a.what])}
            empty="No activity recorded yet."
          />
        </Section>

        <View>
          <FingerprintBlock hash={hash} generatedAt={generatedAt} sources={["Readings and documents stored in the Vuneli workspace", "Deadlines from the workspace obligation list", "Approval queue and activity log"]} />
        </View>
      </InnerPage>
    </PdfDocument>
  );
}

export async function buildBoardSummary(data: ConsoleOverviewData, base: string, generatedAt = new Date()) {
  registerPdfFonts(base);
  const c = boardSummaryContent(data);
  const hash = await fingerprint({ kind: "board-summary", c });
  return { element: <BoardSummaryDocument c={c} hash={hash} base={base} generatedAt={generatedAt} />, hash };
}

export async function downloadBoardSummary(data: ConsoleOverviewData, fileName: string) {
  const { element } = await buildBoardSummary(data, assetBase());
  await savePdf(element, fileName);
}
