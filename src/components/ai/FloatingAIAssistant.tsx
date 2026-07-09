"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

type Message = { role: "user" | "assistant"; text: string };

const COPY = {
  en: {
    open: "Ask VerdeIQ",
    title: "Verde",
    subtitle: "Sustainability co-pilot",
    placeholder: "Ask about CBAM, CSRD, VSME, energy…",
    send: "Send",
    thinking: "Thinking…",
    close: "Close",
    empty:
      "I can help with EU sustainability regulations, carbon accounting, and Cyprus-specific compliance. What are you working on?",
    error: "Something went wrong. Try again.",
  },
  el: {
    open: "Ρωτήστε τη VerdeIQ",
    title: "Verde",
    subtitle: "Σύμβουλος βιωσιμότητας",
    placeholder: "Ρωτήστε για CBAM, CSRD, VSME, ενέργεια…",
    send: "Αποστολή",
    thinking: "Σκέφτομαι…",
    close: "Κλείσιμο",
    empty:
      "Μπορώ να βοηθήσω με κανονισμούς ΕΕ, ανθρακικό αποτύπωμα και συμμόρφωση Κύπρου. Πάνω σε τι δουλεύετε;",
    error: "Κάτι πήγε στραβά. Δοκιμάστε ξανά.",
  },
} as const;

const SYSTEM_CONTEXT =
  "You are Verde, VerdeIQ's sustainability co-pilot. Help SMEs — especially Cyprus and EU businesses — with CBAM, CSRD, VSME, EU Taxonomy, GHG Protocol scopes, and carbon reduction. Be concise, editorial, and specific. Never invent regulations. Answer in the same language as the user's message.";

/**
 * FloatingAIAssistant — bottom-right chat on marketing pages.
 * Hidden on /app/* routes. Streams from /api/gemini/stream.
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

  // Hide on authed app, auth pages, and any /api routes
  const hidden = /\/app(\/|$)|\/auth(\/|$)/.test(pathname);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const send = async () => {
    const prompt = input.trim();
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
      {/* Trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open}
          className="group fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6"
        >
          <span className="relative flex h-14 w-14 items-center justify-center">
            {/* Soft glow */}
            <span
              className="pointer-events-none absolute inset-0 rounded-full opacity-70 blur-xl transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(closest-side, oklch(0.72 0.18 145 / 0.55), transparent 70%)",
              }}
              aria-hidden
            />
            {/* Animated gradient ring */}
            <span
              className="absolute inset-0 rounded-full p-[1.5px] transition-transform duration-500 group-hover:scale-[1.04]"
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, oklch(0.78 0.16 150), oklch(0.62 0.18 165), oklch(0.86 0.11 105), oklch(0.78 0.16 150))",
              }}
              aria-hidden
            >
              <span className="block h-full w-full rounded-full bg-background/85 backdrop-blur-xl" />
            </span>
            {/* Core mark */}
            <span
              className="relative grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold text-primary-foreground shadow-[0_6px_20px_-6px_oklch(0.72_0.18_145/0.6)]"
              style={{
                background:
                  "linear-gradient(140deg, oklch(0.78 0.16 150), oklch(0.55 0.17 170))",
                fontFamily: "var(--editorial-serif)",
              }}
            >
              V
            </span>
            {/* Presence dot */}
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_2px_var(--background)]">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
            </span>
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed inset-x-3 bottom-3 z-40 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background/80 shadow-[0_30px_80px_-20px_oklch(0.2_0.05_170/0.45)] backdrop-blur-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[26rem]"
          style={{
            backgroundImage:
              "radial-gradient(120% 60% at 0% 0%, oklch(0.78 0.16 150 / 0.10), transparent 60%), radial-gradient(120% 60% at 100% 0%, oklch(0.62 0.18 250 / 0.08), transparent 60%)",
          }}
        >
          <header className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold text-primary-foreground shadow-[0_4px_14px_-4px_oklch(0.72_0.18_145/0.7)]"
                style={{
                  background:
                    "linear-gradient(140deg, oklch(0.78 0.16 150), oklch(0.55 0.17 170))",
                  fontFamily: "var(--editorial-serif)",
                }}
              >
                V
              </span>
              <div className="min-w-0">
                <div
                  className="truncate text-sm font-semibold tracking-tight"
                  style={{ fontFamily: "var(--editorial-serif)" }}
                >
                  {t.title}
                </div>
                <div className="flex items-center gap-1.5 truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {t.subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              ×
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 text-sm"
            style={{ minHeight: "16rem" }}
          >
            {messages.length === 0 ? (
              <p className="leading-relaxed text-muted-foreground">{t.empty}</p>
            ) : (
              <ul className="space-y-3">
                {messages.map((m, i) => (
                  <li key={i}>
                    {m.role === "user" ? (
                      <div className="flex justify-end">
                        <div
                          className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm text-primary-foreground shadow-sm"
                          style={{
                            background:
                              "linear-gradient(140deg, oklch(0.78 0.16 150), oklch(0.55 0.17 170))",
                          }}
                        >
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-border/50 bg-background/60 px-3.5 py-2 leading-relaxed text-foreground/90 backdrop-blur">
                          {m.text ||
                            (streaming && i === messages.length - 1 ? (
                              <span className="italic text-muted-foreground">
                                {t.thinking}
                              </span>
                            ) : (
                              ""
                            ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border/50 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background/70 p-1.5 pl-3 transition-colors focus-within:border-foreground/40">
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
                className="min-h-[34px] max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/70"
                disabled={streaming}
              />
              <button
                type="button"
                onClick={send}
                disabled={streaming || !input.trim()}
                aria-label={t.send}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-[0_6px_16px_-6px_oklch(0.72_0.18_145/0.6)] transition-all hover:scale-[1.04] disabled:opacity-40 disabled:hover:scale-100"
                style={{
                  background:
                    "linear-gradient(140deg, oklch(0.78 0.16 150), oklch(0.55 0.17 170))",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 12l16-8-6 18-3-8-7-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
