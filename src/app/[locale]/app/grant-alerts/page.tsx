"use client";

import { useEffect, useState } from "react";
import { PageShell, PageHeader, Section, DataTable, EmptyState, Column } from "@/components/app/shell";

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
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/grant-alerts/subscribe")
      .then((r) => r.json())
      .then((j) => setMatches(j.matches ?? []))
      .catch(() => setError("Could not load grant matches. Try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const res = await fetch("/api/grant-alerts/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await res.json();
    setStatus(res.ok ? `Subscribed ${j.subscribed}. You will receive an email per new match.` : `Error: ${j.error}`);
  }

  async function unsubscribe() {
    if (!email) return;
    const res = await fetch(`/api/grant-alerts/subscribe?email=${encodeURIComponent(email)}`, { method: "DELETE" });
    const j = await res.json();
    setStatus(res.ok ? `Unsubscribed ${j.unsubscribed}.` : `Error: ${j.error}`);
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
          <p className="app-meta mt-0.5">
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
      render: (m) => <span className="app-num">{new Date(m.first_seen_at).toLocaleDateString()}</span>
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
      loading={loading}
      error={error}
      onRetry={load}
      header={
        <PageHeader
          title="EU and Cyprus grant alerts"
          purpose="Get an email the moment a new call from the EU Funding & Tenders Portal, the Cyprus Research and Innovation Foundation, Invest Cyprus, OEB / KEBE, or a climate accelerator matches Vuneli's Cyprus SME sustainability focus."
        />
      }
    >
      <Section title="Subscribe">
        <form onSubmit={subscribe} className="app-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourcompany.cy"
            className="h-11 flex-1 rounded-[0.375rem] border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="app-btn">Subscribe</button>
          <button type="button" onClick={unsubscribe} className="app-btn-ghost app-btn">Unsubscribe</button>
        </form>
        {status && <p className="app-meta mt-3">{status}</p>}
      </Section>

      <Section title="Recent matches">
        <DataTable
          columns={columns}
          rows={matches}
          rowKey={(m) => String(m.id)}
          empty={
            <EmptyState
              title="No matches recorded yet"
              description="The hourly job checks EU and Cyprus funding sources for calls that match Vuneli's SME sustainability focus. New calls will appear here as soon as they're found."
            />
          }
        />
      </Section>
    </PageShell>
  );
}
