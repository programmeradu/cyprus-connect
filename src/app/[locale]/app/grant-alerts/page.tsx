"use client";

import { useState } from "react";
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

const SOURCE_LABELS: Record<string, string> = {
  "eu-funding-tenders": "EU Funding & Tenders Portal",
  "research-gov-cy": "Research & Innovation Foundation (Cyprus)",
  "invest-cyprus": "Invest Cyprus",
  "kebe-oeb": "OEB / KEBE",
  "accelerators": "Accelerators",
};

export default function GrantAlertsPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const feed = useWorkspaceResource<{ matches?: Match[] }>(PATH);
  const action = useWorkspaceAction();
  const matches = feed.data?.matches ?? [];

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const j = await action.run<{ subscribed: string }>(PATH, { method: "POST", body: { email }, invalidates: [PATH] });
    if (j) setStatus(`Subscribed ${j.subscribed}. You will receive an email per new match.`);
  }

  async function unsubscribe() {
    if (!email) {
      setStatus("Enter the email address you subscribed with.");
      return;
    }
    setStatus(null);
    const j = await action.run<{ unsubscribed: string }>(`${PATH}?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
      invalidates: [PATH],
    });
    if (j) setStatus(`Unsubscribed ${j.unsubscribed}.`);
  }

  const columns: Column<Match>[] = [
    {
      key: "title",
      header: "Call",
      render: (m) => (
        <div className="min-w-0">
          <a href={m.url} target="_blank" rel="noreferrer" className="font-medium hover:underline break-words">
            {m.title}
          </a>
          <p className="vck-meta mt-0.5">
            {SOURCE_LABELS[m.source] ?? m.source}
            {m.program ? ` · ${m.program}` : ""}
          </p>
        </div>
      )
    },
    {
      key: "deadline",
      header: "Deadline",
      hideOnMobile: true,
      render: (m) => <span>{m.deadline ?? "—"}</span>
    },
    {
      key: "seen",
      header: "First seen",
      render: (m) => <span className="vck-num">{new Date(m.first_seen_at).toLocaleDateString()}</span>
    },
    {
      key: "score",
      header: "Score",
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
          title="EU and Cyprus grant alerts"
          purpose="Get an email the moment a new call from the EU Funding & Tenders Portal, the Cyprus Research and Innovation Foundation, Invest Cyprus, OEB / KEBE, or a climate accelerator matches Vuneli's Cyprus SME sustainability focus."
        />
      }
    >
      <Section title="Subscribe">
        <form onSubmit={subscribe} className="vck-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourcompany.cy"
            className="h-11 flex-1 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" disabled={action.busy} className="vck-btn vck-btn-primary">Subscribe</button>
          <button type="button" disabled={action.busy} onClick={unsubscribe} className="vck-btn">Unsubscribe</button>
        </form>
        {(status || action.error) && (
          <p className="vck-meta mt-3 break-words" role="status">{action.error ?? status}</p>
        )}
      </Section>

      <Section title="Recent matches">
        <DataTable
          columns={columns}
          rows={matches}
          rowKey={(m) => String(m.id)}
          empty={
            <Empty
              title="No matches recorded yet"
              body="The hourly job checks EU and Cyprus funding sources for calls that match Vuneli's SME sustainability focus. New calls will appear here as soon as they're found."
            />
          }
        />
      </Section>
    </PageShell>
  );
}
