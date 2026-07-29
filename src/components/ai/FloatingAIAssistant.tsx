"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

type Message = { role: "user" | "assistant"; text: string };

const COPY = {
  en: {
    open: "Ask Verde",
    title: "Verde",
    subtitle: "Sustainability co-pilot · Cyprus and EU",
    placeholder: "Ask about CBAM, CSRD, VSME, energy…",
    send: "Send",
    thinking: "Reading the regulation…",
    close: "Close",
    empty:
      "I answer questions on EU sustainability rules, carbon accounting and Cyprus compliance. Start with one of these, or write your own.",
    starters: [
      "Does CBAM apply to my imports?",
      "CSRD or VSME for a 40-person company?",
      "How do I calculate Scope 2 in Cyprus?",
    ],
    error: "Something went wrong. Try again.",
    disclaimer: "Verde can make mistakes. Check the source before you file.",
  },
  el: {
    open: "Ρωτήστε τη Verde",
    title: "Verde",
    subtitle: "Σύμβουλος βιωσιμότητας · Κύπρος και ΕΕ",
    placeholder: "Ρωτήστε για CBAM, CSRD, VSME, ενέργεια…",
    send: "Αποστολή",
    thinking: "Διαβάζω τον κανονισμό…",
    close: "Κλείσιμο",
    empty:
      "Απαντώ σε ερωτήσεις για κανονισμούς ΕΕ, ανθρακικό αποτύπωμα και συμμόρφωση στην Κύπρο. Ξεκινήστε με μία από αυτές.",
    starters: [
      "Ισχύει το CBAM για τις εισαγωγές μου;",
      "CSRD ή VSME για εταιρεία 40 ατόμων;",
      "Πώς υπολογίζω το Scope 2 στην Κύπρο;",
    ],
    error: "Κάτι πήγε στραβά. Δοκιμάστε ξανά.",
    disclaimer: "Η Verde μπορεί να κάνει λάθη. Ελέγξτε την πηγή πριν την υποβολή.",
  },
} as const;

const SYSTEM_CONTEXT =
  "You are Verde, Vuneli's sustainability co-pilot. Help SMEs - especially Cyprus and EU businesses - with CBAM, CSRD, VSME, EU Taxonomy, GHG Protocol scopes, and carbon reduction. Be concise, editorial, and specific. Never invent regulations. Answer in the same language as the user's message.";

/**
 * FloatingAIAssistant - bottom-right co-pilot on marketing pages.
 * Hidden on /app/* and /auth routes. Streams from /api/gemini/stream.
 */
