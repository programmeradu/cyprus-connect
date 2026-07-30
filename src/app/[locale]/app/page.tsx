"use client";

/**
 * Vuneli console overview.
 *
 * The Rinesk study is the whole application surface, not a framed window.
 * Every figure, label, count and section below is read from
 * /api/console/overview. Nothing on this page is written by hand.
 */

import { ConsoleAvatar } from "@/components/app/console/ConsoleAvatar";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useConsole } from "@/components/app/console/ConsoleData";
import { SignalChart } from "@/components/app/console/SignalChart";
import {
  AgentGlyph,
  IcoAlert,
  IcoCheck,
  IcoClock,
  IcoDoc,
  IcoLeaf,
  IcoPlug,
  IcoPulse,
  IcoSpark,
} from "@/components/app/console/icons";
import { ArcGauge, BarRow, Rule, Spark } from "@/components/app/console/charts";
import {
  AUTONOMY_LABEL,
  daysUntil,
  fmtNumber,
  fmtSigned,
  relativeTime,
  toneFor,
} from "@/components/app/console/types";

const CATEGORY_ICON: Record<string, typeof IcoPulse> = {
  emissions: IcoLeaf,
  energy: IcoPulse,
  assurance: IcoDoc,
  finance: IcoSpark,
  operations: IcoPlug,
};

const CATEGORY_LABEL: Record<string, string> = {
  emissions: "Emissions",
  energy: "Energy",
  assurance: "Assurance",
  finance: "Cost",
  operations: "Operations",
};

const STATUS_TONE: Record<string, string> = {
  live: "live",
  succeeded: "good",
  running: "live",
  syncing: "warn",
  needs_review: "warn",
  at_risk: "warn",
  error: "bad",
  failed: "bad",
  paused: "idle",
  available: "idle",
  planned: "idle",
  on_track: "good",
  done: "good",
  active: "live",
};

const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/**
 * Every plate on the overview is a summary of a page that owns those records.
 * This link carries the reader to that page, so no figure is a dead end.
 */
function PlateOpen({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href as never} className="vc-plate-open" aria-label={label}>
      Open
    </Link>
  );
}


const greetingFor = (hour: number) =>
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

type SectionKey = "overview" | "agents" | "evidence" | "obligations" | "connections" | "audit";

