"use client";

import { useTranslations } from "next-intl";
import { Section, Metric, MetricRow, Empty } from "@/components/app/console/kit";
import { daysUntil, type ComplianceDocument, type Regulation } from "./types";

/** Status only: we do not score regulations, so no percentages are shown. */
export function OverviewTab({
  regulations,
  documents,
}: {
  regulations: Regulation[];
  documents: ComplianceDocument[];
}) {
  const t = useTranslations("dashboard.compliance");
  const urgentItems = regulations.filter((r) => r.status === "action_required").length;
  const upcomingDeadlines = regulations.filter((r) => {
    const d = daysUntil(r.nextDeadline);
    return d <= 30 && d > 0;
  }).length;

  const statusLabel = (s: Regulation["status"]) =>
    s === "compliant" ? t("status.compliantLabel") : s === "action_required" ? t("status.actionRequiredLabel") : t("status.preparation");
  const statusTone = (s: Regulation["status"]) => (s === "compliant" ? "positive" : s === "action_required" ? "critical" : "caution");

  const nextUp = regulations
    .filter((r) => !Number.isNaN(new Date(r.nextDeadline).getTime()))
    .sort((a, b) => new Date(a.nextDeadline).getTime() - new Date(b.nextDeadline).getTime())
    .slice(0, 3);

  return (
    <>
      <Section title={t("overview.summary")}>
        <MetricRow columns={3}>
          <Metric label={t("overview.actionRequired")} value={urgentItems} note={t("overview.regulationsNeedAttention")} />
          <Metric label={t("overview.next30Days")} value={upcomingDeadlines} note={t("overview.upcomingDeadlines")} />
          <Metric label={t("overview.generated")} value={documents.length} note={t("overview.complianceDocuments")} />
        </MetricRow>
      </Section>

      <Section title={t("overview.healthBreakdown")}>
        {regulations.length > 0 ? (
          <div className="vck-ledgerbox">
            {regulations.map((reg) => (
              <div key={reg.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 text-sm font-medium break-words">{reg.name}</span>
                <span className="vck-tag shrink-0" data-tone={statusTone(reg.status)}>
                  {statusLabel(reg.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty title={t("empty.noRegulationsTitle")} body={t("empty.noRegulationsBody")} />
        )}
      </Section>

      <Section title={t("overview.recentUpdates")}>
        {nextUp.length > 0 ? (
          <div className="vck-ledgerbox">
            {nextUp.map((reg) => (
              <div key={reg.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 text-sm font-medium break-words">{reg.name}</span>
                <span className="vck-meta shrink-0">
                  {t("overview.nextDeadlinePrefix")}: {new Date(reg.nextDeadline).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty title={t("empty.noUpdatesTitle")} body={t("empty.noUpdatesBody")} />
        )}
      </Section>
    </>
  );
}