export function FloatingAIAssistant() {
  const pathname = usePathname() || "";
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hidden = /\/app(\/|$)|\/auth(\/|$)/.test(pathname);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (override?: string) => {
    const prompt = (override ?? input).trim();
    if (!prompt || streaming) return;
    setInput("");
    const nextMessages: Message[] = [
      ...messages,
      { role: "user", text: prompt },
      { role: "assistant", text: "" },
    ];
    setMessages(nextMessages);
    setStreaming(true);

    try {
      const historyText = nextMessages
        .slice(0, -1)
        .filter((m) => m.text)
        .map((m) => `${m.role === "user" ? "User" : "Verde"}: ${m.text}`)
        .join("\n");

      const res = await fetch("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          context: `${SYSTEM_CONTEXT}\n\nConversation so far:\n${historyText}`,
        }),
      });

      if (!res.ok || !res.body) throw new Error("stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text) {
              acc += payload.text;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", text: acc };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", text: t.error };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      {/* Trigger - ink disc with the Verde sprout monogram and a lime hairline */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open}
          className="group fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[oklch(0.19_0.02_150)] text-white shadow-[0_14px_34px_-14px_rgba(0,0,0,0.6)] ring-1 ring-[var(--accent-lime)]/45 transition-transform duration-300 hover:scale-[1.04] sm:bottom-6 sm:right-6"
        >
          <VerdeMark className="h-7 w-7" />
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-[oklch(0.19_0.02_150)] px-3 py-1.5 text-[13px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 sm:block">
            {t.open}
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={t.title}
          className="fixed inset-x-3 bottom-3 z-40 flex max-h-[82svh] flex-col overflow-hidden border border-border/70 bg-background shadow-[0_28px_70px_-24px_rgba(0,0,0,0.45)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[27rem]"
          style={{ fontFamily: "var(--editorial-sans)" }}
        >
          <header className="flex items-center justify-between gap-3 bg-[oklch(0.19_0.02_150)] px-4 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-[var(--accent-lime)]/50">
                <VerdeMark className="h-[19px] w-[19px]" />
              </span>
              <div className="min-w-0">
                <div
                  className="truncate text-[17px] font-semibold leading-tight tracking-[-0.02em]"
                  style={{ fontFamily: "var(--editorial-display)" }}
                >
                  {t.title}
                </div>
                <div className="truncate text-[12.5px] font-medium text-white/65">{t.subtitle}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
              </svg>
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5" style={{ minHeight: "17rem" }}>
            {messages.length === 0 ? (
              <div>
                <p className="text-[15px] leading-[1.6] text-foreground/75">{t.empty}</p>
                <ul className="mt-4">
                  {t.starters.map((s) => (
                    <li key={s} className="border-b border-border/60 first:border-t">
                      <button
                        type="button"
                        onClick={() => send(s)}
                        className="group flex w-full items-center justify-between gap-4 py-3 text-left text-[14.5px] font-medium text-foreground/80 transition-colors hover:text-foreground"
                      >
                        <span className="min-w-0">{s}</span>
                        <span aria-hidden className="text-foreground/40 transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="space-y-5">
                {messages.map((m, i) => (
                  <li key={i}>
                    {m.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-sm bg-foreground px-3.5 py-2.5 text-[15px] leading-[1.55] text-background">
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-[15px] leading-[1.68] text-foreground/90">
                        {m.text ||
                          (streaming && i === messages.length - 1 ? (
                            <span className="inline-flex items-center gap-2 text-foreground/55">
                              <VerdeMark className="h-4 w-4 animate-pulse" />
                              {t.thinking}
                            </span>
                          ) : (
                            ""
                          ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border/60 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={t.placeholder}
                rows={1}
                className="max-h-32 min-h-[42px] flex-1 resize-none border border-border/70 bg-background px-3 py-2.5 text-[15px] leading-[1.45] outline-none transition-colors placeholder:text-foreground/45 focus:border-foreground/50"
                disabled={streaming}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={streaming || !input.trim()}
                className="h-[42px] shrink-0 rounded-full bg-[var(--accent-lime)] px-5 text-[14.5px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] transition-opacity disabled:opacity-40"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                {t.send}
              </button>
            </div>
            <p className="mt-2.5 text-[12.5px] font-medium leading-[1.4] text-foreground/50">{t.disclaimer}</p>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * VerdeMark - bespoke monogram: a "V" drawn as two sprout stems that meet at a
 * seed, with one unfurling leaf and a small measurement dot. Reads as growth
 * plus measurement, which is what the co-pilot does.
 */
function VerdeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      {/* leaf blade on the right stem */}
      <path
        d="M20.6 8.4c3.6-.6 6 .6 6.9 2.1-1.4 3.2-4.4 4.6-7.6 4.1-.9-2.2-.4-4.4.7-6.2z"
        fill="var(--accent-lime)"
        fillOpacity="0.9"
      />
      {/* V stems */}
      <path
        d="M6.6 7.2c1.9 6.1 4.1 11.6 6.9 16.8.7 1.3 1.4 1.3 2.1 0 1.9-3.5 3.5-7.1 4.9-11"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      {/* seed at the vertex */}
      <circle cx="14.6" cy="24.9" r="1.9" fill="var(--accent-lime)" />
      {/* measurement dot */}
      <circle cx="24.9" cy="19.6" r="1.5" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}
