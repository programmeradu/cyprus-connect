"use client";

/**
 * Monthly footprint. One form, one save.
 *
 * The server works out the footprint with the company's own country and
 * writes it into the shared workspace (emissions, dashboard figures, activity),
 * so the dashboard, actions, Report Visuals and agents all see the new month.
 */

import { Fragment, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { DocumentIntake } from "@/components/app/intake/DocumentIntake";
import { InboxAddress } from "@/components/app/intake/InboxAddress";
import { YearStrip } from "@/components/app/intake/YearStrip";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { PageShell, PageHeader, DataTable, Metric, MetricRow, Empty } from "@/components/app/console/kit";
import { FOOTPRINT_KEYS, isFutureMonth, previousMonth, type FootprintKey, type FootprintLine } from "@/lib/emissions/footprint";

const PATH = "/api/console/emissions";

interface RecordedMonth {
  year: number;
  month: number;
  electricity: number;
  gas: number;
  water: number;
  waste: number;
  transport: number;
  totalTonnes: number;
}

interface SavedFootprint {
  year: number;
  month: number;
  region: string;
  replaced: boolean;
  previousTonnes: number | null;
  trendPercent: number | null;
  totalTonnes: number;
  scopes: { scope1: number; scope2: number; scope3: number };
  lines: FootprintLine[];
  basis: "climatiq" | "reference" | "mixed";
}

type Amounts = Record<FootprintKey, string>;
const EMPTY: Amounts = { electricity: "", gas: "", water: "", waste: "", transport: "" };

function defaultPeriod() {
  const now = new Date();
  // Bills arrive after the month ends, so the last full month is the usual case.
  return previousMonth(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

function toNumber(v: string): number {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function CalculatorPage() {
  const t = useTranslations("dashboard.calculator");
  const ti = useTranslations("dashboard.intake");
  const locale = useLocale();
  const history = useWorkspaceResource<{ months: RecordedMonth[]; country: string }>(PATH);
  const save = useWorkspaceAction();

  const [period, setPeriod] = useState(defaultPeriod);
  const [amounts, setAmounts] = useState<Amounts>(EMPTY);
  const [result, setResult] = useState<SavedFootprint | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const formRef = useRef<HTMLElement>(null);
  const toForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const monthName = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "el" ? "el-CY" : "en-GB", { month: "long", timeZone: "UTC" });
    return (m: number) => fmt.format(new Date(Date.UTC(2020, m - 1, 1)));
  }, [locale]);
  const periodLabel = (y: number, m: number) => `${monthName(m)} ${y}`;
  const number = useMemo(() => new Intl.NumberFormat(locale === "el" ? "el-CY" : "en-GB", { maximumFractionDigits: 3 }), [locale]);
  const tonnes = (v: number) => number.format(Math.round(v * 1000) / 1000);

  const months = history.data?.months ?? [];
  const country = history.data?.country ?? "CY";
  const existing = months.find((m) => m.year === period.year && m.month === period.month);
  const hasValue = FOOTPRINT_KEYS.some((k) => toNumber(amounts[k]) > 0);
  const nowYear = new Date().getUTCFullYear();
  const years = [nowYear, nowYear - 1, nowYear - 2, nowYear - 3];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValue || save.busy) return;
    const body = { year: period.year, month: period.month, ...Object.fromEntries(FOOTPRINT_KEYS.map((k) => [k, toNumber(amounts[k])])) };
    const saved = await save.run<SavedFootprint>(PATH, {
      body,
      invalidates: [PATH, "/api/console/insights", "/api/emissions", "/api/dashboard", "/api/analytics", "/api/actions", "/api/studio"],
    });
    if (saved) {
      setResult(saved);
      setAmounts(EMPTY);
      toast.success(t("toasts.saved", { period: periodLabel(saved.year, saved.month) }));
      toForm();
    }
  };

  const edit = (m: RecordedMonth) => {
    setResult(null);
    setPeriod({ year: m.year, month: m.month });
    setAmounts(Object.fromEntries(FOOTPRINT_KEYS.map((k) => [k, m[k] > 0 ? String(m[k]) : ""])) as Amounts);
    toForm();
  };

  const pick = (year: number, month: number) => {
    const m = months.find((x) => x.year === year && x.month === month);
    if (m) return edit(m);
    setResult(null);
    setPeriod({ year, month });
    setAmounts(EMPTY);
    toForm();
  };

  const change = (row: RecordedMonth) => {
    const p = previousMonth(row.year, row.month);
    const before = months.find((m) => m.year === p.year && m.month === p.month);
    if (!before || before.totalTonnes <= 0) return "—";
    const pct = ((row.totalTonnes - before.totalTonnes) / before.totalTonnes) * 100;
    return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
  };

  return (
    <PageShell header={<PageHeader title={t("title")} purpose={t("subtitle")} />}>
      <div className="vck-adddata">
        <section className="vck-adddata-main" aria-label={ti("drop.title")}>
          <DocumentIntake />
        </section>
        <aside className="vck-adddata-side">
          <InboxAddress />
          <YearStrip months={months} selected={period} onPick={pick} />
          <div className="vck-accepts">
            <p className="vck-strip-title">{ti("accept.title")}</p>
            <ul>
              {(["eac_bill", "water_bill", "utility_invoice", "waste_invoice", "bank_statement", "consumption_sheet"] as const).map((k) => (
                <li key={k}>{ti(`kinds.${k}`)}</li>
              ))}
            </ul>
            <p className="vck-meta">{ti("accept.not")}</p>
          </div>
        </aside>
      </div>

      <section ref={formRef} className="vck-manual" aria-labelledby="vck-manual-title">
        <div className="vck-manual-head">
          <div className="min-w-0">
            <h2 id="vck-manual-title">{result ? t("result.title", { period: periodLabel(result.year, result.month) }) : ti("manualTitle")}</h2>
            <p className="vck-meta">{result ? (result.replaced ? t("result.replaced") : null) : t("form.description")}</p>
          </div>
          <span className="vck-tag">{t("form.region", { country })}</span>
        </div>

      {result && (
        <div className="vck-manual-body">
          <MetricRow>
            <Metric
              label={t("result.total")}
              value={tonnes(result.totalTonnes)}
              unit={t("result.unit")}
              delta={result.trendPercent === null ? undefined : `${result.trendPercent > 0 ? "+" : ""}${result.trendPercent.toFixed(1)}%`}
              deltaTone={result.trendPercent === null ? undefined : result.trendPercent > 0 ? "negative" : result.trendPercent < 0 ? "positive" : "neutral"}
              note={
                result.trendPercent === null
                  ? t("result.noPrevious")
                  : t("result.vsPrevious", { period: periodLabel(previousMonth(result.year, result.month).year, previousMonth(result.year, result.month).month) })
              }
            />
            <Metric label={t("result.scope1")} value={tonnes(result.scopes.scope1)} unit={t("result.unit")} />
            <Metric label={t("result.scope2")} value={tonnes(result.scopes.scope2)} unit={t("result.unit")} />
            <Metric label={t("result.scope3")} value={tonnes(result.scopes.scope3)} unit={t("result.unit")} />
          </MetricRow>

          <p className="vck-meta mt-4 break-words">
            {result.basis === "climatiq"
              ? t("result.basisLive", { country: result.region })
              : result.basis === "mixed"
                ? t("result.basisMixed", { country: result.region })
                : t("result.basisReference")}
          </p>

          <div className="mt-4">
            <DataTable
              columns={[
                { key: "line", header: t("result.line"), render: (l) => <span className="break-words">{t(`fields.${l.key}`)}</span> },
                { key: "amount", header: t("result.amount"), numeric: true, render: (l) => `${number.format(l.value)} ${t(`units.${l.key}`)}` },
                { key: "emissions", header: t("result.emissions"), numeric: true, render: (l) => `${tonnes(l.tonnes)} t` },
                { key: "source", header: t("result.source"), hideOnMobile: true, render: (l) => <span className="vck-meta break-words">{l.source}</span> },
              ]}
              rows={result.lines}
              rowKey={(l) => l.key}
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link href="/app/actions" className="vck-btn vck-btn-primary justify-center">
              {t("result.actions")}
            </Link>
            <button type="button" className="vck-btn justify-center" onClick={() => setResult(null)}>
              {t("result.another")}
            </button>
          </div>
        </div>
      )}

      {!result && (
          <form onSubmit={submit} className="vck-manual-body" noValidate>
            <div className="vck-manual-period">
              <label className="block min-w-0">
                <span className="vck-label block mb-1.5">{t("form.month")}</span>
                <select
                  value={period.month}
                  onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-md text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} disabled={isFutureMonth(period.year, m)}>
                      {monthName(m)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0">
                <span className="vck-label block mb-1.5">{t("form.year")}</span>
                <select
                  value={period.year}
                  onChange={(e) => {
                    const year = Number(e.target.value);
                    setPeriod((p) => (isFutureMonth(year, p.month) ? defaultPeriod() : { ...p, year }));
                  }}
                  className="w-full px-3 py-2.5 rounded-md text-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="vck-manual-fields">
              {FOOTPRINT_KEYS.map((k) => (
                <label key={k} className="block min-w-0">
                  <span className="vck-label block mb-1.5">{t(`fields.${k}`)}</span>
                  <div className="vck-manual-input">
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={amounts[k]}
                      onChange={(e) => setAmounts((a) => ({ ...a, [k]: e.target.value.replace(/[^\d.,]/g, "").slice(0, 12) }))}
                      placeholder="0"
                      aria-describedby={`unit-${k}`}
                    />
                    <span id={`unit-${k}`}>
                      {t(`units.${k}`)}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {save.error && (
              <p className="text-sm mb-4 break-words" role="alert" style={{ color: "var(--vc-negative, var(--destructive))" }}>
                {save.error}
              </p>
            )}

            <div className="vck-manual-foot">
              <p className="vck-meta" role="status">
                {existing
                  ? t("form.replaceNotice", { period: periodLabel(existing.year, existing.month) })
                  : !hasValue
                    ? t("form.needValue")
                    : null}
              </p>
              <button type="submit" className="vck-btn vck-btn-primary" disabled={!hasValue || save.busy}>
                {save.busy ? t("form.saving") : t("form.save")}
              </button>
            </div>
          </form>
      )}
      </section>

      <section id="recorded-months" className="vck-months" aria-labelledby="vck-months-title">
        <div className="vck-manual-head">
          <div className="min-w-0">
            <h2 id="vck-months-title">{t("history.title")}</h2>
            {months.length > 0 && <p className="vck-meta">{t("history.description")}</p>}
          </div>
        </div>
        {history.loading ? (
          <p className="vck-meta">…</p>
        ) : history.error ? (
          <p className="vck-meta break-words" role="alert">
            {history.error}{" "}
            <button type="button" className="underline" onClick={history.reload}>
              ↻
            </button>
          </p>
        ) : months.length === 0 ? (
          <Empty title={t("history.emptyTitle")} body={t("history.emptyBody")} />
        ) : (
          <table className="vck-months-table">
            <thead>
              <tr>
                <th scope="col">{t("history.month")}</th>
                <th scope="col" className="num">{t("history.total")}</th>
                <th scope="col" className="num vck-hide-sm">{t("history.change")}</th>
                <th scope="col"><span className="sr-only">{t("history.edit")}</span></th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const id = `${m.year}-${m.month}`;
                const expanded = open === id;
                return (
                  <Fragment key={id}>
                    <tr data-open={expanded || undefined}>
                      <th scope="row">
                        <button type="button" className="vck-months-toggle" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : id)}>
                          <span aria-hidden="true">{expanded ? "−" : "+"}</span> {periodLabel(m.year, m.month)}
                        </button>
                      </th>
                      <td className="num">{tonnes(m.totalTonnes)} t</td>
                      <td className="num vck-hide-sm">{change(m)}</td>
                      <td className="act">
                        <button type="button" className="vck-btn" onClick={() => edit(m)}>
                          {t("history.edit")}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="vck-months-detail">
                        <td colSpan={4}>
                          <dl>
                            {FOOTPRINT_KEYS.map((k) => (
                              <div key={k}>
                                <dt>{t(`fields.${k}`)}</dt>
                                <dd>{m[k] > 0 ? `${number.format(m[k])} ${t(`units.${k}`)}` : "—"}</dd>
                              </div>
                            ))}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

    </PageShell>
  );
}
