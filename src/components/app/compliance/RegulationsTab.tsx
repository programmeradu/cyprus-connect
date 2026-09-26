"use client";

import { useTranslations } from "next-intl";
import { Section, DataTable, Empty } from "@/components/app/console/kit";
import type { DataTableColumn as Column } from "@/components/app/console/kit";
import { daysUntil, type Regulation } from "./types";

export function RegulationsTab({ regulations }: { regulations: Regulation[] }) {
  const t = useTranslations("dashboard.compliance");
  const statusLabel = (s: string) =>
    s === "compliant"
      ? t("status.compliant")
      : s === "action_required"
        ? t("status.actionRequired")
        : s === "upcoming"
          ? t("status.upcoming")
          : s.replace("_", " ");

  const statusTone = (s: string) => (s === "compliant" ? "positive" : s === "action_required" ? "critical" : "caution");

  const columns: Column<Regulation>[] = [
    {
      key: "name",
      header: t("tabs.regulations"),
      render: (reg) => (
        <div>
          <p className="font-medium break-words">{reg.name}</p>
          <p className="vck-meta break-words">{reg.jurisdiction}</p>
        </div>
      )
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (reg) => (
        <span className="vck-tag" data-tone={statusTone(reg.status)}>
          {statusLabel(reg.status)}
        </span>
      )
    },
    {
      key: "deadline",
      header: t("regulations.nextDeadline"),
      hideOnMobile: true,
      render: (reg) => {
        const days = daysUntil(reg.nextDeadline);
        return (
          <div>
            <p>{new Date(reg.nextDeadline).toLocaleDateString()}</p>
            <p className="vck-meta">
              {days > 0 ? t("regulations.daysRemaining", { days }) : t("regulations.overdue")}
            </p>
          </div>
        );
      }
    }
  ];

  return (
    <Section title={t("tabs.regulations")}>
      <DataTable
        columns={columns}
        rows={regulations}
        rowKey={(r) => String(r.id)}
        empty={
          <Empty
            title={t("empty.noRegulationsTitle")}
            body={t("empty.noRegulationsBody")}
          />
        }
      />
    </Section>
  );
}
