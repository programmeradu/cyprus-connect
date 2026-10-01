/**
 * Drafted report PDF (VSME, CSRD and similar). Reads exactly what the report
 * page shows, so an auditor can compare paper and screen line by line.
 */

import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { Callout, Cover, DataTable, FingerprintBlock, InnerPage, Para, PdfDocument, Section } from "./kit/components";
import { C, longDate, registerPdfFonts, SANS } from "./kit/theme";
import { fingerprint } from "./kit/fingerprint";
import { assetBase, savePdf } from "./kit/save";

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

export function ReportDocument({ r, hash, base, generatedAt }: { r: PdfReport; hash: string; base: string; generatedAt: Date }) {
  const gaps = r.sections.reduce((n, s) => n + s.gaps.length, 0);
  const figures = r.sections.reduce((n, s) => n + s.figures.length, 0);
  const draft = r.status !== "approved" && r.status !== "published";
  return (
    <PdfDocument title={`${r.workspaceName} — ${r.title}`} subject={`${r.framework} report, ${r.periodLabel}`} hash={hash}>
      <Cover
        image={`${base}/pdf-art/report-cover.jpg`}
        wordmark={`${base}/pdf-art/wordmark.png`}
        eyebrow={`${r.framework} · ${r.periodLabel}`}
        title={r.title}
        subtitle={r.workspaceName}
        meta={[
          { label: "Framework", value: r.framework },
          { label: "Reporting period", value: r.periodLabel },
          { label: "Status", value: statusWord(r.status) },
          { label: "Sections · figures · open gaps", value: `${r.sections.length} · ${figures} · ${gaps}` },
        ]}
        hash={hash}
        caption="Photograph: Cyprus hills. Generated illustration."
        contents={r.sections.slice(0, 9).map((s) => s.title)}
      />

      <InnerPage docTitle={`${r.framework} report · ${r.periodLabel}`} company={r.workspaceName} hash={hash}>
        {draft ? (
          <Callout tone="warn" title="Draft for review">
            {`This report is ${statusWord(r.status).toLowerCase()}. ${gaps ? `${gaps} gap(s) are listed in the sections below and must be closed before it is final.` : "No open gaps are recorded."}`}
          </Callout>
        ) : null}

        {r.summary ? (
          <View style={{ marginTop: 18, marginBottom: 22 }}>
            <Text style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: C.accent }}>Summary</Text>
            {r.summary.split(/\n{2,}/).map((p, i) => (
              <Text key={i} style={{ fontFamily: SANS as unknown as string, fontSize: 11.5, lineHeight: 1.55, color: C.ink, marginTop: 6 }}>
                {p.trim()}
              </Text>
            ))}
          </View>
        ) : null}

        {r.sections.map((s, i) => (
          <Section key={i} n={s.code || String(i + 1).padStart(2, "0")} title={s.title} breakBefore={i > 0 && s.body.length > 2500}>
            {s.body
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, j) => (
                <Para key={j}>{p}</Para>
              ))}
            {s.figures.length ? (
              <View style={{ marginTop: 6 }}>
                <DataTable
                  columns={[
                    { label: "Figure", w: 2.4 },
                    { label: "Value", w: 1.3, align: "right" },
                    { label: "Source", w: 2.6 },
                  ]}
                  rows={s.figures.map((f) => [f.label, { text: f.value, strong: true }, { text: f.source, tone: "quiet" }])}
                />
              </View>
            ) : null}
            {s.gaps.length ? (
              <Callout tone="warn" title={`${s.gaps.length} gap(s) to close`}>
                {s.gaps.map((g, k) => `${k + 1}. ${g}`).join("\n")}
              </Callout>
            ) : null}
          </Section>
        ))}

        <FingerprintBlock
          hash={hash}
          generatedAt={generatedAt}
          sources={[`Drafted${r.agentName ? ` by ${r.agentName}` : ""} in Vuneli from the workspace's stored records`, "Each figure lists its own source in the table where it appears"]}
        />
        <Text style={{ fontSize: 7, color: C.faint, marginTop: 10 }}>Exported {longDate(generatedAt)}.</Text>
      </InnerPage>
    </PdfDocument>
  );
}

export async function buildReport(r: PdfReport, base: string, generatedAt = new Date()) {
  registerPdfFonts(base);
  const hash = await fingerprint({ kind: "report", r });
  return { element: <ReportDocument r={r} hash={hash} base={base} generatedAt={generatedAt} />, hash };
}

export async function downloadReport(r: PdfReport, fileName: string) {
  const { element } = await buildReport(r, assetBase());
  await savePdf(element, fileName);
}
