"use client";

/**
 * The workspace copilot.
 *
 * A floating instrument, not a chat toy. It reads the same records the
 * dashboard draws, so the figures it quotes are the figures on screen. It can
 * propose one act at a time; the act stays pending in a card until a person
 * approves it. The command palette navigates, this reasons.
 */

import { invalidateWorkspace } from "@/components/app/console/workspace-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Streamdown } from "streamdown";
import { useConsole } from "./ConsoleData";
import { IcoClose, IcoVuneliAi } from "./icons";
import { VuneliAiIcon } from "@/components/brand/VuneliAiIcon";
import {
  ActivityCard,
  BillsCard,
  DeadlinesCard,
  DocumentCard,
  FactsCard,
  FootprintCard,
  FundingCard,
  ProposalCard,
  SuppliersCard,
  TOOL_LABEL,
  verdeText,
  type Lang,
  type ProposalState,
} from "./VerdeCards";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** The page the person is on, so Verde starts from it. */
function pageOf(pathname: string | null): string {
  const seg = (pathname ?? "").split("/").filter(Boolean);
  const i = seg.indexOf("app");
  const next = i === -1 ? undefined : seg[i + 1];
  if (!next) return "home";
  if (next === "compliance") return "deadlines";
  if (next === "analytics" || next === "insights") return "footprint";
  return next;
}

const STARTERS: Record<string, { en: string[]; el: string[] }> = {
  home: {
    en: ["What needs my attention this week?", "Which deadline is closest, and does it apply to us?", "Prepare a Board Summary I can share."],
    el: ["Τι χρειάζεται την προσοχή μου αυτή την εβδομάδα;", "Ποια προθεσμία είναι πιο κοντά και μας αφορά;", "Ετοίμασε μια Σύνοψη για το Διοικητικό Συμβούλιο."],
  },
  footprint: {
    en: ["What changed in my emissions this period?", "Where is most of our footprint coming from?", "Which data is missing from my footprint?"],
    el: ["Τι άλλαξε στις εκπομπές μου αυτή την περίοδο;", "Από πού προέρχεται το μεγαλύτερο αποτύπωμα;", "Ποια δεδομένα λείπουν;"],
  },
  suppliers: {
    en: ["Which suppliers need a check?", "Which suppliers have no email for data requests?", "Are any suppliers on the EU sanctions list?"],
    el: ["Ποιοι προμηθευτές χρειάζονται έλεγχο;", "Ποιοι προμηθευτές δεν έχουν email;", "Υπάρχει προμηθευτής στη λίστα κυρώσεων της ΕΕ;"],
  },
  deadlines: {
    en: ["Which deadlines apply to us and why?", "What do we still need to know to confirm the 'might apply' ones?", "Create a task for the closest deadline."],
    el: ["Ποιες προθεσμίες μας αφορούν και γιατί;", "Τι λείπει για να επιβεβαιώσουμε όσες ίσως ισχύουν;", "Δημιούργησε εργασία για την πιο κοντινή προθεσμία."],
  },
  actions: {
    en: ["Which funding calls could we qualify for?", "What would make us eligible for more grants?", "What should we do first to cut emissions?"],
    el: ["Για ποιες χρηματοδοτήσεις μπορεί να πληρούμε τις προϋποθέσεις;", "Τι θα μας έκανε επιλέξιμους για περισσότερες;", "Τι να κάνουμε πρώτα για να μειώσουμε τις εκπομπές;"],
  },
};

export const VERDE_ASK_EVENT = "vuneli:ask-verde";

/** Opens Verde with a request ready to send. */
/** Set-up hands a description to Verde across a page change; Verde sends it once on arrival. */
export const VERDE_HANDOFF_KEY = "vuneli.verde.handoff";

export function handOffToVerde(prompt: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(VERDE_HANDOFF_KEY, prompt);
}

export function askVerde(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VERDE_ASK_EVENT, { detail: { prompt } }));
}

type VerdePart = UIMessage["parts"][number] & {
  type: string;
  text?: string;
  state?: string;
  output?: Record<string, unknown>;
  errorText?: string;
  data?: { unsupported?: string[]; unsourced?: string[] };
};

