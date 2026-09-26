"use client";

/**
 * The four record tabs under the overview: evidence, obligations,
 * connections and the audit trail. Each reads the filtered workspace copy.
 */

import type { ConsoleOverviewData } from "@/components/app/console/types";
import { daysUntil, fmtNumber, relativeTime } from "@/components/app/console/types";
import { Rule } from "@/components/app/console/charts";
import { STATUS_TONE, titleCase } from "./shared";

type Props = { data: ConsoleOverviewData };

export function EvidenceSection({ data }: Props) {
  const { connections, metrics } = data;
  const coverage = metrics.find((m) => m.key === "data_coverage");
  return (
    <div className="vc-plate-grid vc-plate-grid-2">
      <section className="vc-plate">
        <header>
          <span>Connections</span>
          <strong>{Math.round(coverage?.current ?? 0)}% overall</strong>
        </header>
        <div className="vc-bar-list">
          {connections.map((c) => (
            <div key={c.id}>
              <p>
                <strong>{c.provider}</strong>
                <em>{c.coveragePct === null ? titleCase(c.status) : `${Math.round(c.coveragePct)}%`}</em>
              </p>
              {c.coveragePct !== null && <Rule pct={c.coveragePct} tone={c.status === "error" ? "warn" : "accent"} />}
              <small>
                {titleCase(c.category)} · {c.lastSyncAt ? `updated ${relativeTime(c.lastSyncAt)}` : c.note ?? "no data yet"}
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="vc-plate">
        <header>
          <span>Latest readings</span>
          <strong>{metrics.length} series</strong>
        </header>
        <div className="vc-reading-list">
          {metrics.slice(0, 8).map((m) => {
            const latest = m.points.at(-1);
            return (
              <p key={m.key}>
                <strong>{m.shortLabel ?? m.label}</strong>
                <span>{latest ? `${latest.source} · ${Math.round((latest.confidence ?? 0) * 100)}%` : "no reading"}</span>
                <em>
                  {fmtNumber(m.current, m.precision)} {m.unit}
                </em>
              </p>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function ObligationsSection({ data }: Props) {
  return (
    <div className="vc-plate-grid vc-plate-grid-3">
      {data.obligations.map((o) => {
        const days = daysUntil(o.dueDate);
        return (
          <section className="vc-plate" key={o.id}>
            <header>
              <span>{o.framework}</span>
              <strong data-tone={days <= 30 ? "warn" : undefined}>{days >= 0 ? `${days} days` : "passed"}</strong>
            </header>
            <div className="vc-obligation">
              <strong>{o.title}</strong>
              <span>{o.detail}</span>
              <Rule pct={o.progressPct} tone={o.status === "at_risk" ? "warn" : "accent"} />
              <small>
                {titleCase(o.status)} · {Math.round(o.progressPct)}% prepared
                {o.ownerName ? ` by ${o.ownerName}` : ""}
              </small>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ConnectionsSection({ data }: Props) {
  return (
    <div className="vc-plate-grid vc-plate-grid-3">
      {data.connections.map((c) => (
        <section className="vc-plate" key={c.id}>
          <header>
            <span>{titleCase(c.category)}</span>
            <strong>{titleCase(c.status)}</strong>
          </header>
          <div className="vc-agent-lead">
            <span>
              <strong>{c.provider}</strong>
              <small>{c.lastSyncAt ? `updated ${relativeTime(c.lastSyncAt)}` : "no data yet"}</small>
            </span>
            <i className={`vc-dot ${c.status === "live" ? "vc-live" : ""}`} data-tone={STATUS_TONE[c.status] ?? "idle"} />
          </div>
          {c.note && <p className="vc-agent-mission">{c.note}</p>}
          {c.coveragePct !== null && (
            <>
              <Rule pct={c.coveragePct} tone={c.status === "error" ? "warn" : "accent"} />
              <small className="vc-plate-foot">{Math.round(c.coveragePct)}% of records covered</small>
            </>
          )}
        </section>
      ))}
    </div>
  );
}

export function AuditSection({ data }: Props) {
  const { events } = data;
  return (
    <div className="vc-plate-grid vc-plate-grid-1">
      <section className="vc-plate">
        <header>
          <span>Audit trail</span>
          <strong>{events.length} records</strong>
        </header>
        <ol className="vc-audit">
          {events.map((e) => (
            <li key={e.id} data-actor={e.actorType}>
              <span className="vc-audit-when">{relativeTime(e.createdAt)}</span>
              <span className="vc-audit-body">
                <strong>{e.actorName}</strong> {e.verb} {e.object}
                {e.detail && <small>{e.detail}</small>}
              </span>
              <span className="vc-audit-actor">{titleCase(e.actorType)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
