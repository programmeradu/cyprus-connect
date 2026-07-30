"use client";

/**
 * Deliverables.
 *
 * Every document an agent drafted for this workspace, newest first. The list
 * is the proof that an approval produced something a person can open.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/console/reports", {
        headers: { Accept: "application/json", ...authHeaders() },
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/auth";
        return;
      }
      const text = await res.text();
      if (!res.ok) throw new Error(text.slice(0, 160) || String(res.status));
      const body = JSON.parse(text) as { reports: ReportRow[] };
      setRows(body.reports ?? []);
    } catch {
      setRows([]);
      setError("The console could not read your deliverables. Try again in a moment.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      onRetry={() => void load()}
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
