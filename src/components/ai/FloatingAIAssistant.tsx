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
      {/* Trigger — restrained: solid foreground disc, leaf mark, no glow/pulse/gradient */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open}
          className="group fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-foreground text-background shadow-[0_10px_24px_-12px_rgba(0,0,0,0.45)] ring-1 ring-foreground/10 transition-transform hover:scale-[1.03] sm:bottom-6 sm:right-6"
        >
          <VerdeMark className="h-[22px] w-[22px]" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-3 z-40 flex max-h-[80vh] flex-col overflow-hidden rounded-sm border border-foreground/15 bg-background shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[26rem]">
          <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
                <VerdeMark className="h-[14px] w-[14px]" />
              </span>
              <div className="min-w-0">
                <div
                  className="truncate text-sm font-semibold tracking-tight"
                  style={{ fontFamily: "var(--editorial-serif)" }}
                >
                  {t.title}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {t.subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="grid h-7 w-7 place-items-center text-muted-foreground transition-colors hover:text-foreground"
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
              <ul className="space-y-4">
                {messages.map((m, i) => (
                  <li key={i}>
                    {m.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-sm bg-foreground px-3 py-2 text-sm text-background">
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {m.text ||
                          (streaming && i === messages.length - 1 ? (
                            <span className="italic text-muted-foreground">
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
                className="min-h-[38px] max-h-32 flex-1 resize-none rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                disabled={streaming}
              />
              <button
                type="button"
                onClick={send}
                disabled={streaming || !input.trim()}
                className="h-[38px] rounded-sm bg-foreground px-4 text-xs font-medium tracking-tight text-background transition-opacity disabled:opacity-40"
              >
                {t.send}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * VerdeMark — cute AI + sustainability glyph.
 * A soft leaf silhouette cradling an orbiting AI spark.
 */
function VerdeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Leaf */}
      <path
        d="M20 4c0 8-5.5 13-13 13-1 0-2-.1-3-.4C4.5 9.5 10.5 4 20 4z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      {/* Leaf vein */}
      <path d="M5 19C9 14 14 9 19 5" strokeOpacity="0.9" />
      {/* Orbiting spark */}
      <circle cx="17.5" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="6.5" r="3.2" strokeOpacity="0.55" />
    </svg>
  );
}
