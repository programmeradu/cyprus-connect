"use client";

/**
 * Vuneli Home: "what needs me today".
 *
 * One calm screen. The hero keeps the console look (company card, greeting,
 * one footprint chart). Below it: the setup checklist until setup is done,
 * the approval queue, the next deadline, then three short summaries that each
 * open the page owning those records. Metric switching, filters and the
 * evidence/connection/audit tables live on Measure, Connect and Agents.
 * Every figure is read from /api/console/overview; nothing is written by hand.
 */

import { CompanyLogo } from "@/components/app/console/CompanyLogo";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useConsole } from "@/components/app/console/ConsoleData";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import type { CompanyRecord } from "@/app/api/console/company/route";
import { SignalChart } from "@/components/app/console/SignalChart";
import { fmtNumber, fmtSigned, toneFor } from "@/components/app/console/types";
import { greetingFor, titleCase } from "@/components/app/dashboard/overview/shared";
import { boardSummaryTable, exportFileName } from "@/components/app/console/export-csv";
import { WaitingForYou } from "@/components/app/dashboard/home/WaitingForYou";
import { SetupChecklist } from "@/components/app/dashboard/home/SetupChecklist";
import { FirstVisitTour } from "@/components/app/dashboard/home/FirstVisitTour";
import { AgentsDidPlate, MoneyPlate, NextDeadlinePlate, WhatChangedPlate } from "@/components/app/dashboard/home/HomePlates";

export default function ConsolePage() {
  const t = useTranslations("home");
  const { data, error, refresh } = useConsole();
  const [pdfBusy, setPdfBusy] = useState(false);
  const company = useWorkspaceResource<CompanyRecord>("/api/console/company");

  /* Home shows one series: the total footprint. Other metrics live on Measure. */
  const focus = useMemo(() => {
    const metrics = data?.metrics ?? [];
    return metrics.find((m) => m.key === "co2e_total" && m.points.length > 0) ?? metrics.find((m) => m.points.length > 0) ?? null;
  }, [data]);

  if (error) {
    return (
      <div className="vc vc-fit">
        <div className="vc-window vc-state">
          <p>{t("errorTitle")}</p>
          <span>{error}</span>
          <button type="button" className="vc-add-agent" onClick={refresh}>
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="vc vc-fit">
        <div className="vc-window vc-loading" aria-label={t("loading")}>
          <div className="vc-loading-hero">
            <aside />
            <main>
              <span />
              <strong />
              <em />
            </main>
          </div>
          <div className="vc-loading-deck">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  const { workspace, agents, runs, tasks, metrics } = data;
  const hour = new Date().getHours();
  const activeAgents = agents.filter((a) => a.status === "active");
  const runsToday = runs.filter((r) => Date.now() - new Date(r.startedAt).getTime() < 86_400_000);
  const coverage = metrics.find((m) => m.key === "data_coverage" && m.points.length > 0);
  const hasComparison = focus ? focus.points.length >= 2 && focus.previous !== 0 : false;
  const focusTone = focus ? toneFor(focus.delta, focus.goodDirection) : "flat";
  const lastPoint = focus?.points[focus.points.length - 1];

  const exportSummary = async () => {
    setPdfBusy(true);
    try {
      const { buildSectionPdf } = await import("@/lib/pdf/console-section-pdf");
      const doc = buildSectionPdf({
        workspaceName: workspace.name || "Workspace",
        sectionLabel: "Board summary",
        filterLabel: "All periods and sites",
        table: boardSummaryTable(data),
      });
      doc.save(exportFileName(data, "overview", "pdf", "-board-summary"));
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="vc vc-fit">
      <FirstVisitTour workspaceId={workspace.id} />
      <section className="vc-window vch-home" aria-label={t("aria")}>
        <div className="vc-top-panel">
          <div className="vc-hero-grid vch-hero-grid">
            <aside className="vc-team-card vch-team-card">
              <div className="vc-owner-row">
                <span className="vc-owner-avatar">
                  <CompanyLogo name={workspace.name ?? "Vuneli"} domain={company.data?.logoDomain} size={30} />
                </span>
                <span>
                  <small>
                    {[titleCase(workspace.sector), workspace.country, t("sites", { count: workspace.sites })]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                  <strong>{workspace.legalName ?? workspace.name}</strong>
                </span>
              </div>

              <div className="vc-big-number">
                <span>{activeAgents.length}</span>
                <small>{t("agentsActive", { total: agents.length })}</small>
              </div>

              <div className="vc-legend">
                <p>
                  <i data-tone="lime" /> <span>{t("decisions")}</span> <strong>{tasks.length}</strong>
                </p>
                <p>
                  <i /> <span>{t("runsToday")}</span> <strong>{runsToday.length}</strong>
                </p>
              </div>

              <div className="vch-health">
                <span>{t("health.title")}</span>
                <p>
                  {coverage
                    ? t("health.value", { pct: Math.round(coverage.current) })
                    : t("health.none")}
                </p>
                <Link href="/app/integrations" className="vch-link">
                  {coverage && coverage.current >= 90 ? t("health.manage") : t("health.fix")}
                </Link>
              </div>

              <Link href={"/app/agents" as never} className="vc-add-agent" aria-label={t("workforceAria")}>
                <span className="vc-add-agent-dot" aria-hidden="true" />
                <span className="vc-add-agent-label">{t("workforce")}</span>
                <svg className="vc-add-agent-arrow" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 8h8M8 4.5 11.5 8 8 11.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </aside>

            <main className="vc-chart-zone" data-tour="footprint">
              <div className="vc-greeting">
                <div>
                  <h1>
                    {greetingFor(hour)}, {workspace.ownerName ?? t("there")}
                  </h1>
                  <p>{tasks.length === 0 ? t("nothingWaiting") : t("itemsWaiting", { count: tasks.length })}</p>
                </div>
                <button type="button" className="vch-btn vch-summary-btn" onClick={() => void exportSummary()} disabled={pdfBusy}>
                  {pdfBusy ? t("preparing") : t("boardSummary")}
                </button>
              </div>

              {focus ? (
                <>
                  <div className="vc-focus-row">
                    <div>
                      <small>
                        {focus.key === "co2e_total" ? t("footprint") : focus.label}
                        {lastPoint ? ` · ${lastPoint.label}` : ""}
                      </small>
                      <strong>
                        {fmtNumber(focus.current, focus.precision)} <em>{focus.unit}</em>
                      </strong>
                    </div>
                    <span className="vch-focus-side">
                      {hasComparison ? (
                        <span data-tone={focusTone}>{t("vsLast", { delta: fmtSigned(focus.delta) })}</span>
                      ) : (
                        <span data-tone="flat">{t("noComparison")}</span>
                      )}
                      <Link href="/app/analytics" className="vch-link">
                        {t("openMeasure")}
                      </Link>
                    </span>
                  </div>
                  <SignalChart metric={focus} />
                </>
              ) : (
                <div className="vch-hero-empty">
                  <strong>{t("emptyTitle")}</strong>
                  <p>{t("emptyBody")}</p>
                </div>
              )}
            </main>
          </div>
        </div>

        <div className="vc-deck vch-deck">
          <SetupChecklist data={data} />

          <div className="vch-grid-primary">
            <WaitingForYou />
            <NextDeadlinePlate data={data} />
          </div>

          <div className="vch-grid-secondary">
            <WhatChangedPlate data={data} />
            <AgentsDidPlate data={data} />
            <MoneyPlate />
          </div>
        </div>
      </section>
    </div>
  );
}
