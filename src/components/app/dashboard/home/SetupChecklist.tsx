"use client";

/**
 * The setup checklist. Every step ticks itself from saved records, never from
 * a click, so "done" always means the data is really there. The card leaves
 * Home once every step is done.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ConsoleOverviewData } from "@/components/app/console/types";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import type { CompanyRecord } from "@/lib/company-update.server";
import { askVerde } from "@/components/app/console/ConsoleCopilot";
import { IcoCheck } from "@/components/app/console/icons";

interface SupplierList {
  suppliers?: unknown[];
}

type StepKey = "company" | "source" | "figures" | "suppliers" | "agent";

const HREF: Record<StepKey, string> = {
  company: "/app/settings",
  source: "/app/integrations",
  figures: "/app/calculator",
  suppliers: "/app/suppliers",
  agent: "/app/agents",
};

export function useSetupSteps(data: ConsoleOverviewData) {
  const company = useWorkspaceResource<CompanyRecord>("/api/console/company");
  const suppliers = useWorkspaceResource<SupplierList>("/api/console/suppliers");
  const c = company.data;
  const done: Record<StepKey, boolean | null> = {
    company: c ? Boolean(c.companyName && c.industry && c.teamSize) : null,
    source: data.connections.some((x) => x.status === "live" || x.status === "syncing"),
    figures: data.metrics.some((m) => m.key === "co2e_total" && m.points.length > 0),
    suppliers: suppliers.data ? (suppliers.data.suppliers?.length ?? 0) > 0 : null,
    agent: data.runs.length > 0,
  };
  const keys = Object.keys(done) as StepKey[];
  const known = keys.every((k) => done[k] !== null);
  const remaining = keys.filter((k) => done[k] === false).length;
  return { done, keys, known, remaining, total: keys.length };
}

export function SetupChecklist({ data }: { data: ConsoleOverviewData }) {
  const t = useTranslations("home.setup");
  const { done, keys, known, remaining, total } = useSetupSteps(data);
  if (!known || remaining === 0) return null;
  const next = keys.find((k) => done[k] === false);

  return (
    <section className="vch-setup" data-tour="setup" aria-labelledby="vch-setup-title">
      <header>
        <div>
          <h2 id="vch-setup-title">{t("title")}</h2>
          <p>{t("lead", { done: total - remaining, total })}</p>
        </div>
        <div className="vch-setup-meter" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={total - remaining} aria-label={t("progress")}>
          <span style={{ width: `${((total - remaining) / total) * 100}%` }} />
        </div>
      </header>
      <ol>
        {keys.map((key) => {
          const isDone = done[key] === true;
          return (
            <li key={key} data-done={isDone} data-next={key === next}>
              <span className="vch-setup-tick" aria-hidden="true">{isDone ? <IcoCheck size={12} /> : null}</span>
              <div className="vch-setup-copy">
                <strong>{t(`${key}.title`)}</strong>
                <p>{isDone ? t("doneNote") : t(`${key}.why`)}</p>
              </div>
              {!isDone && (
                <div className="vch-setup-actions">
                  <Link href={HREF[key] as never} className="vch-btn" data-kind={key === next ? "primary" : undefined}>
                    {t(`${key}.cta`)}
                  </Link>
                  <button type="button" className="vch-btn" data-kind="ghost" onClick={() => askVerde(t(`${key}.verde`))}>
                    {t("askVerde")}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
