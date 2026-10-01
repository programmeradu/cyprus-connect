"use client";

/**
 * Everything waiting for a person, with the decision on the row itself.
 * Shared by Home and the Agents page so both always show the same queue.
 */

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useConsole } from "@/components/app/console/ConsoleData";
import { useWorkspaceAction } from "@/components/app/console/workspace-store";
import { relativeTime, type ConsoleTask } from "@/components/app/console/types";
import { IcoAlert, IcoCheck } from "@/components/app/console/icons";

const SHOWN = 5;

export function WaitingForYou({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("home.waiting");
  const locale = useLocale();
  const { data } = useConsole();
  const { run } = useWorkspaceAction();
  const [busy, setBusy] = useState<number | null>(null);
  const [failed, setFailed] = useState<{ id: number; message: string } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const tasks = data?.tasks ?? [];
  const agentName = (key: string) => data?.agents.find((a) => a.key === key)?.name ?? key;
  const shown = showAll ? tasks : tasks.slice(0, SHOWN);

  const decide = async (task: ConsoleTask, decision: "approve" | "reject") => {
    setBusy(task.id);
    setFailed(null);
    const ok = await run(`/api/console/tasks/${task.id}`, { body: { decision }, invalidates: ["/api/console/agents"] });
    if (!ok) setFailed({ id: task.id, message: t("failed") });
    setBusy(null);
  };

  return (
    <section className="vc-plate vch-waiting" data-tour="waiting" aria-labelledby="vch-waiting-title">
      <header>
        <span id="vch-waiting-title">{t("title")}</span>
        <strong>{tasks.length === 0 ? t("clear") : t("count", { count: tasks.length })}</strong>
      </header>

      {tasks.length === 0 ? (
        <p className="vch-empty">{t("empty")}</p>
      ) : (
        <ul className="vch-task-list">
          {shown.map((task) => {
            const isEvidence = task.kind === "evidence";
            const isException = task.kind === "exception";
            return (
              <li key={task.id} data-severity={task.severity}>
                <i aria-hidden="true">{task.severity === "high" ? <IcoAlert size={14} /> : <IcoCheck size={14} />}</i>
                <div className="vch-task-copy">
                  <strong>{task.title}</strong>
                  {task.detail && !compact && <p>{task.detail}</p>}
                  <small>
                    {t(isEvidence ? "kindEvidence" : isException ? "kindException" : "kindApproval", { agent: agentName(task.agentKey) })}
                    {" · "}
                    {relativeTime(task.createdAt, locale)}
                  </small>
                  {failed?.id === task.id && <p className="vch-error" role="alert">{failed.message}</p>}
                </div>
                <div className="vch-task-actions">
                  {isEvidence ? (
                    <Link href="/app/integrations" className="vch-btn" data-kind="primary">{t("upload")}</Link>
                  ) : isException ? (
                    <Link href="/app/agents" className="vch-btn" data-kind="primary">{t("open")}</Link>
                  ) : (
                    <button type="button" className="vch-btn" data-kind="primary" disabled={busy !== null} onClick={() => void decide(task, "approve")}>
                      {busy === task.id ? t("saving") : t("approve")}
                    </button>
                  )}
                  <button type="button" className="vch-btn" disabled={busy !== null} onClick={() => void decide(task, "reject")}>
                    {isEvidence || isException ? t("dismiss") : t("decline")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {tasks.length > SHOWN && (
        <button type="button" className="vch-link" onClick={() => setShowAll((v) => !v)}>
          {showAll ? t("showLess") : t("showAll", { count: tasks.length })}
        </button>
      )}
    </section>
  );
}
