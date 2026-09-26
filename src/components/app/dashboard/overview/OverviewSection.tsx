"use client";

/**
 * The default tab: what changed, evidence, footprint, next obligation,
 * the approval queue and the latest audit records.
 */

import { Link } from "@/i18n/navigation";
import type { ConsoleOverviewData } from "@/components/app/console/types";
import { daysUntil, fmtNumber, relativeTime } from "@/components/app/console/types";
import { AgentPulse } from "@/components/app/console/AgentPulse";
import { ArcGauge, BarRow, Rule } from "@/components/app/console/charts";
import { IcoAlert, IcoCheck } from "@/components/app/console/icons";
import { buildInsights, dueObligationsOf } from "./insights";
import { PlateOpen, STATUS_TONE, titleCase } from "./shared";

export function OverviewSection({ data }: { data: ConsoleOverviewData }) {
  const { agents, runs, tasks, connections, events, metrics } = data;
  const byKey = (key: string) => metrics.find((m) => m.key === key);
  const coverage = byKey("data_coverage");
  const automation = byKey("automation_rate");
  const footprint = byKey("co2e_total");
  const gridIntensity = byKey("grid_intensity");
  const dueObligations = dueObligationsOf(data);
  const nextObligation = dueObligations[0];
  const activeAgents = agents.filter((a) => a.status === "active");
  const runsToday = runs.filter((r) => Date.now() - new Date(r.startedAt).getTime() < 86_400_000);
  const topInsights = buildInsights(data);

  return (
    <>
      <div className="vc-plate-grid">
        <section className="vc-plate">
          <header>
            <span>What changed</span>
            <strong>
              {topInsights.length} signal{topInsights.length === 1 ? "" : "s"}
            </strong>
            <PlateOpen href="/app/analytics" label="Open the analysis record" />
          </header>
          <div className="vc-insight-list">
            {topInsights.map((insight) => (
              <article key={insight.id} data-tone={insight.tone}>
                <i className="vc-dot" data-tone={insight.tone} />
                <span className="vc-insight-copy">
                  <em>{insight.label}</em>
                  <strong>{insight.headline}</strong>
                  <small>{insight.detail}</small>
                </span>
                <Link href={insight.href as never} className="vc-plate-open" aria-label={insight.linkLabel}>
                  Open
                </Link>
              </article>
            ))}
          </div>
          <p className="vc-insight-foot">
            {activeAgents.length} of {agents.length} agents active · {runsToday.length} runs closed today
          </p>
        </section>

        <section className="vc-plate vc-plate-tight">
          <header>
            <span>Evidence</span>
            <strong>{Math.round(coverage?.current ?? 0)}%</strong>
          </header>
          <div className="vc-gauge-wrap">
            <ArcGauge value={coverage?.current ?? 0} caption="primary records" gradientId="vcCoverageConsole" />
          </div>
          <div className="vc-mini-rule">
            <span>Automation rate</span>
            <Rule pct={automation?.current ?? 0} />
          </div>
          <div className="vc-reading-list">
            {runs.slice(0, 3).map((run) => (
              <p key={run.id}>
                <strong>{agents.find((a) => a.key === run.agentKey)?.name ?? run.agentKey}</strong>
                <span>
                  {titleCase(run.status)} · {relativeTime(run.startedAt)}
                </span>
                <em>{run.itemsProcessed} items</em>
              </p>
            ))}
          </div>
          <AgentPulse />
        </section>

        <section className="vc-plate">
          <header>
            <span>Footprint over time</span>
            <strong>{fmtNumber((footprint?.points ?? []).reduce((sum, p) => sum + p.value, 0), 1)} tCO₂e</strong>
            <PlateOpen href="/app/analytics" label="Open the footprint record" />
          </header>
          <BarRow points={(footprint?.points ?? []).map((p) => ({ label: p.label, value: p.value }))} height={74} />
          <div className="vc-live-list">
            {connections.slice(0, 3).map((c) => (
              <p key={c.id}>
                <i className={`vc-dot ${c.status === "live" ? "vc-live" : ""}`} data-tone={STATUS_TONE[c.status] ?? "idle"} />
                <span>{c.provider}</span>
                <strong>
                  {c.coveragePct === null
                    ? titleCase(c.status === "live" ? "connected" : c.status === "available" ? "not linked" : c.status)
                    : `${Math.round(c.coveragePct)}%`}
                </strong>
              </p>
            ))}
          </div>
        </section>

        <section className="vc-plate vc-plate-tight">
          <header>
            <span>Next obligation</span>
            <strong>{nextObligation ? `${daysUntil(nextObligation.dueDate)} days` : "Clear"}</strong>
            <PlateOpen href="/app/compliance" label="Open obligations" />
          </header>
          {nextObligation ? (
            <div className="vc-obligation">
              <p>{nextObligation.framework}</p>
              <strong>{nextObligation.title}</strong>
              <span>{nextObligation.detail}</span>
              <Rule pct={nextObligation.progressPct} tone={nextObligation.status === "at_risk" ? "warn" : "accent"} />
              <small>
                {Math.round(nextObligation.progressPct)}% prepared by {nextObligation.ownerName}
              </small>
            </div>
          ) : (
            <div className="vc-obligation">
              <span>No regulatory date is open.</span>
            </div>
          )}
          {gridIntensity && gridIntensity.points.length > 0 && (
            <div className="vc-grid-chip">
              <span>Cyprus grid</span>
              <strong>
                {Math.round(gridIntensity.current)} <small>gCO₂/kWh</small>
              </strong>
            </div>
          )}
          {dueObligations.length > 1 && (
            <div className="vc-reading-list">
              {dueObligations.slice(1, 4).map((o) => (
                <p key={o.id}>
                  <strong>{o.title}</strong>
                  <span>
                    {o.framework} · {titleCase(o.status)}
                  </span>
                  <em>{daysUntil(o.dueDate)} d</em>
                </p>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="vc-plate-grid vc-plate-grid-2">
        <section className="vc-plate">
          <header>
            <span>Human in the loop</span>
            <strong>{tasks.length} waiting</strong>
            <PlateOpen href="/app/actions" label="Open the approval queue" />
          </header>
          {tasks.length === 0 ? (
            <p className="vc-empty">The queue is clear.</p>
          ) : (
            <div className="vc-task-row">
              {tasks.slice(0, 4).map((task) => (
                <article key={task.id}>
                  <i>{task.severity === "high" ? <IcoAlert size={14} /> : <IcoCheck size={14} />}</i>
                  <span>
                    <strong>{task.title}</strong>
                    <small>{task.detail}</small>
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="vc-plate">
          <header>
            <span>Audit trail</span>
            <strong>{events.length} records</strong>
          </header>
          <div className="vc-event-row">
            {events.slice(0, 5).map((e) => (
              <p key={e.id}>
                <strong>{e.actorName}</strong> {e.verb} {e.object} <span>{relativeTime(e.createdAt)}</span>
              </p>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
