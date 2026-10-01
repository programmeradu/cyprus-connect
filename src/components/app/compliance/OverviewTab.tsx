"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Section, Metric, MetricRow, Empty } from "@/components/app/console/kit";
import { FRAMEWORKS } from "@/lib/compliance/frameworks";
import { daysUntil, type ComplianceDocument, type Regulation } from "./types";

/**
 * The Report home: one list of every deadline, soonest first, with how far
 * along it is and the next step in the same row. Status only, never a score.
 */
export function OverviewTab({
  regulations,
  documents,
  onGenerate,
  generating,
  onOpenDocuments,
}: {
  regulations: Regulation[];
  documents: ComplianceDocument[];
  onGenerate: (framework: string) => void;
  generating: boolean;
  onOpenDocuments: () => void;
}) {
  const t = useTranslations("dashboard.compliance");
  const loc = useLocale() === "el" ? "el-CY" : "en-GB";
  const urgentItems = regulations.filter((r) => r.status === "action_required").length;
  const upcomingDeadlines = regulations.filter((r) => {
    const d = daysUntil(r.nextDeadline);
    return d <= 30 && d >= 0;
  }).length;

  const statusLabel = (s: Regulation["status"]) =>
    s === "compliant" ? t("status.compliantLabel") : s === "action_required" ? t("status.actionRequiredLabel") : t("status.preparation");
  const statusTone = (s: Regulation["status"]) => (s === "compliant" ? "positive" : s === "action_required" ? "critical" : "caution");

  const rows = [...regulations].sort((a, b) => {
    const ta = new Date(a.nextDeadline).getTime();
    const tb = new Date(b.nextDeadline).getTime();
    return (Number.isNaN(ta) ? Infinity : ta) - (Number.isNaN(tb) ? Infinity : tb);
  });

  return (
    <>
      <Section title={t("overview.summary")}>
        <MetricRow columns={3}>
          <Metric label={t("overview.actionRequired")} value={urgentItems} note={t("overview.regulationsNeedAttention")} />
          <Metric label={t("overview.next30Days")} value={upcomingDeadlines} note={t("overview.upcomingDeadlines")} />
          <Metric label={t("overview.generated")} value={documents.length} note={t("overview.complianceDocuments")} />
        </MetricRow>
      </Section>

      <Section title={t("board.title")} description={t("board.description")}>
        {rows.length > 0 ? (
          <div className="vck-ledgerbox">
            {rows.map((reg) => {
              const def = FRAMEWORKS.find((f) => f.regulationId === reg.regulationId);
              const label = def?.label ?? reg.name;
              const drafts = documents.filter((d) => d.framework.toLowerCase() === label.toLowerCase());
              const date = new Date(reg.nextDeadline);
              const valid = !Number.isNaN(date.getTime());
              const days = valid ? daysUntil(reg.nextDeadline) : null;
              const when = valid
                ? date.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })
                : "—";
              const left =
                days === null ? "" : days < 0 ? t("regulations.overdue") : t("board.daysLeft", { days });
              return (
                <div key={reg.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 py-4">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="text-sm font-medium break-words">{reg.name}</p>
                    <p className="vck-meta mt-1 break-words">
                      {t("overview.nextDeadlinePrefix")}: {when}
                      {left ? ` · ${left}` : ""}
                      {def && !def.legalDeadline ? ` · ${t("board.voluntary")}` : ""}
                    </p>
                    <p className="vck-meta mt-1">
                      {drafts.length === 0 ? t("board.noDraft") : t("board.drafts", { count: drafts.length })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="vck-tag" data-tone={statusTone(reg.status)}>
                      {statusLabel(reg.status)}
                    </span>
                    {reg.regulationId === "cbam" ? (
                      <Link href="/app/cbam" className="vck-btn">
                        {t("board.openCbam")}
                      </Link>
                    ) : (
                      <button type="button" className="vck-btn" disabled={generating} onClick={() => onGenerate(label)}>
                        {generating ? t("documents.generating") : drafts.length ? t("board.redraft") : t("board.draft")}
                      </button>
                    )}
                    {drafts.length > 0 && (
                      <button type="button" className="vck-btn vck-btn-quiet" onClick={onOpenDocuments}>
                        {t("board.openDrafts")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty title={t("empty.noRegulationsTitle")} body={t("empty.noRegulationsBody")} />
        )}
      </Section>
    </>
  );
}