export function ConsoleCopilot() {
  const { data, refresh } = useConsole();
  const locale = useLocale();
  const lang: Lang = locale.startsWith("el") ? "el" : "en";
  const t = verdeText(lang);
  const pathname = usePathname();
  const page = pageOf(pathname);
  const pageRef = useRef(page);
  pageRef.current = page;

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [proposals, setProposals] = useState<ProposalState[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/console/copilot",
        credentials: "include",
        headers: () => authHeaders(),
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { message: messages[messages.length - 1], page: pageRef.current },
        }),
      }),
    [],
  );

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => {
      let message = error.message;
      try {
        message = (JSON.parse(error.message) as { message?: string }).message ?? message;
      } catch {
        /* plain text */
      }
      setNotice(message || (lang === "el" ? "Η Verde δεν απάντησε. Δοκιμάστε ξανά." : "Verde did not answer. Please try again."));
    },
    onFinish: () => {
      // A proposal or a saved fact may have changed records other pages show.
      void loadProposals();
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const pending = proposals.filter((p) => p.status === "pending");
  const byId = useMemo(() => new Map(proposals.map((p) => [p.id, p])), [proposals]);

  const loadProposals = useCallback(async () => {
    try {
      const res = await fetch("/api/console/copilot", { headers: { Accept: "application/json", ...authHeaders() }, credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { proposals: ProposalState[] };
      setProposals(body.proposals ?? []);
    } catch {
      /* the cards keep their last state */
    }
  }, []);

  /* Load the saved conversation the first time the panel opens. */
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
        const body = (await res.json()) as { messages: UIMessage[]; proposals: ProposalState[] };
        if (!alive) return;
        setMessages(body.messages ?? []);
        setProposals(body.proposals ?? []);
      } catch {
        if (alive) setNotice(lang === "el" ? "Η συνομιλία δεν διαβάστηκε." : "Verde could not read this workspace conversation.");
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, loaded, setMessages, lang]);

  useEffect(() => {
    if (open && !busy) inputRef.current?.focus();
  }, [open, busy]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, proposals, open]);

  useEffect(() => {
    const onAsk = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setOpen(true);
      if (prompt) setDraft(prompt);
    };
    window.addEventListener(VERDE_ASK_EVENT, onAsk);
    return () => window.removeEventListener(VERDE_ASK_EVENT, onAsk);
  }, []);

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
    (override?: string) => {
      const prompt = (override ?? draft).trim().slice(0, 4000);
      if (!prompt || busy) return;
      setDraft("");
      setNotice(null);
      void sendMessage({ text: prompt });
    },
    [draft, busy, sendMessage],
  );

  useEffect(() => {
    if (window.sessionStorage.getItem(VERDE_HANDOFF_KEY)) setOpen(true);
  }, []);
  useEffect(() => {
    if (!loaded || busy) return;
    const handoff = window.sessionStorage.getItem(VERDE_HANDOFF_KEY);
    if (!handoff) return;
    window.sessionStorage.removeItem(VERDE_HANDOFF_KEY);
    send(handoff);
  }, [loaded, busy, send]);

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
        const body = (await res.json()) as { proposal?: ProposalState; message?: string };
        if (body.proposal) setProposals((prev) => prev.map((p) => (p.id === id ? body.proposal! : p)));
        if (!res.ok) setNotice(body.message ?? "That change could not run.");
        else if (decision === "approve") {
          refresh();
          invalidateWorkspace(["/api/console/company", "/api/console/suppliers"]);
        }
      } catch {
        setNotice(lang === "el" ? "Η απόφαση δεν αποθηκεύτηκε." : "The decision could not be saved. Please try again.");
      } finally {
        setDeciding(null);
      }
    },
    [refresh, lang],
  );

  const factsSaved = useCallback(() => {
    refresh();
    invalidateWorkspace(["/api/console/company", "/api/console/obligations"]);
  }, [refresh]);

  const downloadBoard = useCallback(async () => {
    if (!data) throw new Error("no data");
    const [{ downloadBoardSummary }, { exportFileName }] = await Promise.all([
      import("@/lib/pdf/board-summary"),
      import("@/components/app/console/export-csv"),
    ]);
    await downloadBoardSummary(data, exportFileName(data, "overview", "pdf", "-board-summary"));
  }, [data]);

  const clear = useCallback(async () => {
    stop();
    setMessages([]);
    setNotice(null);
    try {
      await fetch("/api/console/copilot", { method: "DELETE", headers: authHeaders(), credentials: "include" });
    } catch {
      /* already cleared on screen */
    }
  }, [setMessages, stop]);

  const workspaceName = data?.workspace?.name ?? (lang === "el" ? "τον χώρο σας" : "your workspace");
  const starters = (STARTERS[page] ?? STARTERS.home)[lang];

  function renderPart(part: VerdePart, key: string, last: boolean) {
    if (part.type === "text") {
      if (!part.text) return null;
      return (
        <div key={key} className="vv-text">
          <Streamdown>{part.text}</Streamdown>
        </div>
      );
    }
    if (part.type === "data-grounding") {
      const unsupported = part.data?.unsupported ?? [];
      return (
        <p key={key} className="vc-copilot-check" role="note">
          {unsupported.length
            ? lang === "el"
              ? `Ελέγξτε πριν βασιστείτε: ${unsupported.join(", ")} δεν υπάρχει στα αρχεία σας.`
              : `Check before relying on this: ${unsupported.join(", ")} ${unsupported.length === 1 ? "is" : "are"} not in your records.`
            : lang === "el"
              ? "Ελέγξτε πριν βασιστείτε: ένας αριθμός αναφέρεται χωρίς πηγή."
              : "Check before relying on this: a figure here is quoted without naming its record."}
        </p>
      );
    }
    if (!part.type.startsWith("tool-")) return null;
    const name = part.type.slice(5);
    const label = TOOL_LABEL[name]?.[lang] ?? name;
    if (part.state === "output-error") {
      return <p key={key} className="vv-step" data-state="error">{t.failed} {label}</p>;
    }
    if (part.state !== "output-available" || !part.output) {
      return (
        <p key={key} className="vv-step" data-state="running" aria-live="polite">
          <IcoVuneliAi size={12} /> {t.checking} {label}
        </p>
      );
    }
    const out = part.output;
    const step = <p className="vv-step" data-state="done">{t.ran} {label}</p>;
    let card: React.ReactNode = null;
    switch (name) {
      case "read_footprint": card = <FootprintCard out={out} lang={lang} />; break;
      case "read_deadlines": card = <DeadlinesCard out={out} lang={lang} />; break;
      case "read_suppliers": card = <SuppliersCard out={out} lang={lang} />; break;
      case "read_funding": card = <FundingCard out={out} lang={lang} />; break;
      case "read_bills": card = <BillsCard out={out} lang={lang} />; break;
      case "read_activity": card = <ActivityCard out={out} lang={lang} />; break;
      case "ask_for_facts": card = <FactsCard out={out} lang={lang} onSaved={factsSaved} authHeaders={authHeaders} />; break;
      case "prepare_document": card = <DocumentCard out={out} lang={lang} onDownload={downloadBoard} />; break;
      case "propose_change": {
        const id = out.proposalId as number | undefined;
        const p = id !== undefined ? byId.get(id) : undefined;
        const fallback: ProposalState | null = id !== undefined && out.ok
          ? { id, kind: String(out.kind), title: String(out.title), summary: String(out.summary), status: "pending", resultNote: null, decidedBy: null }
          : null;
        const shown = p ?? fallback;
        card = shown ? <ProposalCard proposal={shown} lang={lang} busy={deciding === shown.id} onDecide={decide} /> : null;
        break;
      }
    }
    void last;
    return (
      <div key={key} className="vv-tool">
        {step}
        {card}
      </div>
    );
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          className="vc-copilot-fab"
          data-tour="verde"
          onClick={() => setOpen(true)}
          aria-label={lang === "el" ? "Άνοιγμα της Verde" : "Open Verde"}
        >
          <span className="vc-copilot-fab-mark">
            <VuneliAiIcon size={18} brand />
          </span>
          <span className="vc-copilot-fab-label">{lang === "el" ? "Ρωτήστε τη Verde" : "Ask Verde"}</span>
          {pending.length > 0 && (
            <span className="vc-copilot-fab-count">
              {pending.length > 9 ? "9+" : pending.length}
              <span className="sr-only"> {lang === "el" ? "εκκρεμείς εγκρίσεις" : "pending approvals"}</span>
            </span>
          )}
          <span className="vc-copilot-fab-key" aria-hidden>⌘J</span>
        </button>
      )}

      {open && (
        <div
          className="vc-copilot-scrim vv-scrim"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {open && (
        <section className="vc-copilot vv-panel" role="dialog" aria-modal="false" aria-label="Verde">
          <header className="vc-copilot-head">
            <span className="vc-copilot-badge">
              <VuneliAiIcon size={18} brand />
            </span>
            <div className="vc-copilot-title">
              <strong>Verde</strong>
              <span>
                <i className="vc-copilot-live" aria-hidden />
                {lang === "el" ? `Διαβάζει ${workspaceName}` : `Working on ${workspaceName}`}
              </span>
            </div>
            <div className="vc-copilot-head-tools">
              {pending.length > 0 && (
                <span className="vc-copilot-head-pending">
                  {pending.length} {lang === "el" ? "περιμένουν εσάς" : "awaiting you"}
                </span>
              )}
              {messages.length > 0 && (
                <button type="button" onClick={clear} className="vc-copilot-text-btn">
                  {lang === "el" ? "Καθαρισμός" : "Clear"}
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label={lang === "el" ? "Κλείσιμο" : "Close Verde"} className="vc-copilot-close">
                <IcoClose size={13} />
              </button>
            </div>
          </header>

          <div className="vc-copilot-body vv-body" ref={scrollRef} aria-live="polite">
            {!loaded && <p className="vc-copilot-muted">{lang === "el" ? "Διαβάζει τον χώρο σας..." : "Reading this workspace..."}</p>}

            {loaded && messages.length === 0 && (
              <div className="vv-empty-state">
                <p>
                  {lang === "el"
                    ? "Διαβάζω τα αρχεία σας, δείχνω από πού προέρχεται κάθε αριθμός, ζητώ ό,τι λείπει και ετοιμάζω έγγραφα. Τίποτα δεν αλλάζει χωρίς την έγκρισή σας."
                    : "I read your records, show where every figure comes from, ask for what is missing and prepare documents. Nothing changes without your approval."}
                </p>
                <ul>
                  {starters.map((starter) => (
                    <li key={starter}>
                      <button type="button" onClick={() => send(starter)}>
                        <span>{starter}</span>
                        <em aria-hidden>&rarr;</em>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messages.map((m, mi) => (
              <article key={m.id} data-role={m.role} className="vc-copilot-turn vv-turn">
                {m.role === "user" ? (
                  <p className="vc-copilot-said">
                    {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
                  </p>
                ) : (
                  m.parts.map((p, pi) => renderPart(p as VerdePart, `${m.id}-${pi}`, mi === messages.length - 1))
                )}
              </article>
            ))}

            {status === "submitted" && (
              <p className="vv-step" data-state="running">
                <IcoVuneliAi size={12} /> {lang === "el" ? "Σκέφτεται..." : "Thinking..."}
              </p>
            )}

            {notice && <p className="vc-copilot-notice" role="alert">{notice}</p>}
          </div>

          <footer className="vc-copilot-foot">
            <div className="vc-copilot-field">
              <label htmlFor="vv-input" className="sr-only">{lang === "el" ? "Ερώτηση προς τη Verde" : "Ask Verde"}</label>
              <textarea
                id="vv-input"
                ref={inputRef}
                value={draft}
                rows={1}
                placeholder={lang === "el" ? "Ρωτήστε ή ζητήστε κάτι" : "Ask a question or give Verde a job"}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              {busy ? (
                <button type="button" onClick={() => stop()} aria-label={lang === "el" ? "Διακοπή" : "Stop"}>
                  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden><rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" /></svg>
                </button>
              ) : (
                <button type="button" onClick={() => send()} disabled={draft.trim().length === 0} aria-label={lang === "el" ? "Αποστολή" : "Send"}>
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
                    <path d="M2.6 8h9.4M8.4 4.2 12.4 8l-4 3.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
            <p className="vc-copilot-hint">
              <span>{lang === "el" ? "Enter για αποστολή." : "Enter sends. Shift and Enter make a new line."}</span>
              <span>{lang === "el" ? "Κάθε αλλαγή περιμένει την έγκρισή σας." : "Every change waits for your approval."}</span>
            </p>
          </footer>
        </section>
      )}
    </>
  );
}
