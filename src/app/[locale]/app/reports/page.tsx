"use client";

/**
 * Deliverables.
 *
 * Every document an agent drafted for this workspace, newest first. The list
 * is the proof that an approval produced something a person can open.
 */

import Link from "next/link";
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

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const { data, error, reload } = useWorkspaceResource<{ reports: ReportRow[] }>("/api/console/reports");
  const rows = data ? data.reports ?? [] : error ? [] : null;

  const columns: Column<ReportRow>[] = [
    {
      key: "title",
      header: "Document",
      render: (row) => (
        <span className="vck-cell-stack">
          <Link href={`/app/reports/${row.id}` as never} className="vck-link">
            {row.title}
          </Link>
          <small>{row.summary ?? "No summary recorded."}</small>
        </span>
      ),
    },
    { key: "framework", header: "Framework", width: "120px", render: (row) => row.framework },
    { key: "period", header: "Period", width: "110px", render: (row) => row.periodLabel },
    {
      key: "author",
      header: "Drafted by",
      width: "160px",
      render: (row) => row.agentName ?? "Reporting agent",
    },
    {
      key: "status",
      header: "Status",
      width: "130px",
      render: (row) => (
        <State tone={TONE[row.status] ?? "idle"}>{row.status.replace("_", " ")}</State>
      ),
    },
    {
      key: "created",
      header: "Created",
      width: "130px",
      render: (row) => formatDay(row.createdAt),
    },
  ];

  return (
    <ConsolePage
      title="Deliverables"
      purpose="Every report an agent drafted for this workspace. Open one to review it, then export it."
      loading={rows === null}
      error={error}
      onRetry={reload}
    >
      <Plate label="Reports" meta={rows ? `${rows.length}` : undefined} flush>
        {rows && rows.length === 0 ? (
          <div style={{ padding: "18px 20px" }}>
            <Empty
              title="No deliverable yet"
              body="Ask the copilot for a report, for example 'draft the VSME report for 2026'. When you approve the proposal, the agent writes the draft and it appears here."
            />
          </div>
        ) : (
          <ConsoleTable columns={columns} rows={rows ?? []} rowKey={(row) => row.id} />
        )}
      </Plate>
    </ConsolePage>
  );
}
