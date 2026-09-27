"use client";

/**
 * Deliverables.
 *
 * Every document an agent drafted for this workspace, newest first. The list
 * is the proof that an approval produced something a person can open.
 */

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import { ConsolePage, Plate, ConsoleTable, State, Empty } from "@/components/app/console/kit";
import type { Column } from "@/components/app/console/kit";

interface ReportRow {
  id: string;
  framework: string;
  title: string;
  periodLabel: string;
  status: string;
  agentName: string | null;
  summary: string | null;
  createdAt: string;
}

const TONE: Record<string, "good" | "warn" | "idle"> = {
  final: "good",
  in_review: "warn",
  draft: "idle",
};

function formatDay(value: string, loc: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const t = useTranslations("dashboard.reports");
  const loc = useLocale() === "el" ? "el-CY" : "en-GB";
  const statusText = (s: string) => (s in TONE ? t(`status.${s}` as "status.draft") : s.replace("_", " "));
  const { data, error, reload } = useWorkspaceResource<{ reports: ReportRow[] }>("/api/console/reports");
  const rows = data ? data.reports ?? [] : error ? [] : null;

  const columns: Column<ReportRow>[] = [
    {
      key: "title",
      header: t("col.document"),
      render: (row) => (
        <span className="vck-cell-stack">
          <Link href={`/app/reports/${row.id}` as never} className="vck-link">
            {row.title}
          </Link>
          <small>{row.summary ?? t("noSummaryRow")}</small>
        </span>
      ),
    },
    { key: "framework", header: t("col.framework"), width: "120px", render: (row) => row.framework },
    { key: "period", header: t("col.period"), width: "110px", render: (row) => row.periodLabel },
    {
      key: "author",
      header: t("col.author"),
      width: "160px",
      render: (row) => row.agentName ?? t("agent"),
    },
    {
      key: "status",
      header: t("col.status"),
      width: "130px",
      render: (row) => (
        <State tone={TONE[row.status] ?? "idle"}>{statusText(row.status)}</State>
      ),
    },
    {
      key: "created",
      header: t("col.created"),
      width: "130px",
      render: (row) => formatDay(row.createdAt, loc),
    },
  ];

  return (
    <ConsolePage
      title={t("title")}
      purpose={t("purpose")}
      loading={rows === null}
      error={error}
      onRetry={reload}
    >
      <Plate label={t("reports")} meta={rows ? `${rows.length}` : undefined} flush>
        {rows && rows.length === 0 ? (
          <div style={{ padding: "18px 20px" }}>
            <Empty
              title={t("emptyTitle")}
              body={t("emptyBody")}
            />
          </div>
        ) : (
          <ConsoleTable columns={columns} rows={rows ?? []} rowKey={(row) => row.id} />
        )}
      </Plate>
    </ConsolePage>
  );
}
