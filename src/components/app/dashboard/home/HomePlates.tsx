"use client";

/**
 * The plates under the Home hero: next deadline, what changed, what the
 * agents did, and open funding. Each one summarises a page that owns the
 * records and links to it, so nothing here is a dead end.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ConsoleOverviewData } from "@/components/app/console/types";
import { daysUntil, relativeTime } from "@/components/app/console/types";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import { Rule } from "@/components/app/console/charts";
import { buildInsights, dueObligationsOf } from "@/components/app/dashboard/overview/insights";

export function NextDeadlinePlate({ data }: { data: ConsoleOverviewData }) {
  const t = useTranslations("home.deadline");
  const due = dueObligationsOf(data);
  const next = due[0];
  const grid = data.metrics.find((m) => m.key === "grid_intensity");
  const days = next ? daysUntil(next.dueDate) : null;

  return (
    <section className="vc-plate vch-deadline" data-tour="deadline" aria-labelledby="vch-deadline-title">
      <header>
        <span id="vch-deadline-title">{t("title")}</span>
        <strong data-tone={days !== null && days < 0 ? "bad" : days !== null && days <= 30 ? "warn" : undefined}>
          {days === null ? t("clear") : days < 0 ? t("overdue") : t("days", { count: days })}
        </strong>
      </header>
      {next ? (
        <div className="vch-deadline-body">
          <small>{next.framework}</small>
          <strong>{next.title}</strong>
          {next.detail && <p>{next.detail}</p>}
          <Rule pct={next.progressPct} tone={next.status === "at_risk" ? "warn" : "accent"} />
          <p className="vch-meta">
            {t("prepared", { pct: Math.round(next.progressPct) })}
            {" · "}
            {t("due", { date: new Date(`${next.dueDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) })}
          </p>
          <div className="vch-row-actions">
            <Link href={next.framework.toUpperCase().includes("CBAM") ? "/app/cbam" : "/app/compliance"} className="vch-btn" data-kind="primary">
              {t("continue")}
            </Link>
            {due.length > 1 && (
              <Link href="/app/compliance" className="vch-link">
                {t("more", { count: due.length - 1 })}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="vch-empty">{t("empty")}</p>
      )}
      {grid && grid.points.length > 0 && (
        <p className="vch-grid-note">
          {t("grid", { value: Math.round(grid.current) })}
        </p>
      )}
    </section>
  );
}

export function WhatChangedPlate({ data }: { data: ConsoleOverviewData }) {
  const t = useTranslations("home.changed");
  const insights = buildInsights(data).slice(0, 3);
  return (
    <section className="vc-plate" aria-labelledby="vch-changed-title">
      <header>
        <span id="vch-changed-title">{t("title")}</span>
        <Link href="/app/analytics" className="vch-link">{t("open")}</Link>
      </header>
      {insights.length === 0 ? (
        <p className="vch-empty">{t("empty")}</p>
      ) : (
        <ul className="vch-signal-list">
          {insights.map((i) => (
            <li key={i.id} data-tone={i.tone}>
              <i className="vc-dot" data-tone={i.tone} aria-hidden="true" />
              <div>
                <strong>{i.headline}</strong>
                <p>{i.detail}</p>
              </div>
              <Link href={i.href as never} className="vch-link" aria-label={i.linkLabel}>{t("view")}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AgentsDidPlate({ data }: { data: ConsoleOverviewData }) {
  const t = useTranslations("home.agents");
  const events = data.events.slice(0, 5);
  return (
    <section className="vc-plate" aria-labelledby="vch-agents-title">
      <header>
        <span id="vch-agents-title">{t("title")}</span>
        <Link href="/app/agents" className="vch-link">{t("history")}</Link>
      </header>
      {events.length === 0 ? (
        <p className="vch-empty">{t("empty")}</p>
      ) : (
        <ul className="vch-feed">
          {events.map((e) => (
            <li key={e.id} data-actor={e.actorType}>
              <p>
                <strong>{e.actorName}</strong> {e.verb} {e.object}
              </p>
              {e.detail && <small>{e.detail}</small>}
              <time dateTime={e.createdAt}>{relativeTime(e.createdAt)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface FundingFeed {
  matches?: { id: number; title: string; url: string; program: string | null; source: string; deadline: string | null }[];
}

export function MoneyPlate() {
  const t = useTranslations("home.money");
  const feed = useWorkspaceResource<FundingFeed>("/api/grant-alerts/subscribe");
  const today = new Date().toISOString().slice(0, 10);
  const open = (feed.data?.matches ?? [])
    .filter((m) => !m.deadline || m.deadline >= today)
    .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))
    .slice(0, 3);

  return (
    <section className="vc-plate" aria-labelledby="vch-money-title">
      <header>
        <span id="vch-money-title">{t("title")}</span>
        <Link href={"/app/actions#funding" as never} className="vch-link">{t("all")}</Link>
      </header>
      {feed.loading ? (
        <p className="vch-empty">{t("loading")}</p>
      ) : open.length === 0 ? (
        <p className="vch-empty">{t("empty")}</p>
      ) : (
        <ul className="vch-feed">
          {open.map((m) => (
            <li key={m.id}>
              <p>
                <a href={m.url} target="_blank" rel="noreferrer" className="vch-ext">{m.title}</a>
              </p>
              <small>{[m.program, m.source].filter(Boolean).join(" · ")}</small>
              <time>{m.deadline ? daysUntil(m.deadline) <= 0 ? t("closesToday") : t("closes", { days: daysUntil(m.deadline) }) : t("rolling")}</time>
            </li>
          ))}
        </ul>
      )}
      <p className="vch-meta">{t("note")}</p>
    </section>
  );
}
