"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import { FundingPanel } from "@/components/app/console/FundingPanel";
import { EuFeedPanel } from "@/components/app/console/EuFeedPanel";
import { ExpertsPanel } from "@/components/app/console/ExpertsPanel";
import { ProjectCard, useFormat } from "@/components/app/actions/ProjectCard";
import { STAGES, type Stage } from "@/lib/actions/catalog";
import type { ActionPlan, PlanProject } from "@/lib/actions/projects.server";
import { useUser } from "@/lib/user-context";
import { PageShell, PageHeader, PageToolbar, ToolbarTabs, Section, Metric, MetricRow, Empty } from "@/components/app/console/kit";

const PATH = "/api/console/actions";

export default function ActionsPage() {
  const t = useTranslations("dashboard.projects");
  const { eur, num } = useFormat();
  const { user } = useUser();
  const plan = useWorkspaceResource<ActionPlan>(PATH);
  const projects = useMemo(() => plan.data?.projects ?? [], [plan.data]);
  const counts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, projects.filter((p) => p.stage === s).length])) as Record<Stage, number>, [projects]);
  const [chosen, setChosen] = useState<Stage | null>(null);
  // Open on the stage that needs attention first, unless the person picked one.
  const tab: Stage = chosen ?? (counts.being_checked ? "being_checked" : counts.under_way ? "under_way" : counts.idea ? "idea" : counts.confirmed ? "confirmed" : "idea");
  const shown = projects.filter((p) => p.stage === tab);
  const totals = plan.data?.totals;
  const [dossierBusy, setDossierBusy] = useState(false);

  async function downloadDossier() {
    if (!plan.data) return;
    setDossierBusy(true);
    try {
      const { downloadReport } = await import("@/lib/pdf/report");
      const started = projects.filter((p) => p.id !== null);
      const sections = started.map((p: PlanProject) => {
        const f = p.figures;
        const figures = [
          f.costEur !== null && { label: "Quoted cost", value: eur(f.costEur), source: p.inputs.supplierName ?? "Supplier quote" },
          f.netCostEur !== null && { label: "Cost after funding", value: eur(f.netCostEur), source: "Quote less expected grant" },
          f.savedEurYr !== null && { label: "Saved a year", value: eur(f.savedEurYr), source: "Bills and inputs below" },
          f.co2KgYr !== null && { label: "CO2e cut a year", value: `${num(f.co2KgYr / 1000, 1)} t`, source: "Published factor below" },
          f.paybackYrs !== null && { label: "Payback", value: `${num(f.paybackYrs, 1)} years`, source: "Cost after funding ÷ yearly saving" },
          ...f.basis.map((b) => ({ label: b.label, value: b.value, source: b.source })),
          ...p.evidence.map((e) => ({ label: e.kind === "invoice" ? "Invoice" : "Bank payment", value: [e.quotes.date, e.quotes.amount].filter(Boolean).join(" · ") || "On file", source: e.fileName ?? e.quotes.supplier ?? "" })),
        ].filter(Boolean) as { label: string; value: string; source: string }[];
        const checks = p.checks.map((c) => `${c.kind === "purchase" ? "Proof of purchase" : "Lower bills after installation"}: ${c.status}${c.numbers?.dropPct !== undefined ? ` (${c.numbers.dropPct}% change in daily use)` : ""}.`);
        return {
          code: "",
          title: `${t(`types.${p.type}.title`)} · ${t(`stage.${p.stage}`)}`,
          body: [t(`types.${p.type}.body`), `Started ${p.startedOn ?? "—"}${p.installedOn ? `, installed ${p.installedOn}` : ""}${p.confirmedAt ? `, confirmed ${p.confirmedAt.slice(0, 10)}` : ""}.`, checks.join(" ")].join("\n\n"),
          figures,
          gaps: [
            ...f.missing.map((k) => `Missing: ${t(`inputs.${k}` as never)}`),
            ...p.checks.filter((c) => c.status !== "passed").map((c) => `${c.kind === "purchase" ? "Proof of purchase" : "Bill drop"} not yet passed`),
          ],
        };
      });
      await downloadReport(
        {
          title: "Decarbonisation action plan",
          framework: "Action plan",
          periodLabel: new Date().toISOString().slice(0, 10),
          status: projects.some((p) => p.stage === "confirmed") ? "in_progress" : "draft",
          workspaceName: user?.companyName || "Your company",
          agentName: null,
          summary: `${started.length} project${started.length === 1 ? "" : "s"} in the plan, ${counts.confirmed} confirmed by evidence. Figures come from the company's own bills, its supplier quotes and published factors; a figure that lacks an input is left out, never estimated.`,
          sections: sections.length ? sections : [{ code: "", title: "No projects started", body: "Start a project in Vuneli's Action plan to include it here.", figures: [], gaps: [] }],
        },
        `vuneli-action-plan-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setDossierBusy(false);
    }
  }

  const tonnes = (kg: number | null | undefined) => (kg != null ? num(kg / 1000, 1) : null);

  return (
    <PageShell
      loading={plan.loading && !plan.data}
      error={plan.error ? t("errors.load") : null}
      onRetry={plan.reload}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          actions={
            <button type="button" className="vck-btn" onClick={downloadDossier} disabled={dossierBusy || !totals?.counted}>
              {dossierBusy ? t("dossierBusy") : t("dossier")}
            </button>
          }
        />
      }
      toolbar={
        <PageToolbar>
          <ToolbarTabs
            options={STAGES.map((s) => ({ value: s, label: counts[s] ? `${t(`tabs.${s}`)} · ${counts[s]}` : t(`tabs.${s}`) }))}
            value={tab}
            onChange={(v) => setChosen(v as Stage)}
            ariaLabel={t("title")}
          />
        </PageToolbar>
      }
    >
      <Section title={t("summary.title")} description={t("summary.fromN", { count: totals?.counted ?? 0 })}>
        <MetricRow>
          <Metric label={t("summary.cost")} value={totals?.costEur != null ? eur(totals.costEur) : "—"} note={totals?.counted && totals.costEur == null ? t("summary.needsQuote") : undefined} />
          <Metric label={t("summary.net")} value={totals?.netCostEur != null ? eur(totals.netCostEur) : "—"} />
          <Metric label={t("summary.saved")} value={totals?.savedEurYr != null ? eur(totals.savedEurYr) : "—"} />
          <Metric
            label={t("summary.co2")}
            value={tonnes(totals?.co2KgYr) ?? "—"}
            unit={totals?.co2KgYr != null ? t("summary.tonnes") : undefined}
            note={totals?.confirmedCo2KgYr != null ? t("summary.confirmed", { value: tonnes(totals.confirmedCo2KgYr)! }) : undefined}
          />
          <Metric label={t("summary.payback")} value={totals?.paybackYrs != null ? num(totals.paybackYrs, 1) : "—"} unit={totals?.paybackYrs != null ? t("summary.years") : undefined} />
        </MetricRow>
      </Section>

      <Section>
        {shown.length === 0 ? (
          <Empty title={t(`tabs.${tab}`)} body={t(`empty.${tab}`)} action={tab === "idea" ? { label: t("empty.addData"), href: "/app/calculator" } : undefined} />
        ) : (
          <div className="flex flex-col gap-4">
            {shown.map((p) => (
              <ProjectCard key={`${p.type}-${p.id ?? "idea"}-${p.stage}`} p={p} onChanged={(next) => { setChosen(next ?? null); plan.reload(); }} />
            ))}
          </div>
        )}
      </Section>

      <FundingPanel />
      <EuFeedPanel source="ted" />
      <ExpertsPanel />
    </PageShell>
  );
}
