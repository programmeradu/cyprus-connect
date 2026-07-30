"use client";

/**
 * The workspace copilot.
 *
 * A floating instrument, not a chat toy. It reads the same records the
 * dashboard draws, so the figures it quotes are the figures on screen. It can
 * propose one act at a time; the act stays pending in a card until a person
 * approves it. The command palette navigates, this reasons.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useConsole } from "./ConsoleData";
import { IcoClose, IcoCheck, IcoSpark } from "./icons";

type Role = "user" | "assistant";

interface Turn {
  id: number;
  role: Role;
  content: string;
}

interface Proposal {
  id: number;
  messageId: number | null;
  kind: string;
  title: string;
  summary: string;
  status: "pending" | "approved" | "rejected" | "failed";
  resultNote: string | null;
  decidedBy: string | null;
}

const KIND_LABEL: Record<string, string> = {
  create_task: "Create a review task",
  update_obligation: "Update an obligation",
  log_reading: "Log a metric reading",
};

const STARTERS = [
  "What changed in my emissions this period?",
  "Which obligation is closest to its deadline?",
  "Draft a review task for the largest data gap.",
];

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ConsoleCopilot() {
  const { data, refresh } = useConsole();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pending = proposals.filter((p) => p.status === "pending");

  /* Load the conversation the first time the panel opens. */
  useEffect(() => {
    if (!open || loaded) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/console/copilot", {
          headers: { Accept: "application/json", ...authHeaders() },
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { messages: Turn[]; proposals: Proposal[] };
        if (!alive) return;
        setTurns(body.messages ?? []);
        setProposals(body.proposals ?? []);
      } catch {
        if (alive) setNotice("The copilot could not read this workspace conversation.");
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, loaded]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, streaming]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns, proposals, streaming, open]);

  /* Escape closes, Cmd/Ctrl+J toggles. The panel must never trap the keyboard. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (open && event.key === "Escape") {
        setOpen(false);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (override?: string) => {
      const prompt = (override ?? draft).trim();
      if (!prompt || streaming) return;
      setDraft("");
      setNotice(null);
      setStreaming(true);

      const localId = -Date.now();
      setTurns((prev) => [
        ...prev,
        { id: localId, role: "user", content: prompt },
        { id: localId + 1, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/console/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          credentials: "include",
          body: JSON.stringify({ prompt }),
        });

        if (!res.ok || !res.body) {
          const text = await res.text();
          let message = "The copilot is not available right now.";
          try {
            message = (JSON.parse(text) as { message?: string }).message ?? message;
          } catch {
            /* keep the default */
          }
          throw new Error(message);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let answer = "";
        let touchedRecords = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: Record<string, unknown>;
            try {
              event = JSON.parse(line.slice(6)) as Record<string, unknown>;
            } catch {
              continue;
            }
            if (event.type === "delta" && typeof event.text === "string") {
              answer += event.text;
              setTurns((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { id: localId + 1, role: "assistant", content: answer };
                return copy;
              });
            } else if (event.type === "proposal" && event.proposal) {
              setProposals((prev) => [event.proposal as Proposal, ...prev]);
              touchedRecords = true;
            } else if (event.type === "error" && typeof event.message === "string") {
              setNotice(event.message);
            }
          }
        }

        if (!answer.trim() && !touchedRecords) {
          setNotice("The copilot returned an empty answer. Please ask again.");
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "The copilot request failed.");
        setTurns((prev) => prev.filter((t) => t.content.trim().length > 0 || t.role === "user"));
      } finally {
        setStreaming(false);
      }
    },
    [draft, streaming],
  );

  const decide = useCallback(
    async (id: number, decision: "approve" | "reject") => {
      setDeciding(id);
      setNotice(null);
      try {
        const res = await fetch("/api/console/copilot/proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          credentials: "include",
          body: JSON.stringify({ id, decision }),
        });
        const body = (await res.json()) as { proposal?: Proposal; message?: string };
        if (body.proposal) {
          setProposals((prev) => prev.map((p) => (p.id === id ? body.proposal! : p)));
        }
        if (!res.ok) {
          setNotice(body.message ?? "That act could not run.");
        } else if (decision === "approve") {
          // The records changed, so every page must re-read them.
          refresh();
        }
      } catch {
        setNotice("The decision could not be saved. Please try again.");
      } finally {
        setDeciding(null);
      }
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    setTurns([]);
    setNotice(null);
    try {
      await fetch("/api/console/copilot", {
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
      });
    } catch {
      /* the conversation is already cleared on screen */
    }
  }, []);

  const workspaceName = data?.workspace?.name ?? "your workspace";

  return (
    <>
      {!open && (
        <button
          type="button"
          className="vc-copilot-fab"
          onClick={() => setOpen(true)}
          aria-label="Open the workspace copilot"
        >
          <span className="vc-copilot-fab-mark">
            <CopilotMark small />
          </span>
          <span className="vc-copilot-fab-label">Ask Copilot</span>
          {pending.length > 0 && (
            <span className="vc-copilot-fab-count">
              {pending.length > 9 ? "9+" : pending.length}
              <span className="sr-only"> pending approvals</span>
            </span>
          )}
          <span className="vc-copilot-fab-key" aria-hidden>
            ⌘J
          </span>
        </button>
      )}

      {open && (
        <div
          className="vc-copilot-scrim"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {open && (
        <section className="vc-copilot" role="dialog" aria-label="Workspace copilot">
          <span className="vc-copilot-grip" aria-hidden />
          <header className="vc-copilot-head">
            <span className="vc-copilot-badge">
              <CopilotMark small />
            </span>
            <div className="vc-copilot-title">
              <strong>Copilot</strong>
              <span>
                <i className="vc-copilot-live" aria-hidden />
                Reading {workspaceName}
              </span>
            </div>
            <div className="vc-copilot-head-tools">
              {pending.length > 0 && (
                <span className="vc-copilot-head-pending">
                  {pending.length} awaiting you
                </span>
              )}
              {turns.length > 0 && (
                <button type="button" onClick={clear} className="vc-copilot-text-btn">
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the copilot"
                className="vc-copilot-close"
              >
                <IcoClose size={13} />
              </button>
            </div>
          </header>


          <div className="vc-copilot-body" ref={scrollRef}>
            {!loaded && <p className="vc-copilot-muted">Reading this workspace...</p>}

            {loaded && turns.length === 0 && (
              <div className="vc-copilot-empty">
                <p>
                  Ask about the records in this workspace. I quote the metric, obligation or run
                  the answer comes from, and I never change anything without your approval.
                </p>
                <p className="vc-copilot-empty-label">Start with</p>
                <ul>
                  {STARTERS.map((starter, index) => (
                    <li key={starter}>
                      <button type="button" onClick={() => send(starter)}>
                        <em className="vc-copilot-starter-no" aria-hidden>
                          {String(index + 1).padStart(2, "0")}
                        </em>
                        <span>{starter}</span>
                        <em className="vc-copilot-starter-go" aria-hidden>
                          &rarr;
                        </em>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}


            {turns.map((turn, index) => (
              <article key={turn.id} data-role={turn.role} className="vc-copilot-turn">
                {turn.role === "user" ? (
                  <p className="vc-copilot-said">{turn.content}</p>
                ) : (
                  <>
                    <p className="vc-copilot-answer">
                      {turn.content ||
                        (streaming && index === turns.length - 1 ? (
                          <span className="vc-copilot-thinking">
                            <IcoSpark size={13} /> Reading the records...
                          </span>
                        ) : (
                          ""
                        ))}
                    </p>
                    {proposals
                      .filter((p) => p.messageId !== null && p.messageId === turn.id)
                      .map((p) => (
                        <ProposalCard
                          key={p.id}
                          proposal={p}
                          busy={deciding === p.id}
                          onDecide={decide}
                        />
                      ))}
                  </>
                )}
              </article>
            ))}

            {/* A proposal that arrived during this session has no persisted
                turn to sit under, so it is shown at the end of the thread. */}
            {proposals
              .filter((p) => p.messageId === null || !turns.some((t) => t.id === p.messageId))
              .filter((p) => p.status === "pending")
              .map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  busy={deciding === p.id}
                  onDecide={decide}
                />
              ))}

            {notice && <p className="vc-copilot-notice">{notice}</p>}
          </div>

          <footer className="vc-copilot-foot">
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              disabled={streaming}
              placeholder="Ask about this workspace"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={streaming || draft.trim().length === 0}
              aria-label="Send the question"
            >
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
                <path
                  d="M2.6 8h9.4M8.4 4.2 12.4 8l-4 3.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </footer>
        </section>
      )}
    </>
  );
}

function ProposalCard({
  proposal,
  busy,
  onDecide,
}: {
  proposal: Proposal;
  busy: boolean;
  onDecide: (id: number, decision: "approve" | "reject") => void;
}) {
  const label = KIND_LABEL[proposal.kind] ?? "Proposed change";
  const settled = proposal.status !== "pending";

  return (
    <div className="vc-copilot-prop" data-status={proposal.status}>
      <header>
        <span className="vc-copilot-prop-kind">{label}</span>
        {settled && <span className="vc-copilot-prop-state">{proposal.status}</span>}
      </header>
      <strong>{proposal.title}</strong>
      <p>{proposal.summary}</p>
      {settled ? (
        <p className="vc-copilot-prop-note">
          {proposal.resultNote ?? "No further detail."}
          {proposal.decidedBy ? ` (${proposal.decidedBy})` : ""}
        </p>
      ) : (
        <div className="vc-copilot-prop-actions">
          <button
            type="button"
            className="vc-copilot-approve"
            disabled={busy}
            onClick={() => onDecide(proposal.id, "approve")}
          >
            <IcoCheck size={12} />
            {busy ? "Working" : "Approve"}
          </button>
          <button
            type="button"
            className="vc-copilot-reject"
            disabled={busy}
            onClick={() => onDecide(proposal.id, "reject")}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The copilot mark: a measurement arc closing around a sprout. It reads as
 * instrument plus growth, which is what this panel does. It is not a sparkle.
 */
function CopilotMark({ small }: { small?: boolean }) {
  const size = small ? 17 : 24;
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} fill="none" aria-hidden>
      <path
        d="M4.4 18.6a10.4 10.4 0 1 1 19.2 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M14 22.4V12.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 13.4c-.2-2.6-1.9-4.2-4.6-4.5-.1 2.8 1.5 4.5 4.6 4.5Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M14.2 15.1c.3-3 2.2-4.8 5.3-5.1.2 3.1-1.8 5.1-5.3 5.1Z"
        fill="var(--vc-lime)"
      />
      <circle cx="14" cy="23.2" r="1.7" fill="var(--vc-lime)" />
    </svg>
  );
}
