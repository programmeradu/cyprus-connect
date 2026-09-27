"use client";

/**
 * One deliverable.
 *
 * A drafted report reads as a document, not as a data table: a measured
 * column, numbered disclosures, figures with their source named, and every
 * gap stated in the open. A person moves it to review, then to final.
 */

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { ConsolePage, Plate, Btn, State } from "@/components/app/console/kit";

interface Figure {
  label: string;
  value: string;
  source: string;
}

interface Section {
  code: string;
  title: string;
  body: string;
  figures: Figure[];
  gaps: string[];
}

interface Report {
  id: string;
  framework: string;
  title: string;
  periodLabel: string;
  status: string;
  agentName: string | null;
  summary: string | null;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

const TONE: Record<string, "good" | "warn" | "idle"> = {
  final: "good",
  in_review: "warn",
  draft: "idle",
};

export default function ReportPage() {
  const t = useTranslations("dashboard.reports");
  const english = useLocale() !== "el";
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const path = id ? `/api/console/reports/${id}` : null;
  const resource = useWorkspaceResource<{ report: Report; workspace: { name: string } }>(path);
  const action = useWorkspaceAction();
  const [exporting, setExporting] = useState(false);
  const report = resource.data?.report ?? null;
  const workspaceName = resource.data?.workspace?.name ?? t("d.thisWorkspace");
  const error = resource.error ?? action.error;
  const busy = action.busy || exporting;
  const load = resource.reload;

  // Moving a report changes the list, the dashboard and the activity feed.
  const setStatus = async (status: string) => {
    if (!path) return;
    await action.run(path, { method: "PATCH", body: { status }, invalidates: ["/api/console/reports"] });
  };

  const exportPdf = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const { buildReportPdf } = await import("@/lib/pdf/report-document");
      const doc = buildReportPdf({
        title: report.title,
        framework: report.framework,
        periodLabel: report.periodLabel,
        status: report.status,
        workspaceName,
        agentName: report.agentName,
        summary: report.summary,
        sections: report.sections,
      });
      doc.save(`${report.framework}-report-${report.periodLabel}.pdf`.replace(/\s+/g, "-"));
    } finally {
      setExporting(false);
    }
  };

  const gapCount = (report?.sections ?? []).reduce(
    (total, section) => total + section.gaps.length,
    0,
  );

  return (
    <ConsolePage
      title={report?.title ?? t("d.report")}
      purpose={
        report
          ? t("d.purpose", { framework: report.framework, workspace: workspaceName, period: report.periodLabel, agent: report.agentName ?? t("d.theAgent") })
          : t("d.reading")
      }
      loading={!report && !error}
      error={error}
      onRetry={() => void load()}
      actions={
        report ? (
          <div className="vck-actions">
            <Link href={"/app/reports" as never} className="vck-link">
              {t("d.all")}
            </Link>
            {report.status !== "in_review" && report.status !== "final" && (
              <Btn disabled={busy} onClick={() => void setStatus("in_review")}>
                {t("d.toReview")}
              </Btn>
            )}
            {report.status === "in_review" && (
              <Btn disabled={busy} onClick={() => void setStatus("final")}>
                {t("d.final")}
              </Btn>
            )}
            <Btn variant="primary" disabled={busy} onClick={() => void exportPdf()}>
              {t("d.pdf")}
            </Btn>
          </div>
        ) : null
      }
    >
      {report && (
        <>
          <Plate
            label={t("d.summary")}
            action={<State tone={TONE[report.status] ?? "idle"}>{report.status in TONE ? t(`status.${report.status}` as "status.draft") : report.status.replace("_", " ")}</State>}
            foot={
              gapCount > 0
                ? t("d.gaps", { count: gapCount })
                : t("d.noGaps")
            }
          >
            <p className="vcr-lede">{report.summary ?? t("d.noSummary")}</p>
            {!english && <p className="vck-quiet">{t("d.contentNote")}</p>}
          </Plate>

          <Plate label={t("d.disclosures", { framework: report.framework })}>
            <article className="vcr-doc">
              {report.sections.map((section) => (
                <section key={section.code} className="vcr-sec">
                  <header>
                    <span className="vcr-code">{section.code}</span>
                    <h3>{section.title}</h3>
                  </header>
                  <p>{section.body}</p>

                  {section.figures.length > 0 && (
                    <dl className="vcr-figs">
                      {section.figures.map((figure, index) => (
                        <div key={`${section.code}-f${index}`}>
                          <dt>{figure.label}</dt>
                          <dd>
                            <strong>{figure.value}</strong>
                            {figure.source && <small>{figure.source}</small>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {section.gaps.length > 0 && (
                    <div className="vcr-gaps">
                      <span>{t("d.dataGaps")}</span>
                      <ul>
                        {section.gaps.map((gap, index) => (
                          <li key={`${section.code}-g${index}`}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
            </article>
          </Plate>
        </>
      )}
    </ConsolePage>
  );
}
