"use client";

/**
 * Everything waiting for a person, with the decision on the row itself.
 * Shared by Home and the Agents page so both always show the same queue.
 */

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useConsole } from "@/components/app/console/ConsoleData";
import { useWorkspaceAction } from "@/components/app/console/workspace-store";
import { relativeTime, type ConsoleTask } from "@/components/app/console/types";
import { IcoAlert, IcoCheck } from "@/components/app/console/icons";
import { ACCEPT, stashFiles } from "@/components/app/intake/pending-files";

const SHOWN = 5;

export function WaitingForYou({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("home.waiting");
  const locale = useLocale();
  const { data } = useConsole();
  const { run } = useWorkspaceAction();
  const [busy, setBusy] = useState<number | null>(null);
  const [failed, setFailed] = useState<{ id: number; message: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [uploadFor, setUploadFor] = useState<number | null>(null);

  // "Upload" opens the file picker here; the chosen files are read on Add data,
  // and the task closes once the document is kept.
  const pickFor = (taskId: number) => {
    setUploadFor(taskId);
    picker.current?.click();
  };

  const tasks = data?.tasks ?? [];
  const agentName = (key: string) => data?.agents.find((a) => a.key === key)?.name ?? key;
  const shown = showAll ? tasks : tasks.slice(0, SHOWN);

  const decide = async (task: ConsoleTask, decision: "approve" | "reject") => {
    setBusy(task.id);
    setFailed(null);
    const ok = await run<{ alreadyDecided?: boolean; deliverable?: { href: string; title: string } | null }>(`/api/console/tasks/${task.id}`, {
      body: { decision },
      invalidates: ["/api/console/agents", "/api/console/overview", "/api/console/reports"],
    });
    if (!ok) setFailed({ id: task.id, message: t("failed") });
    else if (ok.alreadyDecided && !ok.deliverable) toast.info(t("alreadyDecided"));
    else if (ok.deliverable && decision === "approve") {
      const { href, title } = ok.deliverable;
      toast.success(t("readyToast", { title }), {
        duration: 12000,
        action: { label: t("openShort"), onClick: () => router.push(href) },
      });
    }
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
            const fact = task.kind === "question" ? (task.pendingTool ?? "").replace("answer_fact:", "") : null;
            return (
              <li key={task.id} data-severity={task.severity}>
                <i aria-hidden="true">{task.severity === "high" ? <IcoAlert size={14} /> : <IcoCheck size={14} />}</i>
                <div className="vch-task-copy">
                  <strong>{fact && FACT_QUESTION[fact] ? FACT_QUESTION[fact][locale === "el" ? "el" : "en"] : task.title}</strong>
                  {task.detail && !compact && <p>{task.detail}</p>}
                  <small>
                    {t(fact ? "kindQuestion" : isEvidence ? "kindEvidence" : isException ? "kindException" : "kindApproval", { agent: agentName(task.agentKey) })}
                    {" · "}
                    {relativeTime(task.createdAt, locale)}
                  </small>
                  {task.deliverableHref && (
                    <Link href={task.deliverableHref} className="vch-link">{t("openDraft")}{task.deliverableTitle ? ` · ${task.deliverableTitle}` : ""}</Link>
                  )}
                  {failed?.id === task.id && <p className="vch-error" role="alert">{failed.message}</p>}
                </div>
                <div className="vch-task-actions">
                  {fact ? (
                    <FactAnswer fact={fact} disabled={busy !== null} onError={(m) => setFailed({ id: task.id, message: m })} />
                  ) : isEvidence ? (
                    <button type="button" className="vch-btn" data-kind="primary" disabled={busy !== null} onClick={() => pickFor(task.id)}>{t("upload")}</button>
                  ) : isException ? (
                    <Link href="/app/agents" className="vch-btn" data-kind="primary">{t("open")}</Link>
                  ) : (
                    <button type="button" className="vch-btn" data-kind="primary" disabled={busy !== null} onClick={() => void decide(task, "approve")}>
                      {busy === task.id ? t("saving") : actsOnApprove(task) ? t("approve") : t("markDone")}
                    </button>
                  )}
                  <button type="button" className="vch-btn" disabled={busy !== null} onClick={() => void decide(task, "reject")}>
                    {isEvidence || isException || fact ? t("dismiss") : t("decline")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <input
        ref={picker}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length === 0) return;
          stashFiles(files.map((file) => ({ file, taskId: uploadFor ?? undefined })));
          router.push("/app/calculator");
        }}
      />

      {tasks.length > SHOWN && (
        <button type="button" className="vch-link" onClick={() => setShowAll((v) => !v)}>
          {showAll ? t("showLess") : t("showAll", { count: tasks.length })}
        </button>
      )}
    </section>
  );
}

/**
 * Only some tasks carry an act: an agent's held tool call, a drafted document,
 * or a VSME draft request. The rest are reminders a person handles, so the
 * button says "Mark done" and never implies something will run.
 */
function actsOnApprove(task: ConsoleTask): boolean {
  return Boolean(task.pendingTool) || Boolean(task.deliverableHref) || /\bVSME\b/i.test(task.title);
}

const FACT_QUESTION: Record<string, { en: string; el: string }> = {
  employees: { en: "How many people work at the company?", el: "Πόσα άτομα εργάζονται στην εταιρεία;" },
  revenue: { en: "What was last year's revenue (EUR)?", el: "Ποιος ήταν ο περσινός κύκλος εργασιών (EUR);" },
  country: { en: "Which country is the company registered in?", el: "Σε ποια χώρα είναι εγγεγραμμένη η εταιρεία;" },
  sector: { en: "Which industry is the company in?", el: "Σε ποιον κλάδο δραστηριοποιείται η εταιρεία;" },
  company_age: { en: "When was the company registered?", el: "Πότε εγγράφηκε η εταιρεία;" },
  cbam_goods: { en: "Do you import steel, aluminium, cement, fertilisers, hydrogen or electricity from outside the EU?", el: "Εισάγετε χάλυβα, αλουμίνιο, τσιμέντο, λιπάσματα, υδρογόνο ή ηλεκτρική ενέργεια από χώρες εκτός ΕΕ;" },
  eudr_goods: { en: "Do you sell or export products made from cattle, cocoa, coffee, palm oil, rubber, soya or wood?", el: "Πουλάτε ή εξάγετε προϊόντα από βοοειδή, κακάο, καφέ, φοινικέλαιο, καουτσούκ, σόγια ή ξύλο;" },
  consumer_claims: { en: "Do you sell to consumers with environmental claims or labels (for example 'eco', 'green', 'carbon neutral')?", el: "Πουλάτε σε καταναλωτές με περιβαλλοντικούς ισχυρισμούς ή σήματα (π.χ. «οικολογικό», «πράσινο», «ουδέτερο ως προς τον άνθρακα»);" },
};

/** Yes/no deadline facts and the company field each answer saves to. */
const YES_NO: Record<string, string> = { cbam_goods: "importsCbamGoods", eudr_goods: "eudrCommodities", consumer_claims: "consumerClaims" };

const INDUSTRIES = ["technology", "retail", "manufacturing", "hospitality", "healthcare", "finance"] as const;

/** One-field answer that saves through the shared company record. */
function FactAnswer({ fact, disabled, onError }: { fact: string; disabled: boolean; onError: (m: string) => void }) {
  const t = useTranslations("home.waiting");
  const { run, busy } = useWorkspaceAction();
  const [value, setValue] = useState(fact === "country" ? "CY" : fact === "sector" ? "technology" : "");

  if (fact === "company_age") {
    return <Link href="/app/settings" className="vch-btn" data-kind="primary">{t("lookUpRegistry")}</Link>;
  }

  if (YES_NO[fact]) {
    const save = async (yes: boolean) => {
      const ok = await run("/api/console/company", { method: "PATCH", body: { [YES_NO[fact]]: yes }, invalidates: ["/api/console/company", "/api/console/obligations", "/api/console/overview"] });
      if (!ok) onError(t("failed"));
    };
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="vch-btn" data-kind="primary" disabled={disabled || busy} onClick={() => save(true)}>{t("yes")}</button>
        <button type="button" className="vch-btn" disabled={disabled || busy} onClick={() => save(false)}>{t("no")}</button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value.replace(/[\s,]/g, ""));
    let body: Record<string, unknown>;
    if (fact === "employees") {
      if (!Number.isInteger(n) || n < 1) return onError(t("answerInvalid"));
      body = { employees: n };
    } else if (fact === "revenue") {
      if (!Number.isFinite(n) || n < 0) return onError(t("answerInvalid"));
      body = { revenueEur: n };
    } else if (fact === "country") {
      const c = value.trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(c)) return onError(t("answerInvalid"));
      body = { country: c };
    } else {
      body = { industry: value };
    }
    const ok = await run("/api/console/company", { method: "PATCH", body, invalidates: ["/api/console/company", "/api/console/funding"] });
    if (!ok) onError(t("failed"));
  };

  const label = FACT_QUESTION[fact]?.en ?? fact;
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      {fact === "sector" ? (
        <select aria-label={label} className="vch-input" value={value} onChange={(e) => setValue(e.target.value)}>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{t(`industry.${i}`)}</option>)}
        </select>
      ) : (
        <input
          aria-label={label}
          className="vch-input w-32"
          inputMode={fact === "country" ? "text" : "numeric"}
          maxLength={fact === "country" ? 2 : 15}
          placeholder={fact === "country" ? "CY" : fact === "revenue" ? "250000" : "12"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      )}
      <button type="submit" className="vch-btn" data-kind="primary" disabled={disabled || busy}>
        {busy ? t("saving") : t("answer")}
      </button>
    </form>
  );
}
