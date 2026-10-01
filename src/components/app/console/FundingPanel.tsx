"use client";

import { useLocale, useTranslations } from "next-intl";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { Section, Empty } from "@/components/app/console/kit";

const PATH = "/api/grant-alerts/subscribe";
const SOURCE_KEYS = ["eu-funding-tenders", "research-gov-cy", "invest-cyprus", "kebe-oeb", "accelerators"] as const;

const MATCHES = "/api/console/funding";

interface Check { rule: string; text: string; textEl: string; quote: string | null }
interface Match {
  id: number;
  source: string;
  title: string;
  titleTranslated: string | null;
  url: string;
  program: string | null;
  deadline: string | null;
  verdict: "strong" | "needs_info";
  met: Check[];
  missing: Check[];
  requiredDocuments: string[];
}
interface Matches { calls: Match[]; reviewed: number; checkedAt: string | null }

interface Feed {
  subscription?: { email: string; active: boolean } | null;
}

function daysUntil(iso: string, today: string): number {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

/**
 * Funding calls Grant scout matched to this company: strong fits first, then
 * calls one answer away. Everything else stays hidden on purpose.
 */
export function FundingPanel() {
  const t = useTranslations("dashboard.grantAlerts");
  const locale = useLocale() === "el" ? "el-CY" : "en-GB";
  const feed = useWorkspaceResource<Feed>(PATH);
  const matches = useWorkspaceResource<Matches>(MATCHES);
  const action = useWorkspaceAction();
  const el = useLocale() === "el";
  const today = new Date().toISOString().slice(0, 10);
  const open = matches.data?.calls ?? [];
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

      {matches.loading ? (
        <div className="vck-card p-4"><p className="vck-meta">…</p></div>
      ) : matches.error ? (
        <Empty tone="warn" title={matches.error} action={{ label: "Retry", onClick: matches.reload }} />
      ) : open.length === 0 ? (
        <Empty title={t("noFitTitle")} body={`${t("noFitBody")}${matches.data?.reviewed ? ` ${t("checked", { count: matches.data.reviewed })}.` : ""}`} />
      ) : (
        <ul className="vck-card divide-y divide-[var(--vc-rule)]">
          {open.map((m) => {
            const d = m.deadline ? daysUntil(m.deadline.slice(0, 10), today) : null;
            const title = el && m.titleTranslated ? m.titleTranslated : m.title;
            return (
              <li key={m.id} className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <span className={`vck-meta inline-block rounded-full border px-2 py-0.5 ${m.verdict === "strong" ? "border-[var(--vc-ink)]" : "border-[var(--vc-rule)]"}`}>
                      {t(m.verdict === "strong" ? "strong" : "needsInfo")}
                    </span>
                    <a href={m.url} target="_blank" rel="noreferrer" lang={el && m.titleTranslated ? "el" : "en"} className="mt-1.5 block font-medium leading-snug break-words hover:underline">
                      {title}
                    </a>
                    <p className="vck-meta mt-1 break-words">
                      {sourceLabel(m.source)}
                      {m.program ? ` · ${m.program}` : ""}
                      {el && m.titleTranslated ? ` · ${t("autoTranslated")}` : ""}
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
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="vck-meta font-medium">{t("why")}</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {m.met.map((c) => (
                        <li key={c.rule} className="break-words" title={c.quote ? `${t("quote")}: “${c.quote}”` : undefined}>
                          {el ? c.textEl : c.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(m.missing.length > 0 || m.requiredDocuments.length > 0) && (
                    <div className="min-w-0">
                      {m.missing.length > 0 && (
                        <>
                          <p className="vck-meta font-medium">{t("toConfirm")}</p>
                          <ul className="mt-1 space-y-1 text-sm">
                            {m.missing.map((c) => <li key={c.rule} className="break-words">{el ? c.textEl : c.text}</li>)}
                          </ul>
                          <p className="vck-meta mt-1">{t("answerIn")}</p>
                        </>
                      )}
                      {m.requiredDocuments.length > 0 && (
                        <>
                          <p className="vck-meta mt-2 font-medium">{t("docs")}</p>
                          <p className="text-sm break-words">{m.requiredDocuments.join(" · ")}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
