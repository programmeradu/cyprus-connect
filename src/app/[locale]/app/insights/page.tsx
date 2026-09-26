"use client";

/**
 * Insights: what real sources say about the company today.
 * Grid (measured, Energy-Charts), own recorded months, tracked obligations,
 * and one-click advice that must cite those facts. No estimates, no fillers.
 */

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { PageShell, PageHeader, Section, Metric, MetricRow, Empty } from "@/components/app/console/kit";
import { shiftGain, type GridToday } from "@/lib/insights/grid";
import type { AdvicePoint, Fact } from "@/lib/insights/advice";
import type { ComplianceSummary, FootprintMonth } from "@/lib/insights/insights.server";

const PATH = "/api/console/insights";

interface InsightsData {
  country: string;
  grid: GridToday | null;
  gridReason: "unsupported" | "unavailable" | null;
  months: FootprintMonth[];
  compliance: ComplianceSummary;
}

interface Advice {
  points: AdvicePoint[];
  facts: Fact[];
}

const tooltipStyle = {
  backgroundColor: "var(--vc-well)",
  border: "1px solid var(--vc-rule-soft)",
  borderRadius: "6px",
  fontSize: "12px",
};

export default function InsightsPage() {
  const t = useTranslations("dashboard.insights");
  const locale = useLocale();
  const loc = locale === "el" ? "el-CY" : "en-GB";
  const data = useWorkspaceResource<InsightsData>(PATH);
  const advise = useWorkspaceAction();
  const adviceRes = useWorkspaceResource<Advice>(null);
  void adviceRes;

  const time = useMemo(() => new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit" }), [loc]);
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(loc, { month: "short", year: "2-digit", timeZone: "UTC" }), [loc]);
  const fullMonth = useMemo(() => new Intl.DateTimeFormat(loc, { month: "long", year: "numeric", timeZone: "UTC" }), [loc]);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }), [loc]);
  const countryName = useMemo(() => {
    try {
      return new Intl.DisplayNames([loc], { type: "region" });
    } catch {
      return null;
    }
  }, [loc]);

  const d = data.data;
  const country = d ? (countryName?.of(d.country) ?? d.country) : "";
  const grid = d?.grid ?? null;
  const months = d?.months ?? [];
  const c = d?.compliance;

  const gridChart = grid?.hours.map((h) => ({ time: time.format(new Date(h.at)), grams: Math.round(h.grams) })) ?? [];
  const monthChart = months.map((m) => ({
    label: monthFmt.format(new Date(Date.UTC(m.year, m.month - 1, 1))),
    tonnes: Math.round(m.totalTonnes * 1000) / 1000,
  }));
  const last = months[months.length - 1];
  const prev = months[months.length - 2];
  const change = last && prev && prev.totalTonnes > 0 ? ((last.totalTonnes - prev.totalTonnes) / prev.totalTonnes) * 100 : null;

  const [advice, setAdvice] = useAdviceState();
  const writeAdvice = async () => {
    const res = await advise.run<Advice>(`${PATH}/advice`, { invalidates: [] });
    if (res) setAdvice(res);
  };

  return (
    <PageShell
      loading={data.loading}
      error={data.error}
      onRetry={data.reload}
      header={
        <PageHeader
          title={t("title")}
          purpose={country ? t("subtitleFor", { country }) : t("subtitle")}
          actions={
            <button type="button" onClick={data.reload} disabled={data.refreshing} className="vck-btn">
              {data.refreshing ? t("refreshing") : t("refresh")}
            </button>
          }
        />
      }
    >
      <Section title={t("grid.title", { country })} description={t("grid.description")}>
        {grid ? (
          <>
            <MetricRow>
              <Metric label={t("grid.now")} value={Math.round(grid.latest.grams)} unit="g/kWh" note={t("grid.at", { time: time.format(new Date(grid.latest.at)) })} />
              <Metric label={t("grid.cleanest")} value={time.format(new Date(grid.cleanest.at))} note={`${Math.round(grid.cleanest.grams)} g/kWh`} />
              <Metric label={t("grid.dirtiest")} value={time.format(new Date(grid.dirtiest.at))} note={`${Math.round(grid.dirtiest.grams)} g/kWh`} />
              <Metric
                label={t("grid.renewable")}
                value={grid.renewableShare === null ? "—" : grid.renewableShare.toFixed(1)}
                unit={grid.renewableShare === null ? undefined : "%"}
                note={grid.renewableShare === null ? t("grid.notPublished") : t("grid.latestHour")}
              />
            </MetricRow>
            <div className="vck-card p-4 mt-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gridChart} margin={{ left: -12, right: 4, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gridFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--vc-rule-soft)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} g/kWh`, t("grid.intensity")]} />
                    <Area type="monotone" dataKey="grams" stroke="var(--primary)" strokeWidth={2} fill="url(#gridFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm mt-3 break-words">
                {t("grid.shift", {
                  grams: Math.round(shiftGain(grid)),
                  from: time.format(new Date(grid.dirtiest.at)),
                  to: time.format(new Date(grid.cleanest.at)),
                })}
              </p>
              <p className="vck-meta mt-1 break-words">{t("grid.source", { source: grid.source })}</p>
            </div>
          </>
        ) : (
          <Empty
            title={d?.gridReason === "unsupported" ? t("grid.unsupportedTitle") : t("grid.unavailableTitle")}
            body={d?.gridReason === "unsupported" ? t("grid.unsupportedBody") : t("grid.unavailableBody")}
          />
        )}
      </Section>

      <Section title={t("footprint.title")} description={months.length ? t("footprint.description") : undefined}>
        {months.length === 0 ? (
          <Empty title={t("footprint.emptyTitle")} body={t("footprint.emptyBody")} action={{ label: t("footprint.record"), href: "/app/calculator" }} />
        ) : (
          <>
            <MetricRow>
              <Metric
                label={t("footprint.latest")}
                value={last.totalTonnes.toFixed(2)}
                unit="t CO₂e"
                note={fullMonth.format(new Date(Date.UTC(last.year, last.month - 1, 1)))}
                delta={change === null ? undefined : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
                deltaTone={change === null ? undefined : change > 0 ? "negative" : change < 0 ? "positive" : "neutral"}
              />
              <Metric label={t("footprint.months")} value={months.length} note={t("footprint.monthsNote")} />
            </MetricRow>
            {months.length > 1 && (
              <div className="vck-card p-4 mt-4">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthChart} margin={{ left: -12, right: 4, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--vc-rule-soft)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={8} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} t CO₂e`, t("footprint.total")]} />
                      <Bar dataKey="tonnes" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      <Section title={t("obligations.title")}>
        {!c || c.tracked === 0 ? (
          <Empty title={t("obligations.emptyTitle")} body={t("obligations.emptyBody")} action={{ label: t("obligations.open"), href: "/app/compliance" }} />
        ) : (
          <MetricRow>
            <Metric label={t("obligations.tracked")} value={c.tracked} note={t("obligations.compliant", { count: c.compliant })} />
            <Metric label={t("obligations.action")} value={c.actionRequired} />
            <Metric label={t("obligations.due30")} value={c.dueWithin30Days} />
            <Metric
              label={t("obligations.next")}
              value={c.next ? t("obligations.days", { count: c.next.daysLeft }) : "—"}
              note={c.next ? `${c.next.name} · ${dateFmt.format(new Date(c.next.deadline))}` : t("obligations.none")}
            />
          </MetricRow>
        )}
      </Section>

      <Section title={t("advice.title")} description={t("advice.description")}>
        <div className="vck-card p-4 sm:p-5">
          {advice ? (
            <ol className="space-y-3">
              {advice.points.map((p, i) => (
                <li key={i} className="vck-inset px-4 py-3">
                  <p className="text-sm break-words">{p.text}</p>
                  <p className="vck-meta mt-1.5 break-words">
                    {t("advice.basedOn")} {p.facts.map((id) => advice.facts.find((f) => f.id === id)?.text).filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="vck-meta break-words">{t("advice.idle")}</p>
          )}
          {advise.error && (
            <p className="text-sm mt-3 break-words" role="alert" style={{ color: "var(--vc-negative, var(--destructive))" }}>
              {advise.error}
            </p>
          )}
          <button type="button" className="vck-btn vck-btn-primary mt-4 w-full sm:w-auto justify-center" onClick={writeAdvice} disabled={advise.busy}>
            {advise.busy ? t("advice.writing") : advice ? t("advice.again") : t("advice.write")}
          </button>
        </div>
      </Section>
    </PageShell>
  );
}

import { useState } from "react";
function useAdviceState() {
  return useState<Advice | null>(null);
}
