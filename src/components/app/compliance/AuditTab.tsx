"use client";

import { useLocale, useTranslations } from "next-intl";
import { Section, DataTable, Empty } from "@/components/app/console/kit";
import type { DataTableColumn as Column } from "@/components/app/console/kit";
import type { AuditLog } from "./types";

export function AuditTab({ logs }: { logs: AuditLog[] }) {
  const t = useTranslations("dashboard.compliance");
  const loc = useLocale() === "el" ? "el-CY" : "en-GB";

  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      header: t("audit.event"),
      render: (log) => (
        <div>
          <p className="font-medium break-words">{log.action}</p>
          {log.details && <p className="vck-meta break-words">{log.details}</p>}
          <p className="vck-meta">{t("audit.by", { user: log.createdBy })}</p>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: t("columns.when"),
      numeric: true,
      render: (log) => {
        const d = new Date(log.createdAt);
        return `${d.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })}`;
      },
    },
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
            body={t("empty.noActivityBody")}
          />
        }
      />
    </Section>
  );
}
