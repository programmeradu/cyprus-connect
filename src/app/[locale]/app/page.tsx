"use client";

/**
 * Vuneli console overview.
 *
 * This page intentionally follows the supplied Rinesk concept as the whole
 * dashboard, not as one section. The sidebar is removed on this route. Every
 * visible figure still comes from /api/console/overview, so the mock data can
 * be replaced by live rows without changing the UI.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AgentGlyph, IcoAlert, IcoBell, IcoCheck, IcoClock, IcoDoc, IcoGear, IcoGrid, IcoLeaf, IcoPlug, IcoPulse, IcoSearch, IcoSpark } from "@/components/app/console/icons";
import { ArcGauge, BarRow, Rule } from "@/components/app/console/charts";
import {
  AUTONOMY_LABEL,
  daysUntil,
  fmtNumber,
  fmtSigned,
  relativeTime,
  toneFor,
  type ConsoleMetric,
  type ConsoleOverviewData,
} from "@/components/app/console/types";

const CATEGORIES = [
  { key: "emissions", label: "Emissions" },
  { key: "energy", label: "Energy" },
  { key: "assurance", label: "Assurance" },
  { key: "finance", label: "Cost" },
];

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: IcoGrid },
  { href: "/app/analytics", label: "Measure", icon: IcoPulse },
  { href: "/app/compliance", label: "Report", icon: IcoDoc },
  { href: "/app/actions", label: "Reduce", icon: IcoLeaf },
  { href: "/app/insights", label: "Agents", icon: IcoSpark },
  { href: "/app/integrations", label: "Connect", icon: IcoPlug },
];

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
  active: "live",
};

const greetingFor = (hour: number) =>
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

const smoothPath = (pts: [number, number][]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)}, ${(
      p2[0] -
      (p3[0] - p1[0]) / 6
    ).toFixed(2)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
};

const metricSeries = (metric: ConsoleMetric, width: number, top: number, bottom: number) => {
  const values = metric.points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const pad = (maxValue - minValue) * 0.34 || Math.abs(maxValue) * 0.2 || 1;
  const min = minValue - pad;
  const max = maxValue + pad;
  const step = metric.points.length > 1 ? width / (metric.points.length - 1) : width;
  return metric.points.map((point, index) => {
    const x = index * step;
    const y = bottom - ((point.value - min) / (max - min || 1)) * (bottom - top);
    return { x, y, label: point.label, value: point.value };
  });
};

function SignalChart({ metric }: { metric: ConsoleMetric }) {
  const width = 520;
  const height = 192;
  const series = metricSeries(metric, width, 30, 114);
  const path = smoothPath(series.map((p) => [p.x, p.y]));
  const last = series[series.length - 1];
  const points = metric.points.map((p) => p.value);
  const peak = Math.max(...points, 1);

  return (
    <div className="vc-signal">
      <div className="vc-signal-head">
        <span>{metric.points[0]?.label}</span>
        <span>{metric.points.at(-1)?.label}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="vc-signal-svg" fill="none" aria-hidden>
        <defs>
          <linearGradient id="vcSignalGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id="vcSignalSoft" x="-20%" y="-50%" width="140%" height="210%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <line x1="0" x2={width} y1="24" y2="24" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 5" />
        <path d={`${path} L ${width} 132 L 0 132 Z`} fill="url(#vcSignalGlow)" filter="url(#vcSignalSoft)" />
        {metric.points.map((p, index) => {
          const share = p.value / peak;
          const x = 8 + index * ((width - 16) / metric.points.length);
          const top = 140 - share * 44;
          return (
            <g key={`${p.label}-${index}`}>
              <line x1={x} x2={x} y1={top} y2="146" stroke="currentColor" strokeOpacity={index === metric.points.length - 1 ? 0.95 : 0.52} strokeWidth="2.2" strokeLinecap="round" />
              <line x1={x} x2={x} y1="155" y2="168" stroke="currentColor" strokeOpacity="0.34" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          );
        })}
        <path d={path} stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
        {last && (
          <>
            <line x1={last.x} x2={last.x} y1={last.y + 1} y2="146" stroke="var(--vc-lime)" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx={last.x} cy={last.y} r="4.4" fill="var(--vc-lime)" stroke="var(--vc-hero-ink)" strokeWidth="1.6" />
          </>
        )}
      </svg>
      {last && (
        <div className="vc-tooltip" style={{ left: `${Math.min(82, Math.max(12, (last.x / width) * 100))}%`, top: last.y + 10 }}>
          <span>{last.label}</span>
          <strong>
            {fmtNumber(last.value, metric.precision)} <small>{metric.unit}</small>
          </strong>
          <em>{fmtSigned(metric.delta)} this month</em>
        </div>
      )}
    </div>
  );
}

function MiniTabs({ category, setCategory }: { category: string; setCategory: (category: string) => void }) {
  return (
    <div className="vc-top-tabs" aria-label="Metric category">
      {CATEGORIES.map((item) => (
        <button
          key={item.key}
          type="button"
          data-active={item.key === category}
          onClick={() => setCategory(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default function ConsolePage() {
  const [data, setData] = useState<ConsoleOverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("emissions");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/console/overview")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message ?? body?.error ?? "Console unavailable");
        return body as ConsoleOverviewData;
      })
      .then((body) => {
        if (alive) setData(body);
      })
      .catch((err) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  const inCategory = useMemo(
    () => (data?.metrics ?? []).filter((m) => m.category === category),
    [data, category],
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
        </div>
      </div>
    );
  }

  if (!data || !focus) {
    return (
      <div className="vc vc-fit">
        <div className="vc-window vc-loading" />
      </div>
    );
  }

  const { workspace, agents, runs, tasks, connections, obligations, events } = data;
  const hour = new Date().getHours();
  const activeAgents = agents.filter((agent) => agent.status === "active");
  const runsToday = runs.filter((run) => Date.now() - new Date(run.startedAt).getTime() < 86_400_000);
  const coverage = data.metrics.find((metric) => metric.key === "data_coverage");
  const automation = data.metrics.find((metric) => metric.key === "automation_rate");
  const footprint = data.metrics.find((metric) => metric.key === "co2e_total");
  const gridIntensity = data.metrics.find((metric) => metric.key === "grid_intensity");
  const nextObligation = [...obligations]
    .filter((obligation) => daysUntil(obligation.dueDate) >= 0)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))[0];
  const focusTone = toneFor(focus.delta, focus.goodDirection);

  return (
    <div className="vc vc-fit">
      <section className="vc-window" aria-label="Vuneli autonomous ESG console">
        <div className="vc-top-panel">
          <header className="vc-nav">
            <Link href={"/app" as never} className="vc-brand" aria-label="Vuneli console home">
              <span className="vc-brand-mark"><IcoLeaf size={16} /></span>
              <span>Vuneli</span>
            </Link>

            <nav className="vc-mainnav" aria-label="Workspace navigation">
              <span className="vc-nav-pill" />
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/app";
                return (
                  <Link key={item.href} href={item.href as never} data-active={active}>
                    <Icon size={13} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="vc-actions">
              <ThemeToggle />
              <LanguageSwitcher />
              <button type="button" className="vc-iconbtn" aria-label="Search workspace"><IcoSearch size={14} /></button>
              <button type="button" className="vc-iconbtn vc-notify" aria-label="Open approval queue"><IcoBell size={14} /><span>{tasks.length}</span></button>
              <span className="vc-avatar">{(workspace.ownerName ?? "V").slice(0, 1).toUpperCase()}</span>
            </div>
          </header>

          <div className="vc-hero-grid">
            <aside className="vc-team-card">
              <div className="vc-owner-row">
                <span className="vc-owner-avatar">{(workspace.ownerName ?? "V").slice(0, 1).toUpperCase()}</span>
                <span>
                  <small>{workspace.ownerRole ?? "Workspace lead"}</small>
                  <strong>{workspace.ownerName ?? "Signed in"}</strong>
                </span>
              </div>
              <button type="button" className="vc-add-agent">Run agents</button>
              <button type="button" className="vc-iconbtn" aria-label="Find an agent"><IcoSearch size={13} /></button>

              <div className="vc-side-icons" aria-label="Console sections">
                {[IcoPulse, IcoDoc, IcoLeaf, IcoSpark].map((Icon, index) => (
                  <span key={index} data-active={index === 0}><Icon size={14} /></span>
                ))}
              </div>

              <div className="vc-big-number">
                <span>{activeAgents.length}</span>
                <small>agents active</small>
              </div>

              <div className="vc-legend">
                <p><i data-tone="lime" /> Automated <strong>{Math.round(automation?.current ?? 0)}%</strong></p>
                <p><i /> Evidence <strong>{Math.round(coverage?.current ?? 0)}%</strong></p>
                <p><i data-tone="soft" /> Human tasks <strong>{tasks.length}</strong></p>
              </div>
            </aside>

            <main className="vc-chart-zone">
              <div className="vc-greeting">
                <div>
                  <h1>{greetingFor(hour)}, {workspace.ownerName ?? "there"}</h1>
                  <p>{runsToday.length} agent runs closed today. {tasks.length} items need a human decision.</p>
                </div>
                <span className="vc-history"><IcoClock size={16} /></span>
              </div>

              <MiniTabs category={category} setCategory={(next) => { setCategory(next); setFocusKey(null); }} />

              <div className="vc-focus-row">
                <div>
                  <small>{focus.label}</small>
                  <strong>
                    {fmtNumber(focus.current, focus.precision)} <em>{focus.unit}</em>
                  </strong>
                </div>
                <span data-tone={focusTone}>{fmtSigned(focus.delta)} on last month</span>
              </div>

              <SignalChart metric={focus} />
            </main>
          </div>
        </div>

        <div className="vc-tab-strip" aria-label="Workspace sections">
          {["Overview", "Evidence", "Agents", "Obligations", "Audit trail", "Connections", "Forecast", "Exports"].map((item) => (
            <span key={item} data-active={item === "Agents"}>{item}</span>
          ))}
        </div>

        <div className="vc-bottom-panel">
          <section className="vc-bottom-col vc-agents-col">
            <header>
              <span>Agent workforce</span>
              <strong>Autonomous work in progress</strong>
            </header>
            <div className="vc-agent-table">
              <div className="vc-table-head"><span>Agent</span><span>Mode</span><span>Health</span></div>
              {agents.slice(0, 4).map((agent) => {
                const lastRun = runs.find((run) => run.agentKey === agent.key);
                return (
                  <article key={agent.key}>
                    <span className="vc-agent-icon"><AgentGlyph glyph={agent.glyph} size={20} /></span>
                    <span className="vc-agent-copy">
                      <strong>{agent.name}</strong>
                      <small>{lastRun?.summary ?? agent.role}</small>
                    </span>
                    <span className="vc-mode">{AUTONOMY_LABEL[agent.autonomy]}</span>
                    <span className="vc-health">{Math.round(agent.healthScore)}%</span>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="vc-bottom-col vc-gauge-col">
            <header>
              <span>Evidence</span>
              <strong>{Math.round(coverage?.current ?? 0)}% covered</strong>
            </header>
            <div className="vc-gauge-wrap">
              <ArcGauge value={coverage?.current ?? 0} caption="primary records" gradientId="vcCoverageConsole" />
            </div>
            <div className="vc-mini-rule">
              <span>Automation rate</span>
              <Rule pct={automation?.current ?? 0} />
            </div>
          </section>

          <section className="vc-bottom-col vc-bars-col">
            <header>
              <span>Footprint over time</span>
              <strong>{fmtNumber((footprint?.points ?? []).reduce((sum, point) => sum + point.value, 0), 1)} tCO₂e</strong>
            </header>
            <BarRow points={(footprint?.points ?? []).map((point) => ({ label: point.label, value: point.value }))} height={68} />
            <div className="vc-live-list">
              {connections.slice(0, 3).map((connection) => (
                <p key={connection.id}>
                  <i className={`vc-dot ${connection.status === "live" ? "vc-live" : ""}`} data-tone={STATUS_TONE[connection.status] ?? "idle"} />
                  <span>{connection.provider}</span>
                  <strong>{Math.round(connection.coveragePct)}%</strong>
                </p>
              ))}
            </div>
          </section>

          <section className="vc-bottom-col vc-obligation-col">
            <header>
              <span>Next obligation</span>
              <strong>{nextObligation ? `${daysUntil(nextObligation.dueDate)} days` : "Clear"}</strong>
            </header>
            {nextObligation ? (
              <div className="vc-obligation">
                <p>{nextObligation.framework}</p>
                <strong>{nextObligation.title}</strong>
                <span>{nextObligation.detail}</span>
                <Rule pct={nextObligation.progressPct} tone={nextObligation.status === "at_risk" ? "warn" : "accent"} />
                <small>{Math.round(nextObligation.progressPct)}% prepared by {nextObligation.ownerName}</small>
              </div>
            ) : (
              <div className="vc-obligation"><span>No regulatory date is open.</span></div>
            )}
            {gridIntensity && (
              <div className="vc-grid-chip">
                <span>Cyprus grid</span>
                <strong>{Math.round(gridIntensity.current)} <small>gCO₂/kWh</small></strong>
              </div>
            )}
          </section>
        </div>

        <div className="vc-dock-row">
          <section>
            <header><span>Human in the loop</span><strong>{tasks.length} waiting</strong></header>
            <div className="vc-task-row">
              {tasks.slice(0, 3).map((task) => (
                <article key={task.id}>
                  <i>{task.severity === "high" ? <IcoAlert size={14} /> : <IcoCheck size={14} />}</i>
                  <span><strong>{task.title}</strong><small>{task.detail}</small></span>
                </article>
              ))}
            </div>
          </section>
          <section>
            <header><span>Audit trail</span><strong>{events.length} records</strong></header>
            <div className="vc-event-row">
              {events.slice(0, 4).map((event) => (
                <p key={event.id}><strong>{event.actorName}</strong> {event.verb} {event.object} <span>{relativeTime(event.createdAt)}</span></p>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}