export default function ConsolePage() {
  /* The workspace read lives in the layout, so the top bar, the palette
     and every page share one set of records. */
  const { data, error, refresh } = useConsole();
  const [category, setCategory] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [section, setSection] = useState<SectionKey>("overview");

  /** Categories are whatever the metric table actually holds. */
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const metric of data?.metrics ?? []) {
      if (!seen.includes(metric.category)) seen.push(metric.category);
    }
    return seen;
  }, [data]);

  const activeCategory = category ?? categories[0] ?? null;

  const inCategory = useMemo(
    () => (data?.metrics ?? []).filter((m) => m.category === activeCategory),
    [data, activeCategory],
  );

  const focus = useMemo(
    () => inCategory.find((m) => m.key === focusKey) ?? inCategory[0],
    [inCategory, focusKey],
  );

  if (error) {
    return (
      <div className="vc vc-fit">
        <div className="vc-window vc-state">
          <p>The console cannot reach your data</p>
          <span>{error}</span>
          <button type="button" className="vc-add-agent" onClick={refresh}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !focus) {
    return (
      <div className="vc vc-fit">
        <div className="vc-window vc-loading" aria-label="Loading the Vuneli console">
          <div className="vc-loading-top">
            <span />
            <i />
            <i />
            <i />
          </div>
          <div className="vc-loading-hero">
            <aside />
            <main>
              <span />
              <strong />
              <em />
            </main>
          </div>
          <div className="vc-loading-tabs" />
          <div className="vc-loading-deck">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  const { workspace, agents, runs, tasks, connections, obligations, events, metrics } = data;
  const hour = new Date().getHours();
  const activeAgents = agents.filter((agent) => agent.status === "active");
  const runsToday = runs.filter((run) => Date.now() - new Date(run.startedAt).getTime() < 86_400_000);
  const byKey = (key: string) => metrics.find((metric) => metric.key === key);
  const coverage = byKey("data_coverage");
  const automation = byKey("automation_rate");
  const footprint = byKey("co2e_total");
  const gridIntensity = byKey("grid_intensity");
  const dueObligations = [...obligations]
    .filter((obligation) => daysUntil(obligation.dueDate) >= 0)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
  const nextObligation = dueObligations[0];
  const focusTone = toneFor(focus.delta, focus.goodDirection);

  const SECTIONS: { key: SectionKey; label: string; count: number }[] = [
    { key: "overview", label: "Overview", count: metrics.length },
    { key: "agents", label: "Agents", count: agents.length },
    { key: "evidence", label: "Evidence", count: connections.length },
    { key: "obligations", label: "Obligations", count: obligations.length },
    { key: "connections", label: "Connections", count: connections.length },
    { key: "audit", label: "Audit trail", count: events.length },
  ];

  return (
    <div className="vc vc-fit">
      <section className="vc-window" aria-label="Vuneli autonomous ESG console">
        <div className="vc-top-panel">
          <div className="vc-hero-grid">
            <aside className="vc-team-card">
              {/* The card names the entity under measurement, not the person.
                  The greeting and the account menu already carry the person. */}
              <div className="vc-owner-row">
                <span className="vc-owner-avatar">
                  <ConsoleAvatar seed={workspace.name ?? "Vuneli"} size={30} styleKey="shapes" alt="" />
                </span>
                <span>
                  <small>
                    {[
                      workspace.sector,
                      workspace.country,
                      `${workspace.sites} site${workspace.sites === 1 ? "" : "s"}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                  <strong>{workspace.legalName ?? workspace.name}</strong>
                </span>
              </div>


              <button
                type="button"
                className="vc-add-agent"
                onClick={() => setSection("agents")}
                aria-label="Show the agent workforce"
              >
                Agent workforce
              </button>

              {/* The rail switches the hero series. It is not decoration. */}
              <div className="vc-side-icons" role="tablist" aria-label="Metric category">
                {categories.map((key) => {
                  const Icon = CATEGORY_ICON[key] ?? IcoPulse;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={key === activeCategory}
                      aria-label={CATEGORY_LABEL[key] ?? titleCase(key)}
                      title={CATEGORY_LABEL[key] ?? titleCase(key)}
                      data-active={key === activeCategory}
                      onClick={() => {
                        setCategory(key);
                        setFocusKey(null);
                      }}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>

              <div className="vc-big-number">
                <span>{activeAgents.length}</span>
                <small>of {agents.length} agents active</small>
              </div>

              <div className="vc-legend">
                <p>
                  <i data-tone="lime" /> Automated <strong>{Math.round(automation?.current ?? 0)}%</strong>
                </p>
                <p>
                  <i /> Evidence <strong>{Math.round(coverage?.current ?? 0)}%</strong>
                    <PlateOpen href="/app/analytics" label="Open evidence coverage" />
                </p>
                <p>
                  <i data-tone="soft" /> Human tasks <strong>{tasks.length}</strong>
                </p>
              </div>

              {/* The rest of the category, so the column carries real weight. */}
              <div className="vc-side-series" aria-label={`Other ${CATEGORY_LABEL[activeCategory ?? ""] ?? ""} readings`}>
                {inCategory
                  .filter((metric) => metric.key !== focus.key)
                  .slice(0, 3)
                  .map((metric) => {
                    const tone = toneFor(metric.delta, metric.goodDirection);
                    return (
                      <button
                        key={metric.key}
                        type="button"
                        onClick={() => setFocusKey(metric.key)}
                        aria-label={`Show ${metric.label}`}
                      >
                        <span className="vc-side-series-copy">
                          <small>{metric.shortLabel ?? metric.label}</small>
                          <strong>
                            {fmtNumber(metric.current, metric.precision)} <em>{metric.unit}</em>
                          </strong>
                        </span>
                        <span className="vc-side-series-spark">
                          <Spark points={metric.points.map((p) => ({ label: p.label, value: p.value }))} />
                        </span>
                        <em data-tone={tone}>{fmtSigned(metric.delta)}</em>
                      </button>
                    );
                  })}
              </div>
            </aside>

            <main className="vc-chart-zone">
              <div className="vc-greeting">
                <div>
                  <h1>
                    {greetingFor(hour)}, {workspace.ownerName ?? "there"}
                  </h1>
                  <p>
                    {runsToday.length} agent runs closed today. {tasks.length} items need a human
                    decision.
                  </p>
                </div>
                <span className="vc-history" title={`Read at ${new Date(data.generatedAt).toLocaleTimeString("en-GB")}`}>
                  <IcoClock size={16} />
                </span>
              </div>

              <div className="vc-top-tabs" role="tablist" aria-label="Metric in view">
                {inCategory.map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    role="tab"
                    aria-selected={metric.key === focus.key}
                    data-active={metric.key === focus.key}
                    onClick={() => setFocusKey(metric.key)}
                  >
                    {metric.shortLabel ?? metric.label}
                  </button>
                ))}
              </div>

              <div className="vc-focus-row">
                <div>
                  <small>{focus.label}</small>
                  <strong>
                    {fmtNumber(focus.current, focus.precision)} <em>{focus.unit}</em>
                  </strong>
                </div>
                <span data-tone={focusTone}>{fmtSigned(focus.delta)} on last period</span>
              </div>

              <SignalChart metric={focus} />
            </main>
          </div>
        </div>

        <div className="vc-tab-strip" role="tablist" aria-label="Workspace sections">
          {SECTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={item.key === section}
              data-active={item.key === section}
              onClick={() => setSection(item.key)}
            >
              {item.label}
              <i>{item.count}</i>
            </button>
          ))}
        </div>

        <div className="vc-deck" role="tabpanel" aria-label={`${section} records`}>
          {section === "overview" && (
            <>
              <div className="vc-plate-grid">
                <section className="vc-plate">
                  <header>
                    <span>Agent workforce</span>
                    <strong>{activeAgents.length} running</strong>
                    <PlateOpen href="/app/insights" label="Open the agent workforce" />
                  </header>
                  <div className="vc-agent-table">
                    <div className="vc-table-head">
                      <span>Agent and last run</span>
                      <span>Health</span>
                    </div>
                    {agents.slice(0, 4).map((agent) => {
                      const lastRun = runs.find((run) => run.agentKey === agent.key);
                      return (
                        <article key={agent.key}>
                          <span className="vc-agent-icon">
                            <AgentGlyph glyph={agent.glyph} size={20} />
                          </span>
                          <span className="vc-agent-copy">
                            <strong>{agent.name}</strong>
                            <small>{lastRun?.summary ?? agent.role}</small>
                            <em>{AUTONOMY_LABEL[agent.autonomy]}</em>
                          </span>
                          <span className="vc-health">{Math.round(agent.healthScore)}%</span>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="vc-plate vc-plate-tight">
                  <header>
                    <span>Evidence</span>
                    <strong>{Math.round(coverage?.current ?? 0)}%</strong>
                  </header>
                  <div className="vc-gauge-wrap">
                    <ArcGauge
                      value={coverage?.current ?? 0}
                      caption="primary records"
                      gradientId="vcCoverageConsole"
                    />
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
                </section>


                <section className="vc-plate">
                  <header>
                    <span>Footprint over time</span>
                    <strong>
                      {fmtNumber((footprint?.points ?? []).reduce((sum, p) => sum + p.value, 0), 1)} tCO₂e
                    </strong>
                    <PlateOpen href="/app/analytics" label="Open the footprint record" />
                  </header>
                  <BarRow
                    points={(footprint?.points ?? []).map((p) => ({ label: p.label, value: p.value }))}
                    height={74}
                  />
                  <div className="vc-live-list">
                    {connections.slice(0, 3).map((connection) => (
                      <p key={connection.id}>
                        <i
                          className={`vc-dot ${connection.status === "live" ? "vc-live" : ""}`}
                          data-tone={STATUS_TONE[connection.status] ?? "idle"}
                        />
                        <span>{connection.provider}</span>
                        <strong>{Math.round(connection.coveragePct)}%</strong>
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
                      <Rule
                        pct={nextObligation.progressPct}
                        tone={nextObligation.status === "at_risk" ? "warn" : "accent"}
                      />
                      <small>
                        {Math.round(nextObligation.progressPct)}% prepared by {nextObligation.ownerName}
                      </small>
                    </div>
                  ) : (
                    <div className="vc-obligation">
                      <span>No regulatory date is open.</span>
                    </div>
                  )}
                  {gridIntensity && (
                    <div className="vc-grid-chip">
                      <span>Cyprus grid</span>
                      <strong>
                        {Math.round(gridIntensity.current)} <small>gCO₂/kWh</small>
                      </strong>
                    </div>
                  )}
                  {dueObligations.length > 1 && (
                    <div className="vc-reading-list">
                      {dueObligations.slice(1, 4).map((obligation) => (
                        <p key={obligation.id}>
                          <strong>{obligation.title}</strong>
                          <span>
                            {obligation.framework} · {titleCase(obligation.status)}
                          </span>
                          <em>{daysUntil(obligation.dueDate)} d</em>
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
                    {events.slice(0, 5).map((event) => (
                      <p key={event.id}>
                        <strong>{event.actorName}</strong> {event.verb} {event.object}{" "}
                        <span>{relativeTime(event.createdAt)}</span>
                      </p>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {section === "agents" && (
            <div className="vc-plate-grid vc-plate-grid-3">
              {agents.map((agent) => {
                const agentRuns = runs.filter((run) => run.agentKey === agent.key);
                const last = agentRuns[0];
                return (
                  <section className="vc-plate" key={agent.key}>
                    <header>
                      <span>{AUTONOMY_LABEL[agent.autonomy]}</span>
                      <strong>{Math.round(agent.healthScore)}%</strong>
                    </header>
                    <div className="vc-agent-lead">
                      <span className="vc-agent-icon">
                        <AgentGlyph glyph={agent.glyph} size={22} />
                      </span>
                      <span>
                        <strong>{agent.name}</strong>
                        <small>{agent.role}</small>
                      </span>
                      <i className="vc-dot" data-tone={STATUS_TONE[agent.status] ?? "idle"} />
                    </div>
                    <p className="vc-agent-mission">{agent.mission}</p>
                    <dl className="vc-kv">
                      <div>
                        <dt>Cadence</dt>
                        <dd>{agent.cadence}</dd>
                      </div>
                      <div>
                        <dt>Runs held</dt>
                        <dd>{agentRuns.length}</dd>
                      </div>
                      <div>
                        <dt>Last run</dt>
                        <dd>{last ? relativeTime(last.startedAt) : "not yet"}</dd>
                      </div>
                    </dl>
                    {last && <p className="vc-agent-mission vc-agent-note">{last.summary}</p>}
                    <Rule pct={agent.healthScore} tone={agent.status === "active" ? "accent" : "muted"} />
                  </section>
                );
              })}
            </div>
          )}

          {section === "evidence" && (
            <div className="vc-plate-grid vc-plate-grid-2">
              <section className="vc-plate">
                <header>
                  <span>Coverage by connection</span>
                  <strong>{Math.round(coverage?.current ?? 0)}% overall</strong>
                </header>
                <div className="vc-bar-list">
                  {connections.map((connection) => (
                    <div key={connection.id}>
                      <p>
                        <strong>{connection.provider}</strong>
                        <em>{Math.round(connection.coveragePct)}%</em>
                      </p>
                      <Rule pct={connection.coveragePct} tone={connection.status === "error" ? "warn" : "accent"} />
                      <small>
                        {titleCase(connection.category)} · synced {relativeTime(connection.lastSyncAt)}
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
                  {metrics.slice(0, 8).map((metric) => {
                    const latest = metric.points.at(-1);
                    return (
                      <p key={metric.key}>
                        <strong>{metric.shortLabel ?? metric.label}</strong>
                        <span>{latest ? `${latest.source} · ${Math.round((latest.confidence ?? 0) * 100)}%` : "no reading"}</span>
                        <em>
                          {fmtNumber(metric.current, metric.precision)} {metric.unit}
                        </em>
                      </p>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {section === "obligations" && (
            <div className="vc-plate-grid vc-plate-grid-3">
              {obligations.map((obligation) => {
                const days = daysUntil(obligation.dueDate);
                return (
                  <section className="vc-plate" key={obligation.id}>
                    <header>
                      <span>{obligation.framework}</span>
                      <strong data-tone={days <= 30 ? "warn" : undefined}>
                        {days >= 0 ? `${days} days` : "passed"}
                      </strong>
                    </header>
                    <div className="vc-obligation">
                      <strong>{obligation.title}</strong>
                      <span>{obligation.detail}</span>
                      <Rule pct={obligation.progressPct} tone={obligation.status === "at_risk" ? "warn" : "accent"} />
                      <small>
                        {titleCase(obligation.status)} · {Math.round(obligation.progressPct)}% prepared
                        {obligation.ownerName ? ` by ${obligation.ownerName}` : ""}
                      </small>
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {section === "connections" && (
            <div className="vc-plate-grid vc-plate-grid-3">
              {connections.map((connection) => (
                <section className="vc-plate" key={connection.id}>
                  <header>
                    <span>{titleCase(connection.category)}</span>
                    <strong>{titleCase(connection.status)}</strong>
                  </header>
                  <div className="vc-agent-lead">
                    <span>
                      <strong>{connection.provider}</strong>
                      <small>synced {relativeTime(connection.lastSyncAt)}</small>
                    </span>
                    <i
                      className={`vc-dot ${connection.status === "live" ? "vc-live" : ""}`}
                      data-tone={STATUS_TONE[connection.status] ?? "idle"}
                    />
                  </div>
                  {connection.note && <p className="vc-agent-mission">{connection.note}</p>}
                  <Rule pct={connection.coveragePct} tone={connection.status === "error" ? "warn" : "accent"} />
                  <small className="vc-plate-foot">{Math.round(connection.coveragePct)}% of records covered</small>
                </section>
              ))}
            </div>
          )}

          {section === "audit" && (
            <div className="vc-plate-grid vc-plate-grid-1">
              <section className="vc-plate">
                <header>
                  <span>Audit trail</span>
                  <strong>{events.length} records</strong>
                </header>
                <ol className="vc-audit">
                  {events.map((event) => (
                    <li key={event.id} data-actor={event.actorType}>
                      <span className="vc-audit-when">{relativeTime(event.createdAt)}</span>
                      <span className="vc-audit-body">
                        <strong>{event.actorName}</strong> {event.verb} {event.object}
                        {event.detail && <small>{event.detail}</small>}
                      </span>
                      <span className="vc-audit-actor">{titleCase(event.actorType)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </div>

        <p className="vc-foot-note">
          {workspace.name} · {workspace.framework} · baseline {workspace.baselineYear} · read{" "}
          {relativeTime(data.generatedAt)}
        </p>
      </section>
    </div>
  );
}
