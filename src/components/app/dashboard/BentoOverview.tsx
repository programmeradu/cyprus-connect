"use client";

import { ReactNode } from "react";
import { Sparkline } from "./Sparkline";

export interface BentoStat {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

export interface BentoDeadline {
  label: string;
  /** ISO date of the obligation. */
  date: string;
  detail?: string;
}

interface BentoOverviewProps {
  /** Sentence that reads like a person wrote it, not a page title. */
  summary: ReactNode;
  heroLabel: string;
  heroValue: string;
  heroUnit: string;
  heroDelta?: string;
  heroDeltaTone?: "positive" | "negative" | "neutral";
  heroNote?: string;
  /** Oldest to newest series behind the hero figure. */
  series: number[];
  seriesLabel: string;
  stats: BentoStat[];
  deadlines: BentoDeadline[];
  gridIntensity: { value: number; unit: string; renewables: number; source: string };
  labels: {
    grid: string;
    renewables: string;
    deadlines: string;
    noDeadlines: string;
    daysLeft: (days: number) => string;
  };
}

const daysUntil = (iso: string) => {
  const now = new Date();
  const target = new Date(`${iso}T00:00:00Z`);
  const ms = target.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round(ms / 86_400_000);
};

/**
 * The dashboard's first screen: one figure at display scale, its series,
 * the stats that qualify it, and a narrow rail of live local context.
 * Flat surfaces, hairline rules, no icons, no pills.
 */
export const BentoOverview = ({
  summary,
  heroLabel,
  heroValue,
  heroUnit,
  heroDelta,
  heroDeltaTone = "neutral",
  heroNote,
  series,
  seriesLabel,
  stats,
  deadlines,
  gridIntensity,
  labels
}: BentoOverviewProps) => {
  const dated = deadlines
    .map((d) => ({ ...d, days: daysUntil(d.date) }))
    .filter((d) => d.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  const horizon = 540;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Hero plate */}
      <div className="app-card flex flex-col p-5 sm:p-6 lg:col-span-8">
        <p className="app-meta max-w-[62ch] break-words">{summary}</p>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="app-label mb-1 break-words">{heroLabel}</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="app-metric text-[clamp(2.75rem,6vw,4.25rem)] leading-[0.95] break-words">
                {heroValue}
              </span>
              <span className="text-base font-medium text-muted-foreground">{heroUnit}</span>
              {heroDelta && (
                <span
                  className={`app-num text-sm font-medium ${
                    heroDeltaTone === "positive"
                      ? "text-primary"
                      : heroDeltaTone === "negative"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {heroDelta}
                </span>
              )}
            </div>
            {heroNote && <p className="app-meta mt-2 max-w-[46ch] break-words">{heroNote}</p>}
          </div>

          <div className="w-full min-w-0 text-muted-foreground sm:w-[46%] sm:max-w-[280px]">
            <Sparkline points={series} label={seriesLabel} height={64} />
          </div>
        </div>

        {stats.length > 0 && (
          <dl className="mt-6 sm:mt-auto sm:pt-6 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--app-rule)] bg-[var(--app-rule)] sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[var(--app-surface-1)] p-3.5">
                <dt className="app-label mb-1 break-words">{stat.label}</dt>
                <dd className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="app-metric text-xl break-words">{stat.value}</span>
                  {stat.unit && (
                    <span className="text-xs font-medium text-muted-foreground">{stat.unit}</span>
                  )}
                </dd>
                {stat.note && <p className="app-meta mt-1 break-words">{stat.note}</p>}
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Live rail */}
      <div className="flex flex-col gap-4 lg:col-span-4">
        <div className="app-card p-5">
          <p className="app-label mb-2 break-words">{labels.grid}</p>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="app-metric text-[2rem] leading-none">{gridIntensity.value}</span>
            <span className="text-xs font-medium text-muted-foreground">{gridIntensity.unit}</span>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="app-meta break-words">{labels.renewables}</span>
              <span className="app-num text-sm font-medium">{gridIntensity.renewables}%</span>
            </div>
            <div className="h-[3px] w-full bg-[var(--app-surface-2)]">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, gridIntensity.renewables))}%` }}
              />
            </div>
          </div>

          <p className="app-meta mt-3 break-words">{gridIntensity.source}</p>
        </div>

        <div className="app-card flex-1 p-5">
          <p className="app-label mb-3 break-words">{labels.deadlines}</p>

          {dated.length === 0 ? (
            <p className="app-meta break-words">{labels.noDeadlines}</p>
          ) : (
            <ul className="space-y-4">
              {dated.map((item) => (
                <li key={item.label}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="min-w-0 flex-1 text-sm font-medium break-words">
                      {item.label}
                    </span>
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
        </div>
      </div>
    </div>
  );
};
