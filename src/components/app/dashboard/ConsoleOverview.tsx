"use client";

import { ReactNode, useMemo, useState } from "react";
import { TickSeries, type TickPoint } from "./TickSeries";
import { ArcGauge } from "./ArcGauge";
import { MiniBars } from "./MiniBars";

export interface OverviewHistoryPoint {
  label: string;
  carbon: number;
  electricity: number;
  renewable: number;
  efficiency: number;
}

export interface OverviewDeadline {
  label: string;
  /** ISO date of the obligation. */
  date: string;
  detail?: string;
}

export interface PeerRow {
  label: string;
  percentile?: number;
  grade?: string;
}

interface ConsoleOverviewProps {
  /** Reads like a person wrote it. Shown at display scale. */
  greeting: string;
  subline: ReactNode;
  /** Oldest to newest. */
  history: OverviewHistoryPoint[];
  current: {
    carbon: number;
    carbonTrend: number;
    electricity: number;
    renewable: number;
    renewableTrend: number;
    efficiency: number;
    efficiencyTrend: number;
    waste: number;
  };
  grid: { value: number; unit: string; renewables: number; source: string };
  peers: PeerRow[];
  peerNote?: string;
  deadlines: OverviewDeadline[];
  /** Marks the figures as a representative example, not the account's own data. */
  sample?: boolean;
  sampleNote?: ReactNode;
  labels: {
    carbon: string;
    electricity: string;
    renewables: string;
    efficiency: string;
    waste: string;
    grid: string;
    peers: string;
    horizon: string;
    monthly: string;
    noDeadlines: string;
    noSeries: string;
    noPeers: string;
    daysLeft: (days: number) => string;
  };
}

type SeriesKey = "carbon" | "electricity" | "renewable" | "efficiency";

