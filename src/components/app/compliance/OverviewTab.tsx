"use client";

import { useTranslations } from "next-intl";
import { Section, Metric, MetricRow, Empty } from "@/components/app/console/kit";
import { daysUntil, type ComplianceDocument, type Regulation } from "./types";

export function OverviewTab({
  complianceScore,
  regulations,
  documents
}: {
  complianceScore: number | null;
  regulations: Regulation[];
  documents: ComplianceDocument[];
}) {
  const t = useTranslations("dashboard.compliance");
  const urgentItems = regulations.filter((r) => r.status === "action_required").length;
  const upcomingDeadlines = regulations.filter((r) => {
    const daysUntil = Math.floor((new Date(r.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil > 0;
  }).length;

  const complianceBreakdown = regulations.map((reg) => {
    const statusMap: Record<string, { status: string; value: number }> = {
      compliant: { status: t("status.compliantLabel"), value: 95 },
      action_required: { status: t("status.actionRequiredLabel"), value: 60 },
      upcoming: { status: t("status.preparation"), value: 75 }
    };
    const mapped = statusMap[reg.status] || { status: t("status.inProgress"), value: 70 };
    return { label: reg.name, value: mapped.value, status: mapped.status };
  });

  const recentUpdates = regulations
    .slice()
    .sort((a, b) => new Date(b.nextDeadline).getTime() - new Date(a.nextDeadline).getTime())
    .slice(0, 3)
    .map((reg) => ({
      date: new Date(reg.nextDeadline).toISOString().split("T")[0],
      title: `${reg.name} - ${t("overview.nextDeadlinePrefix")} ${new Date(reg.nextDeadline).toLocaleDateString()}`,
      type: reg.status === "action_required" ? "important" : reg.status === "compliant" ? "info" : "update"
    }));

  return (
    <>
      <Section title={t("overview.healthBreakdown")}>
        <MetricRow columns={3}>
          <Metric label={t("overview.actionRequired")} value={urgentItems} note={t("overview.regulationsNeedAttention")} />
          <Metric label={t("overview.next30Days")} value={upcomingDeadlines} note={t("overview.upcomingDeadlines")} />
          <Metric label={t("overview.generated")} value={documents.length} note={t("overview.complianceDocuments")} />
        </MetricRow>
      </Section>

      <Section title={t("overview.healthBreakdown")}>
        {complianceBreakdown.length > 0 ? (
          <div className="vck-ledgerbox">
            {complianceBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium break-words">{item.label}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="vck-meta">{item.status}</span>
                  <span className="vck-num text-sm font-semibold">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="No regulations tracked yet"
            body="Once regulations are initialised for your account, their compliance health will appear here."
          />
        )}
      </Section>

      <Section title={t("overview.recentUpdates")}>
        {recentUpdates.length > 0 ? (
          <div className="vck-ledgerbox">
            {recentUpdates.map((item, index) => (
              <div key={index} className="flex items-start justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium break-words">{item.title}</span>
                <span className="vck-meta shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="No recent regulatory activity"
            body="Updates to your tracked regulations will show up here as they happen."
          />
        )}
      </Section>
    </>
  );
}
