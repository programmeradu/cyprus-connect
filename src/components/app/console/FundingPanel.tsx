"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { Section, Empty } from "@/components/app/console/kit";

const PATH = "/api/grant-alerts/subscribe";
const SOURCE_KEYS = ["eu-funding-tenders", "research-gov-cy", "invest-cyprus", "kebe-oeb", "accelerators"] as const;
const FIRST = 6;

interface Match {
  id: number;
  source: string;
  title: string;
  url: string;
  program: string | null;
  deadline: string | null;
}

interface Feed {
  matches?: Match[];
  subscription?: { email: string; active: boolean } | null;
}

function daysUntil(iso: string, today: string): number {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

/**
 * Open funding calls from the hourly scan, shown inside the Action plan so a
 * company sees what could pay for a step next to the step itself. Calls whose
 * deadline has passed are hidden; the soonest deadline comes first.
 */
export function FundingPanel() {
  const t = useTranslations("dashboard.grantAlerts");
  const locale = useLocale() === "el" ? "el-CY" : "en-GB";
  const feed = useWorkspaceResource<Feed>(PATH);
  const action = useWorkspaceAction();
  const [showAll, setShowAll] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const open = useMemo(() => {
    const rows = (feed.data?.matches ?? []).filter((m) => !m.deadline || m.deadline.slice(0, 10) >= today);
    return rows.sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  }, [feed.data, today]);
  const shown = showAll ? open : open.slice(0, FIRST);
  const sub = feed.data?.subscription ?? null;
  const sourceLabel = (s: string) => ((SOURCE_KEYS as readonly string[]).includes(s) ? t(`sources.${s}`) : s);

  async function toggle() {
    if (!sub) return;
    await action.run(PATH, sub.active ? { method: "DELETE", invalidates: [PATH] } : { method: "POST", body: {}, invalidates: [PATH] });
  }

  return (
    <Section id="funding" title={t("panelTitle")} description={t("panelBody")}>
      <div className="vck-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="vck-meta min-w-0 break-words" role="status">
          {action.error ?? (sub ? t(sub.active ? "alertsOn" : "alertsOff", { email: sub.email }) : t("signIn"))}
        </p>
        {sub && (
          <button type="button" onClick={toggle} disabled={action.busy} className={`vck-btn shrink-0 ${sub.active ? "" : "vck-btn-primary"}`}>
            {t(sub.active ? "turnOff" : "turnOn")}
          </button>
        )}
      </div>

      {feed.loading ? (
        <div className="vck-card p-4"><p className="vck-meta">…</p></div>
      ) : feed.error ? (
        <Empty tone="warn" title={feed.error} action={{ label: "Retry", onClick: feed.reload }} />
      ) : open.length === 0 ? (
        <Empty title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <>
          <ul className="vck-card divide-y divide-[var(--vc-rule)]">
            {shown.map((m) => {
              const d = m.deadline ? daysUntil(m.deadline.slice(0, 10), today) : null;
              return (
                <li key={m.id} className="flex flex-col gap-1.5 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <a href={m.url} target="_blank" rel="noreferrer" className="font-medium leading-snug break-words hover:underline">
                      {m.title}
                    </a>
                    <p className="vck-meta mt-1 break-words">
                      {sourceLabel(m.source)}
                      {m.program ? ` · ${m.program}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    {m.deadline ? (
                      <>
                        <p className="vck-num text-sm">
                          {new Date(m.deadline).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className={`vck-meta ${d !== null && d <= 14 ? "text-[var(--vc-warn,inherit)]" : ""}`}>
                          {d === 0 ? t("closesToday") : t("daysLeft", { days: d ?? 0 })}
                        </p>
                      </>
                    ) : (
                      <p className="vck-meta">{t("noDeadline")}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {open.length > FIRST && (
            <button type="button" className="vck-btn mt-3" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
              {showAll ? t("showFewer") : t("showAll", { count: open.length })}
            </button>
          )}
        </>
      )}
    </Section>
  );
}