const daysUntil = (iso: string) => {
  const target = new Date(`${iso}T00:00:00Z`);
  const now = new Date();
  return Math.round(
    (target.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 86_400_000
  );
};

const fmt = (value: number, precision: number) =>
  Number.isFinite(value) ? value.toFixed(precision) : "0";

const signed = (value: number, precision = 1) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.abs(value).toFixed(precision)}%`;

/**
 * The workspace console: a greeting masthead, one figure at display scale
 * over its own series, a tab rail that changes the series, and four
 * analysis plates. Flat surfaces, hairline rules, one accent.
 */
export const ConsoleOverview = ({
  greeting,
  subline,
  history,
  current,
  grid,
  peers,
  peerNote,
  deadlines,
  sample = false,
  sampleNote,
  labels
}: ConsoleOverviewProps) => {
  const [tab, setTab] = useState<SeriesKey>("carbon");

  const tabs = useMemo(
    () =>
      [
        {
          key: "carbon" as const,
          label: labels.carbon,
          unit: "tCO₂e",
          precision: 1,
          value: current.carbon,
          trend: current.carbonTrend,
          /** For emissions a fall is the good direction. */
          downIsGood: true
        },
        {
          key: "electricity" as const,
          label: labels.electricity,
          unit: "kWh",
          precision: 0,
          value: current.electricity || history.at(-1)?.electricity || 0,
          trend: 0,
          downIsGood: true
        },
        {
          key: "renewable" as const,
          label: labels.renewables,
          unit: "%",
          precision: 0,
          value: current.renewable,
          trend: current.renewableTrend,
          downIsGood: false
        },
        {
          key: "efficiency" as const,
          label: labels.efficiency,
          unit: "%",
          precision: 0,
          value: current.efficiency,
          trend: current.efficiencyTrend,
          downIsGood: false
        }
      ],
    [current, history, labels]
  );

  const activeTab = tabs.find((t) => t.key === tab) ?? tabs[0];

  const points: TickPoint[] = history
    .map((h) => ({ label: h.label, value: Number(h[tab]) }))
    .filter((p) => Number.isFinite(p.value));

  const heroValue = points.length ? points[points.length - 1].value : activeTab.value;

  const trendTone =
    activeTab.trend === 0
      ? "neutral"
      : (activeTab.trend < 0) === activeTab.downIsGood
        ? "positive"
        : "negative";

  const dated = deadlines
    .map((d) => ({ ...d, days: daysUntil(d.date) }))
    .filter((d) => d.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  const horizon = 540;

  const monthlyBars = history.map((h) => ({ label: h.label, value: h.carbon }));

  return (
    <div className="space-y-4">
      {/* ---------- Masthead and hero ---------- */}
      <section className="app-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--app-rule)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2 className="app-metric text-[clamp(1.5rem,3.4vw,2.125rem)] leading-[1.1] break-words">
              {greeting}
            </h2>
            <p className="app-meta mt-1.5 max-w-[58ch] break-words">{subline}</p>
            {sample && (
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1.5 border border-[var(--app-rule-strong)] px-2 py-0.5 text-[0.6875rem] font-medium tracking-[0.08em] uppercase text-muted-foreground">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Sample data
                </span>
                {sampleNote && <span className="app-meta break-words">{sampleNote}</span>}
              </p>
            )}
          </div>

          <dl className="shrink-0 rounded-md border border-[var(--app-rule)] px-3.5 py-2.5 sm:min-w-[13.5rem]">
            <dt className="app-label mb-1 break-words">{labels.grid}</dt>
            <dd className="flex flex-wrap items-baseline gap-x-2">
              <span className="app-metric text-xl">{grid.value}</span>
              <span className="text-xs font-medium text-muted-foreground break-words">{grid.unit}</span>
            </dd>
            <dd className="mt-2">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="app-meta break-words">{labels.renewables}</span>
                <span className="app-num text-xs font-medium">{grid.renewables}%</span>
              </div>
              <div className="h-[3px] w-full bg-[var(--app-surface-2)]">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, Math.max(0, grid.renewables))}%` }}
                />
              </div>
            </dd>
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-4">
            <p className="app-label mb-1.5 break-words">{activeTab.label}</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="app-metric text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.92] break-words">
                {fmt(heroValue, activeTab.precision)}
              </span>
              <span className="text-base font-medium text-muted-foreground break-words">
                {activeTab.unit}
              </span>
            </div>

            {activeTab.trend !== 0 && (
              <p
                className={`app-num mt-2 text-sm font-medium ${
                  trendTone === "positive"
                    ? "text-primary"
                    : trendTone === "negative"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {signed(activeTab.trend)} <span className="text-muted-foreground">vs. last period</span>
              </p>
            )}

            {/* Legend: the other readings, so the figure has company. */}
            <dl className="mt-5 space-y-2.5 border-t border-[var(--app-rule)] pt-4">
              {tabs
                .filter((t) => t.key !== activeTab.key)
                .map((t) => (
                  <div key={t.key} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <dt className="app-meta min-w-0 flex-1 break-words">{t.label}</dt>
                    <dd className="app-num text-sm font-medium whitespace-nowrap">
                      {fmt(t.value, t.precision)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">{t.unit}</span>
                    </dd>
                  </div>
                ))}
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <dt className="app-meta min-w-0 flex-1 break-words">{labels.waste}</dt>
                <dd className="app-num text-sm font-medium whitespace-nowrap">
                  {fmt(current.waste, 0)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">%</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="min-w-0 lg:col-span-8">
            {points.length > 1 ? (
              <TickSeries
                points={points}
                label={`${activeTab.label}, oldest to newest`}
                unit={activeTab.unit}
                precision={activeTab.precision}
              />
            ) : (
              <div className="flex h-full min-h-[9rem] items-center justify-center rounded-md border border-dashed border-[var(--app-rule-strong)] p-5">
                <p className="app-meta max-w-[34ch] text-center break-words">{labels.noSeries}</p>
              </div>
            )}
          </div>
        </div>

        {/* Series rail */}
        <div className="overflow-x-auto border-t border-[var(--app-rule)]">
          <div className="flex min-w-max">
            {tabs.map((t) => {
              const isActive = t.key === activeTab.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-pressed={isActive}
                  className={`relative shrink-0 px-5 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-4 bottom-0 h-[2px] ${isActive ? "bg-primary" : "bg-transparent"}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Analysis plates ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Peer standing */}
        <section className="app-card flex flex-col p-5">
          <p className="app-label mb-3 break-words">{labels.peers}</p>
          {peers.length ? (
            <ul className="space-y-3">
              {peers.map((row) => (
                <li key={row.label}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="min-w-0 flex-1 text-sm font-medium break-words">{row.label}</span>
                    <span className="app-num text-sm font-medium whitespace-nowrap">
                      {row.percentile != null ? `${row.percentile.toFixed(0)}` : "-"}
                      {row.percentile != null && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">pct</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-[3px] w-full bg-[var(--app-surface-2)]">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(2, row.percentile ?? 0))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="app-meta break-words">{labels.noPeers}</p>
          )}
          {peerNote && <p className="app-meta mt-auto pt-4 break-words">{peerNote}</p>}
        </section>

        {/* Renewable share */}
        <section className="app-card flex flex-col p-5">
          <p className="app-label mb-3 break-words">{labels.renewables}</p>
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="app-metric text-[2.5rem] leading-none">{fmt(current.renewable, 0)}</span>
            <span className="text-sm font-medium text-muted-foreground">%</span>
          </div>
          <div className="mt-auto pt-5">
            <ArcGauge value={current.renewable} caption={`Cyprus grid mix sits at ${grid.renewables}%`} />
          </div>
        </section>

        {/* Footprint by month */}
        <section className="app-card flex flex-col p-5">
          <p className="app-label mb-3 break-words">{labels.monthly}</p>
          {monthlyBars.length ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="app-metric text-[2rem] leading-none">
                  {fmt(monthlyBars.reduce((sum, b) => sum + b.value, 0), 1)}
                </span>
                <span className="text-xs font-medium text-muted-foreground">tCO₂e logged</span>
              </div>
              <div className="mt-auto pt-5">
                <MiniBars points={monthlyBars} label="Monthly footprint" unit="tCO₂e" precision={1} />
              </div>
            </>
          ) : (
            <p className="app-meta break-words">{labels.noSeries}</p>
          )}
        </section>

        {/* Regulatory horizon */}
        <section className="app-card flex flex-col p-5">
          <p className="app-label mb-3 break-words">{labels.horizon}</p>
          {dated.length === 0 ? (
            <p className="app-meta break-words">{labels.noDeadlines}</p>
          ) : (
            <ul className="space-y-4">
              {dated.map((item) => (
                <li key={item.label}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="min-w-0 flex-1 text-sm font-medium break-words">{item.label}</span>
                    <span
                      className={`app-num text-sm font-medium whitespace-nowrap ${
                        item.days <= 30 ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {labels.daysLeft(item.days)}
                    </span>
                  </div>
                  {item.detail && <p className="app-meta mt-1 break-words">{item.detail}</p>}
                  <div className="mt-2 h-px w-full bg-[var(--app-surface-2)]">
                    <div
                      className={`h-px ${item.days <= 30 ? "bg-destructive" : "bg-[var(--app-rule-strong)]"}`}
                      style={{
                        width: `${Math.min(100, Math.max(4, ((horizon - item.days) / horizon) * 100))}%`
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
