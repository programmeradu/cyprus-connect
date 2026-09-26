"use client";

/**
 * Real agent controls on the overview: run the evidence check now, and pause
 * or resume every agent in the workspace. Shows the outcome in plain words.
 */

import { useCallback, useEffect, useState } from "react";
import { useConsole } from "./ConsoleData";

interface Controls {
  paused: boolean;
  pauseReason: string | null;
}

export function AgentPulse() {
  const { refresh } = useConsole();
  const [controls, setControls] = useState<Controls | null>(null);
  const [busy, setBusy] = useState<"run" | "pause" | null>(null);
  const [note, setNote] = useState<{ tone: "good" | "warn"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/console/agents/controls", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Controls | null) => alive && d && setControls({ paused: d.paused, pauseReason: d.pauseReason }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const runNow = useCallback(async () => {
    setBusy("run");
    setNote(null);
    try {
      const res = await fetch("/api/console/agents/run", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentKey: "ingest" }),
      });
      const body = (await res.json().catch(() => ({}))) as { summary?: string; message?: string; status?: string };
      if (res.ok && body.status === "skipped") setNote({ tone: "warn", text: body.summary ?? "Agents are paused." });
      else if (res.ok) setNote({ tone: "good", text: body.summary ?? body.message ?? "Run finished." });
      else setNote({ tone: "warn", text: body.message ?? body.summary ?? "The run failed." });
      refresh();
    } catch {
      setNote({ tone: "warn", text: "Could not reach the server. Try again." });
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const togglePause = useCallback(async () => {
    if (!controls) return;
    setBusy("pause");
    try {
      const res = await fetch("/api/console/agents/controls", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paused: !controls.paused, reason: controls.paused ? null : "Paused from the overview" }),
      });
      if (res.ok) {
        const d = (await res.json()) as Controls;
        setControls({ paused: d.paused, pauseReason: d.pauseReason });
        setNote({ tone: d.paused ? "warn" : "good", text: d.paused ? "All agents are paused. Scheduled runs will be skipped." : "Agents resumed." });
        refresh();
      } else {
        setNote({ tone: "warn", text: "Could not change the agent switch." });
      }
    } finally {
      setBusy(null);
    }
  }, [controls, refresh]);

  return (
    <div className="vc-agent-pulse">
      <div className="vc-agent-pulse-actions">
        <button type="button" onClick={runNow} disabled={busy !== null || controls?.paused === true}>
          {busy === "run" ? "Checking…" : "Run evidence check"}
        </button>
        <button type="button" data-variant="quiet" onClick={togglePause} disabled={busy !== null || !controls}>
          {busy === "pause" ? "Saving…" : controls?.paused ? "Resume agents" : "Pause agents"}
        </button>
      </div>
      {note ? (
        <p role="status" data-tone={note.tone}>
          {note.text}
        </p>
      ) : controls?.paused ? (
        <p role="status" data-tone="warn">
          Agents are paused{controls.pauseReason ? `: ${controls.pauseReason}` : ""}.
        </p>
      ) : null}
    </div>
  );
}
