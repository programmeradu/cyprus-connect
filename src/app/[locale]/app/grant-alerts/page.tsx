"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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

  useEffect(() => {
    fetch("/api/grant-alerts/subscribe")
      .then((r) => r.json())
      .then((j) => setMatches(j.matches ?? []))
      .finally(() => setLoading(false));
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-2 text-xs uppercase tracking-[0.14em] text-emerald-600">Grant Radar</div>
      <h1 className="mb-3 font-serif text-3xl text-foreground">EU and Cyprus grant alerts</h1>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Get an email the moment a new call from the EU Funding &amp; Tenders Portal, the Cyprus
        Research and Innovation Foundation, Invest Cyprus, OEB / KEBE, or a climate accelerator
        matches Vuneli's Cyprus SME sustainability focus.
      </p>

      <form onSubmit={subscribe} className="mb-10 flex flex-col gap-3 rounded-lg border border-border bg-card p-6 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourcompany.cy"
          className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button type="submit" className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Subscribe
        </button>
        <button type="button" onClick={unsubscribe} className="rounded-md border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground">
          Unsubscribe
        </button>
      </form>

      {status && <div className="mb-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{status}</div>}

      <h2 className="mb-4 font-serif text-xl text-foreground">Recent matches</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : matches.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          No matches recorded yet. Once the hourly job runs, new calls appear here.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {matches.map((m) => (
            <li key={m.id} className="p-4">
              <div className="mb-1 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>{SOURCE_LABELS[m.source] ?? m.source}</span>
                {m.program && <span>&middot; {m.program}</span>}
                {m.deadline && <span>&middot; Deadline: {m.deadline}</span>}
              </div>
              <a href={m.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground hover:text-emerald-600">
                {m.title}
              </a>
              <div className="mt-1 text-xs text-muted-foreground">
                First seen {new Date(m.first_seen_at).toLocaleString()} &middot; score {m.score.toFixed(2)}
                {m.notified_at ? " &middot; notified" : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
