"use client";

/**
 * Agents. Run or pause each agent, and open any run to see every step it
 * took: what it read, what it wrote, what it asked you to approve, and what
 * policy blocked. Every row comes from the step ledger; nothing is invented.
 */

import { Fragment, useCallback, useEffect, useState } from "react";
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
    maxStepsPerRun: number;
  };
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const duration = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

const HISTORY = "/api/console/agents/history";
/** Everything an agent run or switch can change. */
const AGENT_DATA = ["/api/console/agents", "/api/console/cbam"];

export default function AgentsPage() {
  const [filter, setFilter] = useState<string>("");
  const [showSample, setShowSample] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "good" | "warn"; text: string } | null>(null);
  const [open, setOpen] = useState<number | null>(null);
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

  const runAgent = useCallback(async (agentKey: string) => {
    setBusy(`run:${agentKey}`);
    setNote(null);
    try {
      const b = await workspaceRequest<{ status?: string; summary?: string; runId?: number }>("/api/console/agents/run", { method: "POST", body: { agentKey } });
      setNote({ tone: b.status !== "skipped" ? "good" : "warn", text: b.summary ?? "Run finished." });
      invalidateWorkspace(AGENT_DATA);
      if (b.runId) {
        setOpen(b.runId);
        void loadSteps(b.runId);
      }
    } catch (e) {
      setNote({ tone: "warn", text: e instanceof Error ? e.message : "Could not reach the server. Try again." });
    } finally {
      setBusy(null);
    }
  }, [loadSteps]);

  const setPause = useCallback(async (agentKey: string | null, paused: boolean) => {
    setBusy(`pause:${agentKey ?? "all"}`);
    try {
      await workspaceRequest("/api/console/agents/controls", {
        method: "POST",
        body: { agentKey, paused, reason: paused ? "Paused from the Agents page" : null },
      });
      setNote({ tone: paused ? "warn" : "good", text: paused ? "Paused. Scheduled runs will be skipped until you resume." : "Resumed. It runs on the next heartbeat." });
      invalidateWorkspace(AGENT_DATA);
    } catch (e) {
      setNote({ tone: "warn", text: e instanceof Error ? e.message : "Could not change the switch." });
    } finally {
      setBusy(null);
    }
  }, []);

  const c = data?.controls;
  const runnable = new Set(c?.runnable ?? []);
  const nameOf = (key: string) => data?.roster.find((a) => a.key === key)?.name ?? key;
  const realRuns = (data?.runs ?? []).filter((r) => !r.sample);
  const shownRuns = (data?.runs ?? []).filter((r) => showSample || !r.sample);
  const sampleCount = (data?.runs.length ?? 0) - realRuns.length;
  const liveAgents = (data?.roster ?? []).filter((a) => runnable.has(a.key));
  const plannedAgents = (data?.roster ?? []).filter((a) => !runnable.has(a.key));

  return (
    <ConsolePage
      title="Agents"
      purpose="Run or pause each agent, and open any run to see every step it took and why."
      loading={!data && !error}
      error={error}
      onRetry={history.reload}
      actions={
        c ? (
          <Btn variant={c.paused ? "primary" : "quiet"} disabled={busy !== null} onClick={() => setPause(null, !c.paused)}>
            {busy === "pause:all" ? "Saving…" : c.paused ? "Resume all agents" : "Pause all agents"}
          </Btn>
        ) : null
      }
    >
      {note && <p role="status" className="vck-cbam-note" data-tone={note.tone}>{note.text}</p>}
      {c?.paused && (
        <p role="status" className="vck-cbam-note" data-tone="warn">
          Every agent is paused{c.pauseReason ? `: ${c.pauseReason}` : ""}. Nothing runs until you resume.
        </p>
      )}

      <div className="vck-agents-grid">
        {liveAgents.map((a) => {
          const sw = c?.agentPaused[a.key];
          const paused = Boolean(sw?.paused);
          const last = realRuns.find((r) => r.agentKey === a.key);
          const tone = c?.paused || paused ? "warn" : last?.status === "failed" ? "bad" : "good";
          const stateText = c?.paused ? "Paused (all)" : paused ? "Paused" : "Active";
          return (
            <Plate key={a.key} label={a.role} action={<State tone={tone}>{stateText}</State>}>
              <div className="vck-agent-card">
                <h3>{a.name}</h3>
                <p className="vck-quiet">{a.mission}</p>
                <dl>
                  <div><dt>Schedule</dt><dd>Once a day, checked every 15 min</dd></div>
                  <div>
                    <dt>Last real run</dt>
                    <dd>{last ? `${when(last.startedAt)} · ${runStatusLabel(last.status).label}` : "Not run yet"}</dd>
                  </div>
                  {paused && sw && (
                    <div><dt>Paused by</dt><dd>{sw.by ?? "—"} · {when(sw.at)}</dd></div>
                  )}
                </dl>
                <div className="vck-agent-actions">
                  <Btn variant="primary" disabled={busy !== null || paused || c?.paused} onClick={() => runAgent(a.key)}>
                    {busy === `run:${a.key}` ? "Running…" : "Run now"}
                  </Btn>
                  <Btn disabled={busy !== null} onClick={() => setPause(a.key, !paused)}>
                    {busy === `pause:${a.key}` ? "Saving…" : paused ? "Resume" : "Pause"}
                  </Btn>
                </div>
              </div>
            </Plate>
          );
        })}
      </div>

      {plannedAgents.length > 0 && (
        <Plate label="Not running yet" meta={`${plannedAgents.length}`}>
          <p className="vck-quiet vck-agent-planned-lead">These agents are planned but have no real work behind them, so they cannot be started.</p>
          <ul className="vck-agent-planned">
            {plannedAgents.map((a) => (
              <li key={a.key}><strong>{a.name}</strong><span>{a.role}</span></li>
            ))}
          </ul>
        </Plate>
      )}

      <Plate
        label="Run history"
        flush
        action={
          <div className="vck-agent-filters">
            <select aria-label="Filter by agent" className="vck-cbam-year" value={filter} onChange={(e) => { setFilter(e.target.value); setOpen(null); }}>
              <option value="">All agents</option>
              {liveAgents.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            </select>
            {sampleCount > 0 && (
              <label className="vck-agent-check">
                <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} />
                Show {sampleCount} sample
              </label>
            )}
          </div>
        }
      >
        {shownRuns.length === 0 ? (
          <Empty
            title="No real runs yet"
            body={c?.paused ? "Agents are paused. Resume them, then press Run now on an agent." : "Press Run now on an agent above, or wait for the next scheduled run."}
          />
        ) : (
          <ol className="vck-runs">
            {shownRuns.map((r) => {
              const st = runStatusLabel(r.status);
              const isOpen = open === r.id;
              const s = steps[r.id];
              return (
                <li key={r.id} data-open={isOpen || undefined}>
                  <button type="button" className="vck-run-head" aria-expanded={isOpen} onClick={() => toggleRun(r.id)}>
                    <span className="vck-run-main">
                      <strong>{nameOf(r.agentKey)} · Run #{r.id}</strong>
                      <span className="vck-run-summary">{r.summary}</span>
                    </span>
                    <span className="vck-run-meta">
                      <State tone={st.tone}>{st.label}</State>
                      {r.sample && <State tone="idle">Sample data</State>}
                      <span className="vck-quiet">{when(r.startedAt)} · {triggerLabel(r.trigger)} · {duration(r.durationMs)}</span>
                      <span className="vck-quiet">
                        {r.steps.total} step{r.steps.total === 1 ? "" : "s"}
                        {r.steps.waiting ? ` · ${r.steps.waiting} waiting for you` : ""}
                        {r.steps.blocked ? ` · ${r.steps.blocked} blocked` : ""}
                        {r.steps.failed ? ` · ${r.steps.failed} failed` : ""}
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="vck-run-steps">
                      {s === "loading" || s === undefined ? (
                        <p className="vck-quiet">Loading steps…</p>
                      ) : s === "error" ? (
                        <p className="vck-cbam-note" data-tone="warn">Could not load the steps for this run.</p>
                      ) : s.length === 0 ? (
                        <p className="vck-quiet">{r.sample ? "Sample runs have no recorded steps." : "This run made no tool calls."}</p>
                      ) : (
                        <ol className="vck-steps">
                          {s.map((step) => {
                            const d = decisionLabel(step.decision);
                            const t = toolLabel(step.tool);
                            const out = summarizeOutput(step.decision, step.output);
                            return (
                              <Fragment key={step.id}>
                                <li data-decision={step.decision}>
                                  <span className="vck-step-n" aria-hidden="true">{step.seq}</span>
                                  <div className="vck-step-body">
                                    <div className="vck-step-top">
                                      <strong>{t.verb}</strong>
                                      <State tone={d.tone}>{d.label}</State>
                                    </div>
                                    <p className="vck-quiet">{riskLabel(step.riskLevel)} · {new Date(step.createdAt).toLocaleTimeString("en-GB")}</p>
                                    {out && <p className="vck-step-out">{out}</p>}
                                    <details>
                                      <summary>Exact input and fingerprint</summary>
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
