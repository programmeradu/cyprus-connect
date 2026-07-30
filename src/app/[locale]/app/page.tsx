"use client";

/**
 * The Vuneli console.
 *
 * Every figure on this page is read from the database through
 * /api/console/overview. Nothing here is written by hand: replace the demo
 * workspace rows and the same components draw live data.
 *
 * The layout is built for the agentic roadmap. The instrument card holds the
 * measurement, the deck holds the autonomy readouts, and the lower grid holds
 * the queue, the roster, the ledger and the connections. New agents and new
 * obligations appear as rows, never as new code.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArcGauge, BarRow, Spark, WaveChart, Rule } from "@/components/app/console/charts";
import {
  AgentGlyph,
  IcoAlert,
  IcoArrowUpRight,
  IcoBell,
  IcoCheck,
  IcoClock,
  IcoSearch,
} from "@/components/app/console/icons";
import {
  AUTONOMY_LABEL,
  daysUntil,
  fmtNumber,
  fmtSigned,
  relativeTime,
  toneFor,
  type ConsoleOverviewData,
} from "@/components/app/console/types";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "emissions", label: "Emissions" },
  { key: "energy", label: "Energy" },
  { key: "assurance", label: "Assurance" },
  { key: "finance", label: "Cost" },
];

const greetingFor = (hour: number) =>
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
      .then((body) => alive && setData(body))
      .catch((err) => alive && setError(err.message));
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

  const findMetric = (key: string) => data?.metrics.find((m) => m.key === key);

  if (error) {
    return (
      <div className="vc vc-shell grid min-h-[60vh] place-items-center px-6">
        <div className="vc-card max-w-md p-6 text-center">
          <p className="text-[13px] font-extrabold">The console cannot reach your data</p>
          <p className="mt-2 text-[12px] leading-relaxed opacity-65">{error}</p>
          <p className="mt-3 text-[11px] opacity-50">
            The dashboard reads every figure from the database, so it shows nothing rather than a
            guess.
          </p>
        </div>
      </div>
    );
  }

  if (!data || !focus) {
    return (
      <div className="vc vc-shell px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1320px] space-y-4">
          <div className="vc-hero h-[430px] animate-pulse opacity-70" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="vc-card h-56 animate-pulse opacity-60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { workspace, agents, runs, tasks, connections, obligations, events } = data;
  const hour = new Date().getHours();
  const activeAgents = agents.filter((a) => a.status === "active");
  const runsToday = runs.filter(
    (r) => Date.now() - new Date(r.startedAt).getTime() < 24 * 3600 * 1000,
  );
  const coverage = findMetric("data_coverage");
  const automation = findMetric("automation_rate");
  const footprint = findMetric("co2e_total");
  const gridIntensity = findMetric("grid_intensity");
  const nextObligation = [...obligations]
    .filter((o) => daysUntil(o.dueDate) >= 0)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))[0];

  const focusTone = toneFor(focus.delta, focus.goodDirection);

  return (
    <div className="vc vc-shell px-3 pb-8 pt-3 sm:px-5 lg:px-7 lg:pt-5">
      <div className="mx-auto max-w-[1360px]">
        {/* ================= instrument card ================= */}
        <section className="vc-hero">
          {/* top bar */}
          <div
            className="flex items-center gap-3 px-4 py-3 sm:px-6"
            style={{ borderBottom: "1px solid var(--vc-hero-rule)" }}
          >
            <div className="min-w-0 flex-none">
              <p className="truncate text-[12.5px] font-extrabold leading-tight tracking-[-0.2px]">
                {workspace.name}
              </p>
              <p className="truncate text-[10px] font-semibold" style={{ color: "var(--vc-hero-ink-3)" }}>
                {workspace.sector} · {workspace.employees} staff · {workspace.sites} sites
              </p>
            </div>

            <div className="relative mx-auto hidden items-center gap-1 rounded-[13px] p-1 sm:flex"
              style={{ background: "rgba(255,255,255,.12)" }}>
              {CATEGORIES.map((c) => {
                const active = c.key === category;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setCategory(c.key);
                      setFocusKey(null);
                    }}
                    className={`rounded-[10px] px-3.5 py-1.5 text-[11.5px] transition-all ${
                      active ? "vc-pill font-extrabold" : "font-semibold"
                    }`}
                    style={{ color: active ? "var(--vc-ink)" : "var(--vc-hero-ink-2)" }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex flex-none items-center gap-1.5">
              <button type="button" className="vc-iconbtn" aria-label="Search the workspace">
                <IcoSearch size={15} />
              </button>
              <span className="relative">
                <button type="button" className="vc-iconbtn" aria-label="Open the approval queue">
                  <IcoBell size={15} />
                </button>
                {tasks.length > 0 && (
                  <span
                    className="vc-num absolute -right-1 -top-1 grid h-[15px] min-w-[15px] place-items-center rounded-full px-[3px] text-[9px]"
                    style={{ background: "var(--vc-lime)", color: "var(--vc-lime-ink)" }}
                  >
                    {tasks.length}
                  </span>
                )}
              </span>
              <span
                className="grid h-[28px] w-[28px] place-items-center rounded-full text-[11px] font-extrabold"
                style={{ background: "rgba(255,255,255,.28)", color: "var(--vc-hero-ink)" }}
              >
                {(workspace.ownerName ?? "V").slice(0, 1)}
              </span>
            </div>
          </div>

          {/* greeting */}
          <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-4 pt-5 sm:px-6">
            <div className="min-w-0">
              <h1 className="text-[clamp(1.4rem,2.6vw,1.95rem)] font-extrabold leading-[1.08] tracking-[-0.6px]">
                {greetingFor(hour)}, {workspace.ownerName ?? "there"}
              </h1>
              <p
                className="mt-1.5 max-w-[62ch] text-[12.5px] font-semibold leading-relaxed"
                style={{ color: "var(--vc-hero-ink-2)" }}
              >
                {activeAgents.length} agents are on duty. They closed {runsToday.length} runs in the
                last day.{" "}
                {tasks.length > 0 && (
                  <span style={{ color: "var(--vc-hero-ink)" }}>
                    {tasks.length} items wait for your decision.
                  </span>
                )}
              </p>
              {workspace.isDemo && (
                <p className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.4px]"
                  style={{ color: "var(--vc-hero-ink-3)" }}>
                  <span className="vc-dot vc-live" data-tone="live" />
                  Demo workspace · seeded data
                </p>
              )}
            </div>

            <div className="flex flex-none items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.4px]"
                  style={{ color: "var(--vc-hero-ink-3)" }}>
                  Reporting period
                </p>
                <p className="text-[12px] font-bold">
                  {focus.points.at(-1)?.label} · baseline {workspace.baselineYear}
                </p>
              </div>
              <button type="button" className="vc-cta">
                Run agents now
              </button>
            </div>
          </div>

          {/* measurement body */}
          <div className="grid grid-cols-1 gap-5 px-4 pb-5 sm:px-6 lg:grid-cols-12 lg:gap-7 lg:pb-6">
            {/* metric stack */}
            <div className="lg:col-span-4">
              <div className="space-y-1.5">
                {inCategory.map((m) => {
                  const active = m.key === focus.key;
                  const tone = toneFor(m.delta, m.goodDirection);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setFocusKey(m.key)}
                      className={`flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left transition-all ${
                        active ? "vc-well" : "hover:bg-white/10"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] font-bold"
                          style={{ color: "var(--vc-hero-ink-2)" }}>
                          {m.label}
                        </span>
                        <span className="vc-num block text-[19px] leading-tight">
                          {fmtNumber(m.current, m.precision)}
                          <span className="ml-1 text-[10px] font-bold opacity-55">{m.unit}</span>
                        </span>
                      </span>
                      <span className="h-7 w-[78px] flex-none" style={{ color: "var(--vc-hero-ink-2)" }}>
                        <Spark points={m.points.map((p) => ({ label: p.label, value: p.value }))} />
                      </span>
                      <span
                        className="vc-num w-[52px] flex-none text-right text-[11px]"
                        style={{
                          color:
                            tone === "good"
                              ? "var(--vc-good)"
                              : tone === "bad"
                                ? "var(--vc-bad)"
                                : "var(--vc-hero-ink-3)",
                        }}
                      >
                        {fmtSigned(m.delta)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* focus chart */}
            <div className="lg:col-span-8">
              <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="vc-kicker">{focus.label}</p>
                  <p className="vc-num text-[clamp(2rem,4.4vw,2.9rem)] leading-[0.95]">
                    {fmtNumber(focus.current, focus.precision)}
                    <span className="ml-1.5 text-[13px] font-bold opacity-55">{focus.unit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="vc-num text-[12.5px]"
                    style={{
                      color:
                        focusTone === "good"
                          ? "var(--vc-good)"
                          : focusTone === "bad"
                            ? "var(--vc-bad)"
                            : "var(--vc-hero-ink-3)",
                    }}
                  >
                    {fmtSigned(focus.delta)} on last month
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--vc-hero-ink-3)" }}>
                    {fmtSigned(focus.sinceStart)} since {focus.points[0]?.label}
                  </p>
                </div>
              </div>
              <div style={{ color: "var(--vc-hero-ink)" }}>
                <WaveChart
                  points={focus.points.map((p) => ({ label: p.label, value: p.value }))}
                  unit={focus.unit}
                  precision={focus.precision}
                  height={236}
                />
              </div>
              {focus.description && (
                <p className="mt-3 text-[11px] font-semibold" style={{ color: "var(--vc-hero-ink-3)" }}>
                  {focus.description}
                </p>
              )}
            </div>
          </div>

          {/* ================= deck: autonomy readouts ================= */}
          <div className="vc-deck grid grid-cols-2 lg:grid-cols-4"
            style={{ marginTop: 0, paddingTop: 0, borderRadius: "26px 26px 26px 26px" }}>
            {/* 1 — autonomy */}
            <div className="p-4 sm:p-5" style={{ borderRight: "1px solid var(--vc-deck-rule)" }}>
              <p className="vc-kicker">Autonomy</p>
              <p className="vc-num mt-2 text-[30px] leading-none">
                {automation ? Math.round(automation.current) : 0}
                <span className="ml-0.5 text-[13px] font-bold opacity-55">%</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--vc-deck-ink-2)" }}>
                of the reporting workload closed without a human step
              </p>
              <div className="mt-4">
                <Rule pct={automation?.current ?? 0} />
              </div>
              <div className="mt-4 space-y-1.5">
                {agents.slice(0, 3).map((a) => (
                  <div key={a.key} className="flex items-center gap-2 text-[11px] font-bold">
                    <span
                      className={`vc-dot ${a.status === "active" ? "vc-live" : ""}`}
                      data-tone={STATUS_TONE[a.status] ?? "idle"}
                    />
                    <span className="truncate">{a.name}</span>
                    <span className="ml-auto flex-none text-[10px] font-semibold opacity-55">
                      {AUTONOMY_LABEL[a.autonomy]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2 — assurance gauge */}
            <div className="p-4 sm:p-5" style={{ borderRight: "1px solid var(--vc-deck-rule)" }}>
              <p className="vc-kicker">Evidence coverage</p>
              <div className="mt-4 flex justify-center pb-1">
                <ArcGauge
                  value={coverage?.current ?? 0}
                  caption="backed by primary evidence"
                  gradientId="vcCoverage"
                />
              </div>
              <p className="mt-3 text-[11px] font-semibold" style={{ color: "var(--vc-deck-ink-2)" }}>
                {fmtSigned(coverage?.delta ?? 0)} on last month. An auditor can trace every figure
                inside this share.
              </p>
            </div>

            {/* 3 — footprint bars */}
            <div className="p-4 sm:p-5" style={{ borderRight: "1px solid var(--vc-deck-rule)" }}>
              <p className="vc-kicker">Footprint by month</p>
              <p className="vc-num mt-2 text-[24px] leading-none">
                {fmtNumber(
                  (footprint?.points ?? []).reduce((sum, p) => sum + p.value, 0),
                  1,
                )}
                <span className="ml-1 text-[11px] font-bold opacity-55">tCO₂e in 12 months</span>
              </p>
              <div className="mt-4">
                <BarRow
                  points={(footprint?.points ?? []).map((p) => ({ label: p.label, value: p.value }))}
                  height={58}
                />
              </div>
            </div>

            {/* 4 — next obligation */}
            <div className="p-4 sm:p-5" style={{ background: "var(--vc-deck-col)" }}>
              <p className="vc-kicker">Next obligation</p>
              {nextObligation ? (
                <>
                  <p className="vc-num mt-2 text-[30px] leading-none">
                    {daysUntil(nextObligation.dueDate)}
                    <span className="ml-1 text-[11px] font-bold opacity-55">days</span>
                  </p>
                  <p className="mt-1.5 text-[12px] font-extrabold leading-snug">
                    {nextObligation.framework} · {nextObligation.title}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed"
                    style={{ color: "var(--vc-deck-ink-2)" }}>
                    {nextObligation.detail}
                  </p>
                  <div className="mt-3">
                    <Rule
                      pct={nextObligation.progressPct}
                      tone={nextObligation.status === "at_risk" ? "warn" : "accent"}
                    />
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.4px]"
                      style={{ color: "var(--vc-deck-ink-2)" }}>
                      {Math.round(nextObligation.progressPct)}% prepared by {nextObligation.ownerName}
                    </p>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-[12px] font-semibold" style={{ color: "var(--vc-deck-ink-2)" }}>
                  Nothing is due.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ================= lower grid ================= */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* approvals */}
          <section className="vc-card lg:col-span-5">
            <header className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--vc-rule)" }}>
              <div>
                <p className="vc-kicker" style={{ color: "var(--vc-ink-3)" }}>
                  Human in the loop
                </p>
                <p className="text-[13.5px] font-extrabold">Waiting on you</p>
              </div>
              <span className="vc-num rounded-[9px] px-2 py-1 text-[11px]"
                style={{ background: "var(--vc-lime)", color: "var(--vc-lime-ink)" }}>
                {tasks.length}
              </span>
            </header>
            <ul className="vc-scroll max-h-[420px] overflow-y-auto">
              {tasks.map((task) => {
                const agent = agents.find((a) => a.key === task.agentKey);
                const due = task.dueAt ? daysUntil(task.dueAt) : null;
                return (
                  <li
                    key={task.id}
                    className="flex gap-3 px-5 py-3.5"
                    style={{ borderBottom: "1px solid var(--vc-rule)" }}
                  >
                    <span
                      className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-[12px]"
                      style={{
                        background: "var(--vc-surface-2)",
                        color: task.severity === "high" ? "var(--vc-bad)" : "var(--vc-ink-2)",
                      }}
                    >
                      <AgentGlyph glyph={agent?.glyph ?? "spine"} size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[12.5px] font-extrabold leading-snug">{task.title}</span>
                        {task.severity === "high" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.3px]"
                            style={{ color: "var(--vc-bad)" }}>
                            <IcoAlert size={11} /> urgent
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-[11.5px] font-semibold leading-relaxed"
                        style={{ color: "var(--vc-ink-2)" }}>
                        {task.detail}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-bold"
                        style={{ color: "var(--vc-ink-3)" }}>
                        <span>{agent?.name ?? task.agentKey}</span>
                        <span className="capitalize">{task.kind}</span>
                        {due != null && (
                          <span className="inline-flex items-center gap-1">
                            <IcoClock size={11} /> due in {due} days
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="flex flex-none items-start">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-[9px] px-2.5 py-1.5 text-[11px] font-extrabold"
                        style={{ background: "var(--vc-lime)", color: "var(--vc-lime-ink)" }}
                      >
                        <IcoCheck size={12} /> Review
                      </button>
                    </span>
                  </li>
                );
              })}
              {tasks.length === 0 && (
                <li className="px-5 py-8 text-center text-[12px] font-semibold" style={{ color: "var(--vc-ink-2)" }}>
                  The queue is clear. The agents will tell you when that changes.
                </li>
              )}
            </ul>
          </section>

          {/* agent roster */}
          <section className="vc-card lg:col-span-4">
            <header className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--vc-rule)" }}>
              <div>
                <p className="vc-kicker" style={{ color: "var(--vc-ink-3)" }}>
                  Workforce
                </p>
                <p className="text-[13.5px] font-extrabold">Agents on duty</p>
              </div>
              <Link
                href={"/app/insights" as never}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold"
                style={{ color: "var(--vc-ink-2)" }}
              >
                Manage <IcoArrowUpRight size={12} />
              </Link>
            </header>
            <ul className="vc-scroll max-h-[420px] overflow-y-auto">
              {agents.map((agent) => {
                const lastRun = runs.find((r) => r.agentKey === agent.key);
                return (
                  <li
                    key={agent.key}
                    className="flex items-start gap-3 px-5 py-3"
                    style={{ borderBottom: "1px solid var(--vc-rule)" }}
                  >
                    <span
                      className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-[12px]"
                      style={{ background: "var(--vc-surface-2)", color: "var(--vc-ink-2)" }}
                    >
                      <AgentGlyph glyph={agent.glyph} size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] font-extrabold">{agent.name}</span>
                        <span
                          className={`vc-dot ${agent.status === "active" ? "vc-live" : ""}`}
                          data-tone={STATUS_TONE[agent.status] ?? "idle"}
                        />
                        <span className="ml-auto flex-none text-[10px] font-extrabold uppercase tracking-[0.3px]"
                          style={{ color: "var(--vc-ink-3)" }}>
                          {AUTONOMY_LABEL[agent.autonomy]}
                        </span>
                      </span>
                      <span className="block text-[11px] font-bold" style={{ color: "var(--vc-ink-2)" }}>
                        {agent.role} · {agent.cadence}
                      </span>
                      {lastRun && (
                        <span className="mt-1 block truncate text-[11px] font-semibold"
                          style={{
                            color:
                              lastRun.status === "failed"
                                ? "var(--vc-bad)"
                                : lastRun.status === "needs_review"
                                  ? "var(--vc-warn)"
                                  : "var(--vc-ink-3)",
                          }}>
                          {lastRun.summary}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] font-bold" style={{ color: "var(--vc-ink-3)" }}>
                        {lastRun ? relativeTime(lastRun.startedAt) : "no runs yet"} · health{" "}
                        {Math.round(agent.healthScore)}%
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ledger */}
          <section className="vc-card lg:col-span-3">
            <header className="px-5 py-4" style={{ borderBottom: "1px solid var(--vc-rule)" }}>
              <p className="vc-kicker" style={{ color: "var(--vc-ink-3)" }}>
                Audit ledger
              </p>
              <p className="text-[13.5px] font-extrabold">What just happened</p>
            </header>
            <ol className="vc-scroll max-h-[420px] overflow-y-auto px-5 py-4">
              {events.map((event) => (
                <li key={event.id} className="relative pb-4 pl-4 last:pb-0">
                  <span
                    className="absolute left-0 top-[5px] h-[7px] w-[7px] rounded-full"
                    style={{
                      background:
                        event.actorType === "human"
                          ? "var(--vc-lime)"
                          : event.actorType === "system"
                            ? "var(--vc-ink-3)"
                            : "var(--vc-good)",
                    }}
                  />
                  <span
                    className="absolute bottom-0 left-[3px] top-[14px] w-px"
                    style={{ background: "var(--vc-rule)" }}
                  />
                  <p className="text-[11.5px] font-bold leading-snug">
                    <span className="font-extrabold">{event.actorName}</span> {event.verb}{" "}
                    {event.object}
                  </p>
                  {event.detail && (
                    <p className="mt-0.5 text-[10.5px] font-semibold leading-relaxed"
                      style={{ color: "var(--vc-ink-3)" }}>
                      {event.detail}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] font-bold" style={{ color: "var(--vc-ink-3)" }}>
                    {relativeTime(event.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* obligations */}
          <section className="vc-card lg:col-span-7">
            <header className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--vc-rule)" }}>
              <div>
                <p className="vc-kicker" style={{ color: "var(--vc-ink-3)" }}>
                  Compliance
                </p>
                <p className="text-[13.5px] font-extrabold">Obligations and who holds them</p>
              </div>
              <Link
                href={"/app/compliance" as never}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold"
                style={{ color: "var(--vc-ink-2)" }}
              >
                Open <IcoArrowUpRight size={12} />
              </Link>
            </header>
            <div className="divide-y" style={{ borderColor: "var(--vc-rule)" }}>
              {obligations.map((o) => {
                const days = daysUntil(o.dueDate);
                return (
                  <div key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5"
                    style={{ borderTop: "1px solid var(--vc-rule)" }}>
                    <span className="w-[64px] flex-none text-[10px] font-extrabold uppercase tracking-[0.4px]"
                      style={{ color: "var(--vc-ink-3)" }}>
                      {o.framework}
                    </span>
                    <span className="min-w-[180px] flex-1">
                      <span className="block text-[12.5px] font-extrabold leading-snug">{o.title}</span>
                      <span className="block text-[11px] font-semibold" style={{ color: "var(--vc-ink-2)" }}>
                        {o.detail}
                      </span>
                    </span>
                    <span className="w-[132px] flex-none">
                      <Rule pct={o.progressPct} tone={o.status === "at_risk" ? "warn" : "accent"} />
                      <span className="mt-1 block text-[10px] font-bold" style={{ color: "var(--vc-ink-3)" }}>
                        {Math.round(o.progressPct)}% · {o.ownerName}
                      </span>
                    </span>
                    <span
                      className="vc-num w-[86px] flex-none text-right text-[12px]"
                      style={{
                        color:
                          days <= 45
                            ? "var(--vc-bad)"
                            : o.status === "at_risk"
                              ? "var(--vc-warn)"
                              : "var(--vc-ink-2)",
                      }}
                    >
                      {days} days
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* connections */}
          <section className="vc-card lg:col-span-5">
            <header className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--vc-rule)" }}>
              <div>
                <p className="vc-kicker" style={{ color: "var(--vc-ink-3)" }}>
                  Data spine
                </p>
                <p className="text-[13.5px] font-extrabold">Where the numbers come from</p>
              </div>
              <span className="text-[11px] font-extrabold" style={{ color: "var(--vc-ink-2)" }}>
                {connections.filter((c) => c.status === "live").length}/{connections.length} live
              </span>
            </header>
            <ul>
              {connections.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                  style={{ borderBottom: "1px solid var(--vc-rule)" }}
                >
                  <span
                    className={`vc-dot ${c.status === "live" ? "vc-live" : ""}`}
                    data-tone={STATUS_TONE[c.status] ?? "idle"}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-extrabold">{c.provider}</span>
                    <span className="block truncate text-[10.5px] font-semibold"
                      style={{ color: "var(--vc-ink-3)" }}>
                      {c.category} · {c.note}
                    </span>
                  </span>
                  <span className="w-[68px] flex-none">
                    <Rule pct={c.coveragePct} tone={c.status === "error" ? "warn" : "accent"} />
                  </span>
                  <span className="w-[62px] flex-none text-right text-[10.5px] font-bold"
                    style={{ color: "var(--vc-ink-3)" }}>
                    {relativeTime(c.lastSyncAt)}
                  </span>
                </li>
              ))}
            </ul>
            {gridIntensity && (
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-[11px] font-bold" style={{ color: "var(--vc-ink-2)" }}>
                  Cyprus grid right now
                </span>
                <span className="vc-num text-[13px]">
                  {Math.round(gridIntensity.current)}
                  <span className="ml-1 text-[10px] font-bold opacity-55">gCO₂/kWh</span>
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
