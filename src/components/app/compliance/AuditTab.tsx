"use client";

import { useTranslations } from "next-intl";
import { Section, DataTable, Empty } from "@/components/app/console/kit";
import type { DataTableColumn as Column } from "@/components/app/console/kit";
import type { AuditLog } from "./types";

export function AuditTab({ logs }: { logs: AuditLog[] }) {
  const t = useTranslations("dashboard.compliance");
  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      header: t("audit.activityLog"),
      render: (log) => (
        <div>
          <p className="font-medium break-words">{log.action}</p>
          <p className="vck-meta break-words">{log.details}</p>
          <p className="vck-meta">{t("audit.by", { user: log.createdBy })}</p>
        </div>
      )
    },
    {
      key: "createdAt",
      header: "",
      numeric: true,
      render: (log) => new Date(log.createdAt).toLocaleString()
    }
  ];

  return (
    <Section title={t("audit.activityLog")}>
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(l) => String(l.id)}
        empty={
          <Empty
            title={t("audit.noActivity")}
            body="Actions you take on this page, like generating reports or changing settings, will be recorded here."
          />
        }
      />
    </Section>
  );
}
