"use client";

/**
 * Agents. Run or pause each agent, and open any run to see every step it
 * took: what it read, what it wrote, what it asked you to approve, and what
 * policy blocked. Every row comes from the step ledger; nothing is invented.
 */

import { Fragment, useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Btn, ConsolePage, Empty, Plate, State } from "@/components/app/console/kit";
import { invalidateWorkspace, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
import {
  decisionLabel,
  riskLabel,
  runStatusLabel,
  summarizeOutput,
  toolLabel,
  triggerLabel,
} from "@/lib/agents/step-labels";

interface RosterAgent { key: string; name: string; role: string; mission: string; cadence: string }
interface Run {
  id: number;
  agentKey: string;
  status: string;
  trigger: string;
  summary: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
  itemsProcessed: number;
  sample: boolean;
  steps: { total: number; waiting: number; blocked: number; failed: number };
}
interface Step {
  id: number;
  seq: number;
  tool: string;
  riskLevel: number;
  decision: string;
  inputHash: string;
  input: string;
  output: string | null;
  createdAt: string;
}
interface Data {
  roster: RosterAgent[];
  runs: Run[];
  controls: {
    paused: boolean;
    pauseReason: string | null;
    agentPaused: Record<string, { paused: boolean; reason: string | null; by: string | null; at: string }>;
    runnable: string[];
    planners?: string[];
    maxStepsPerRun: number;
  };
}

const duration = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

const HISTORY = "/api/console/agents/history";
/** Everything an agent run or switch can change. */
const AGENT_DATA = ["/api/console/agents", "/api/console/cbam"];

export default function AgentsPage() {
  const tr = useTranslations("dashboard.agents");
  const lang = useLocale() === "el" ? "el" : "en";
  const dateLocale = lang === "el" ? "el-CY" : "en-GB";
  const roleOf = (a: RosterAgent) => (tr.has(`roster.${a.key}.role` as any) ? tr(`roster.${a.key}.role` as any) : a.role);
  const missionOf = (a: RosterAgent) => (tr.has(`roster.${a.key}.mission` as any) ? tr(`roster.${a.key}.mission` as any) : a.mission);
  const when = (iso: string) =>
    new Date(iso).toLocaleString(dateLocale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const [filter, setFilter] = useState<string>("");
  const [showSample, setShowSample] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "good" | "warn"; text: string } | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [goals, setGoals] = useState<Record<string, string>>({});
  const [steps, setSteps] = useState<Record<number, Step[] | "loading" | "error">>({});
  const history = useWorkspaceResource<Data>(`${HISTORY}${filter ? `?agent=${encodeURIComponent(filter)}` : ""}`);
  const data = history.data ?? null;
  const error = history.error;

  const loadSteps = useCallback(async (runId: number) => {
    setSteps((s) => ({ ...s, [runId]: "loading" }));
    try {
      const body = await workspaceRequest<{ steps: Step[] }>(`${HISTORY}?run=${runId}`);
      setSteps((s) => ({ ...s, [runId]: body.steps }));
    } catch {
      setSteps((s) => ({ ...s, [runId]: "error" }));
    }
  }, []);

  const toggleRun = useCallback((runId: number) => {
    if (open === runId) return setOpen(null);
    setOpen(runId);
    if (!Array.isArray(steps[runId])) void loadSteps(runId);
  }, [open, steps, loadSteps]);

  const runAgent = useCallback(async (agentKey: string, goal?: string) => {
    setBusy(goal ? `goal:${agentKey}` : `run:${agentKey}`);
    setNote(null);
    try {
      const b = await workspaceRequest<{ status?: string; summary?: string; runId?: number }>("/api/console/agents/run", {
        method: "POST",
        body: goal ? { agentKey, goal } : { agentKey },
      });
      if (goal) setGoals((g) => ({ ...g, [agentKey]: "" }));
      setNote({ tone: b.status !== "skipped" ? "good" : "warn", text: b.summary ?? tr("runFinished") });
      invalidateWorkspace(AGENT_DATA);
      if (b.runId) {
        setOpen(b.runId);
        void loadSteps(b.runId);
      }
    } catch (e) {
      setNote({ tone: "warn", text: e instanceof Error ? e.message : tr("unreachable") });
    } finally {
      setBusy(null);
    }
  }, [loadSteps, tr]);

  const setPause = useCallback(async (agentKey: string | null, paused: boolean) => {
    setBusy(`pause:${agentKey ?? "all"}`);
    try {
      await workspaceRequest("/api/console/agents/controls", {
        method: "POST",
        body: { agentKey, paused, reason: paused ? "Paused from the Agents page" : null },
      });
      setNote({ tone: paused ? "warn" : "good", text: paused ? tr("pausedNote") : tr("resumedNote") });
      invalidateWorkspace(AGENT_DATA);
    } catch (e) {
      setNote({ tone: "warn", text: e instanceof Error ? e.message : tr("switchFailed") });
    } finally {
      setBusy(null);
    }
  }, []);

  const c = data?.controls;
  const runnable = new Set(c?.runnable ?? []);
  const planners = new Set(c?.planners ?? []);
  const nameOf = (key: string) => data?.roster.find((a) => a.key === key)?.name ?? key;
  const realRuns = (data?.runs ?? []).filter((r) => !r.sample);
  const shownRuns = (data?.runs ?? []).filter((r) => showSample || !r.sample);
  const sampleCount = (data?.runs.length ?? 0) - realRuns.length;
  const liveAgents = (data?.roster ?? []).filter((a) => runnable.has(a.key));
  const plannedAgents = (data?.roster ?? []).filter((a) => !runnable.has(a.key));

  return (
    <ConsolePage
      title={tr("title")}
      purpose={tr("purpose")}
      loading={!data && !error}
      error={error}
      onRetry={history.reload}
      actions={
        c ? (
          <Btn variant={c.paused ? "primary" : "quiet"} disabled={busy !== null} onClick={() => setPause(null, !c.paused)}>
            {busy === "pause:all" ? tr("saving") : c.paused ? tr("resumeAll") : tr("pauseAll")}
          </Btn>
        ) : null
      }
    >
      {note && <p role="status" className="vck-cbam-note" data-tone={note.tone}>{note.text}</p>}
      {c?.paused && (
        <p role="status" className="vck-cbam-note" data-tone="warn">
          {c.pauseReason ? tr("allPausedReason", { reason: c.pauseReason }) : tr("allPaused")}
        </p>
      )}

      <div className="vck-agents-grid">
        {liveAgents.map((a) => {
          const sw = c?.agentPaused[a.key];
          const paused = Boolean(sw?.paused);
          const last = realRuns.find((r) => r.agentKey === a.key);
          const tone = c?.paused || paused ? "warn" : last?.status === "failed" ? "bad" : "good";
          const stateText = c?.paused ? tr("state.pausedAll") : paused ? tr("state.paused") : tr("state.active");
          const planner = planners.has(a.key);
          const goal = goals[a.key] ?? "";
          const goalOk = goal.trim().length >= 8;
          return (
            <Plate key={a.key} label={roleOf(a)} action={<State tone={tone}>{stateText}</State>}>
              <div className="vck-agent-card">
                <h3>{a.name}{planner && <span className="vck-agent-badge">{tr("plannerBadge")}</span>}</h3>
                <p className="vck-quiet">{missionOf(a)}</p>
                <dl>
                  <div><dt>{tr("schedule")}</dt><dd>{planner ? tr("scheduleWeekly") : tr("scheduleValue")}</dd></div>
                  <div>
                    <dt>{tr("lastRun")}</dt>
                    <dd>{last ? `${when(last.startedAt)} · ${runStatusLabel(last.status, lang).label}` : tr("notRunYet")}</dd>
                  </div>
                  {paused && sw && (
                    <div><dt>{tr("pausedBy")}</dt><dd>{sw.by ?? "—"} · {when(sw.at)}</dd></div>
                  )}
                </dl>
                <div className="vck-agent-actions">
                  <Btn variant="primary" disabled={busy !== null || paused || c?.paused} onClick={() => runAgent(a.key)}>
                    {busy === `run:${a.key}` ? tr("running") : tr("runNow")}
                  </Btn>
                  <Btn disabled={busy !== null} onClick={() => setPause(a.key, !paused)}>
                    {busy === `pause:${a.key}` ? tr("saving") : paused ? tr("resume") : tr("pause")}
                  </Btn>
                </div>
                {planner && (
                  <form
                    className="vck-agent-goal"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (goalOk && busy === null) void runAgent(a.key, goal.trim());
                    }}
                  >
                    <label htmlFor={`goal-${a.key}`}>{tr("goalLabel", { name: a.name })}</label>
                    <textarea
                      id={`goal-${a.key}`}
                      rows={3}
                      maxLength={1000}
                      value={goal}
                      placeholder={tr("goalPlaceholder")}
                      onChange={(e) => setGoals((g) => ({ ...g, [a.key]: e.target.value }))}
                    />
                    <p className="vck-quiet">{tr("goalHint")}</p>
                    <Btn type="submit" disabled={!goalOk || busy !== null || paused || c?.paused}>
                      {busy === `goal:${a.key}` ? tr("running") : tr("goalRun")}
                    </Btn>
                  </form>
                )}
              </div>
            </Plate>
          );
        })}
      </div>

      {plannedAgents.length > 0 && (
        <Plate label={tr("plannedTitle")} meta={`${plannedAgents.length}`}>
          <p className="vck-quiet vck-agent-planned-lead">{tr("plannedLead")}</p>
          <ul className="vck-agent-planned">
            {plannedAgents.map((a) => (
              <li key={a.key}><strong>{a.name}</strong><span>{roleOf(a)}</span></li>
            ))}
          </ul>
        </Plate>
      )}

      <Plate
        label={tr("history")}
        flush
        action={
          <div className="vck-agent-filters">
            <select aria-label={tr("filter")} className="vck-cbam-year" value={filter} onChange={(e) => { setFilter(e.target.value); setOpen(null); }}>
              <option value="">{tr("allAgents")}</option>
              {liveAgents.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            </select>
            {sampleCount > 0 && (
              <label className="vck-agent-check">
                <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} />
                {tr("showSample", { count: sampleCount })}
              </label>
            )}
          </div>
        }
      >
        {shownRuns.length === 0 ? (
          <Empty
            title={tr("emptyTitle")}
            body={c?.paused ? tr("emptyPaused") : tr("emptyBody")}
          />
        ) : (
          <ol className="vck-runs">
            {shownRuns.map((r) => {
              const st = runStatusLabel(r.status, lang);
              const isOpen = open === r.id;
              const s = steps[r.id];
              return (
                <li key={r.id} data-open={isOpen || undefined}>
                  <button type="button" className="vck-run-head" aria-expanded={isOpen} onClick={() => toggleRun(r.id)}>
                    <span className="vck-run-main">
                      <strong>{nameOf(r.agentKey)} · {tr("runNumber", { id: r.id })}</strong>
                      <span className="vck-run-summary">{r.summary}</span>
                    </span>
                    <span className="vck-run-meta">
                      <State tone={st.tone}>{st.label}</State>
                      {r.sample && <State tone="idle">{tr("sampleData")}</State>}
                      <span className="vck-quiet">{when(r.startedAt)} · {triggerLabel(r.trigger, lang)} · {duration(r.durationMs)}</span>
                      <span className="vck-quiet">
                        {tr("steps", { count: r.steps.total })}
                        {r.steps.waiting ? ` · ${tr("waiting", { count: r.steps.waiting })}` : ""}
                        {r.steps.blocked ? ` · ${tr("blocked", { count: r.steps.blocked })}` : ""}
                        {r.steps.failed ? ` · ${tr("failed", { count: r.steps.failed })}` : ""}
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="vck-run-steps">
                      {s === "loading" || s === undefined ? (
                        <p className="vck-quiet">{tr("loadingSteps")}</p>
                      ) : s === "error" ? (
                        <p className="vck-cbam-note" data-tone="warn">{tr("stepsFailed")}</p>
                      ) : s.length === 0 ? (
                        <p className="vck-quiet">{r.sample ? tr("sampleNoSteps") : tr("noToolCalls")}</p>
                      ) : (
                        <ol className="vck-steps">
                          {s.map((step) => {
                            const d = decisionLabel(step.decision, lang);
                            const t = toolLabel(step.tool, lang);
                            const out = summarizeOutput(step.decision, step.output, lang);
                            return (
                              <Fragment key={step.id}>
                                <li data-decision={step.decision}>
                                  <span className="vck-step-n" aria-hidden="true">{step.seq}</span>
                                  <div className="vck-step-body">
                                    <div className="vck-step-top">
                                      <strong>{t.verb}</strong>
                                      <State tone={d.tone}>{d.label}</State>
                                    </div>
                                    <p className="vck-quiet">{riskLabel(step.riskLevel, lang)} · {new Date(step.createdAt).toLocaleTimeString(dateLocale)}</p>
                                    {out && <p className="vck-step-out">{out}</p>}
                                    <details>
                                      <summary>{tr("exactInput")}</summary>
                                      <p className="vck-cbam-hash">SHA-256 {step.inputHash}</p>
                                      <pre>{step.input}</pre>
                                      {step.output && <pre>{step.output}</pre>}
                                    </details>
                                  </div>
                                </li>
                              </Fragment>
                            );
                          })}
                        </ol>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Plate>
    </ConsolePage>
  );
}
