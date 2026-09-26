"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";

const PATH = "/api/grant-alerts/subscribe";
import { PageShell, PageHeader, Section, DataTable, Empty, DataTableColumn as Column } from "@/components/app/console/kit";

interface Match {
  id: number;
  source: string;
  title: string;
  url: string;
  program: string | null;
  deadline: string | null;
  score: number;
  first_seen_at: string;
  notified_at: string | null;
}

const SOURCE_KEYS = ["eu-funding-tenders", "research-gov-cy", "invest-cyprus", "kebe-oeb", "accelerators"] as const;

export default function GrantAlertsPage() {
  const t = useTranslations("dashboard.grantAlerts");
  const sourceLabel = (s: string) => ((SOURCE_KEYS as readonly string[]).includes(s) ? t(`sources.${s}`) : s);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const feed = useWorkspaceResource<{ matches?: Match[] }>(PATH);
  const action = useWorkspaceAction();
  const matches = feed.data?.matches ?? [];

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const j = await action.run<{ subscribed: string }>(PATH, { method: "POST", body: { email }, invalidates: [PATH] });
    if (j) setStatus(t("subscribed", { email: j.subscribed }));
  }

  async function unsubscribe() {
    if (!email) {
      setStatus(t("enterEmail"));
      return;
    }
    setStatus(null);
    const j = await action.run<{ unsubscribed: string }>(`${PATH}?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
      invalidates: [PATH],
    });
    if (j) setStatus(t("unsubscribed", { email: j.unsubscribed }));
  }

  const columns: Column<Match>[] = [
    {
      key: "title",
      header: t("columns.call"),
      render: (m) => (
        <div className="min-w-0">
          <a href={m.url} target="_blank" rel="noreferrer" className="font-medium hover:underline break-words">
            {m.title}
          </a>
          <p className="vck-meta mt-0.5">
            {sourceLabel(m.source)}
            {m.program ? ` · ${m.program}` : ""}
          </p>
        </div>
      )
    },
    {
      key: "deadline",
      header: t("columns.deadline"),
      hideOnMobile: true,
      render: (m) => <span>{m.deadline ?? "—"}</span>
    },
    {
      key: "seen",
      header: t("columns.firstSeen"),
      render: (m) => <span className="vck-num">{new Date(m.first_seen_at).toLocaleDateString()}</span>
    },
    {
      key: "score",
      header: t("columns.score"),
      numeric: true,
      render: (m) => <span>{m.score.toFixed(2)}</span>
    }
  ];

  return (
    <PageShell
      loading={feed.loading}
      error={feed.error}
      onRetry={feed.reload}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("purpose")}
        />
      }
    >
      <Section title={t("subscribe")}>
        <form onSubmit={subscribe} className="vck-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourcompany.cy"
            aria-label={t("emailLabel")}
            className="h-11 flex-1 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" disabled={action.busy} className="vck-btn vck-btn-primary">{t("subscribe")}</button>
          <button type="button" disabled={action.busy} onClick={unsubscribe} className="vck-btn">{t("unsubscribe")}</button>
        </form>
        {(status || action.error) && (
          <p className="vck-meta mt-3 break-words" role="status">{action.error ?? status}</p>
        )}
      </Section>

      <Section title={t("recent")}>
        <DataTable
          columns={columns}
          rows={matches}
          rowKey={(m) => String(m.id)}
          empty={
            <Empty
              title={t("emptyTitle")}
              body={t("emptyBody")}
            />
          }
        />
      </Section>
    </PageShell>
  );
}
