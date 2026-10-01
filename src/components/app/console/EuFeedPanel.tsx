"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import { Section, Empty } from "@/components/app/console/kit";

type Item = {
  id: string;
  title: string;
  titleLang: string;
  titleEl?: string | null;
  url: string;
  publishedAt: string;
  deadline: string | null;
  buyer: string | null;
  valueEur: number | null;
  actType: string | null;
  topics: string[];
  green: boolean;
};
type Feed = { items: Item[]; fetchedAt: string | null; total: number };

const FIRST = 6;

const COPY = {
  en: {
    tedTitle: "Public tenders in Cyprus",
    tedBody: "Open contract notices from Cyprus public buyers, from the EU's official tenders journal (TED). Energy, environmental and efficiency work is marked.",
    lawTitle: "New EU rules to watch",
    lawBody: "Regulations, directives and decisions published in the last six months on climate, energy and reporting, from EUR-Lex.",
    greenOnly: "Sustainability work only",
    all: "All tenders",
    allTopics: "All topics",
    closes: "Closes",
    days: (n: number) => (n === 0 ? "Closes today" : n === 1 ? "1 day left" : `${n} days left`),
    green: "Sustainability work",
    est: "Estimated",
    emptyTed: "No open tenders match right now",
    emptyLaw: "No new acts on these topics",
    emptyBody: "This list refreshes every hour from the official source.",
    updated: (d: string) => `Source checked ${d}`,
    more: (n: number) => `Show all ${n}`,
    fewer: "Show fewer",
    retry: "Retry",
    greekTitle: "Title in Greek",
  },
  el: {
    tedTitle: "Δημόσιοι διαγωνισμοί στην Κύπρο",
    tedBody: "Ανοιχτές προκηρύξεις κυπριακών αναθετουσών αρχών, από την επίσημη Ευρωπαϊκή Εφημερίδα Διαγωνισμών (TED). Σημειώνονται οι εργασίες ενέργειας, περιβάλλοντος και απόδοσης.",
    lawTitle: "Νέοι κανόνες της ΕΕ",
    lawBody: "Κανονισμοί, οδηγίες και αποφάσεις του τελευταίου εξαμήνου για κλίμα, ενέργεια και υποβολή εκθέσεων, από το EUR-Lex.",
    greenOnly: "Μόνο βιωσιμότητα",
    all: "Όλοι οι διαγωνισμοί",
    allTopics: "Όλα τα θέματα",
    closes: "Λήξη",
    days: (n: number) => (n === 0 ? "Λήγει σήμερα" : n === 1 ? "Απομένει 1 ημέρα" : `Απομένουν ${n} ημέρες`),
    green: "Εργασίες βιωσιμότητας",
    est: "Εκτίμηση",
    emptyTed: "Δεν υπάρχουν ανοιχτοί διαγωνισμοί τώρα",
    emptyLaw: "Δεν υπάρχουν νέες πράξεις σε αυτά τα θέματα",
    emptyBody: "Η λίστα ανανεώνεται κάθε ώρα από την επίσημη πηγή.",
    updated: (d: string) => `Έλεγχος πηγής ${d}`,
    more: (n: number) => `Όλα (${n})`,
    fewer: "Λιγότερα",
    retry: "Ξανά",
    greekTitle: "Τίτλος στα ελληνικά",
  },
};

const daysUntil = (iso: string, today: string) => Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);

/**
 * One panel for both official EU feeds. `source="ted"` sits in the Action plan
 * next to funding; `source="eurlex"` sits on Deadlines next to obligations.
 */
export function EuFeedPanel({ source }: { source: "ted" | "eurlex" }) {
  const lang = useLocale() === "el" ? "el" : "en";
  const c = COPY[lang];
  const fmtLocale = lang === "el" ? "el-CY" : "en-GB";
  const [greenOnly, setGreenOnly] = useState(true);
  const [topic, setTopic] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const feed = useWorkspaceResource<Feed>(`/api/console/eu-feeds?source=${source}`);
  const today = new Date().toISOString().slice(0, 10);

  const topics = useMemo(() => {
    const n = new Map<string, number>();
    for (const i of feed.data?.items ?? []) for (const t of i.topics) n.set(t, (n.get(t) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1]);
  }, [feed.data]);

  const rows = useMemo(() => {
    const items = feed.data?.items ?? [];
    if (source === "ted") return greenOnly ? items.filter((i) => i.green) : items;
    return topic ? items.filter((i) => i.topics.includes(topic)) : items;
  }, [feed.data, source, greenOnly, topic]);
  const shown = showAll ? rows : rows.slice(0, FIRST);
  const greenCount = (feed.data?.items ?? []).filter((i) => i.green).length;
  const date = (iso: string) => new Date(iso).toLocaleDateString(fmtLocale, { day: "numeric", month: "short", year: "numeric" });
  const money = (v: number) => new Intl.NumberFormat(fmtLocale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  const chip = (active: boolean) =>
    `vck-btn ${active ? "vck-btn-primary" : ""} whitespace-nowrap`;

  return (
    <Section id={source === "ted" ? "tenders" : "eu-rules"} title={source === "ted" ? c.tedTitle : c.lawTitle} description={source === "ted" ? c.tedBody : c.lawBody}>
      {feed.data && (feed.data.items.length > 0) && (
        <div className="mb-3 flex flex-wrap items-center gap-2" role="group">
          {source === "ted" ? (
            <>
              <button type="button" className={chip(greenOnly)} aria-pressed={greenOnly} onClick={() => setGreenOnly(true)}>{c.greenOnly} · {greenCount}</button>
              <button type="button" className={chip(!greenOnly)} aria-pressed={!greenOnly} onClick={() => setGreenOnly(false)}>{c.all} · {feed.data.items.length}</button>
            </>
          ) : (
            <>
              <button type="button" className={chip(topic === null)} aria-pressed={topic === null} onClick={() => setTopic(null)}>{c.allTopics} · {feed.data.items.length}</button>
              {topics.slice(0, 6).map(([t, n]) => (
                <button key={t} type="button" className={chip(topic === t)} aria-pressed={topic === t} onClick={() => setTopic(t)}>{t} · {n}</button>
              ))}
            </>
          )}
        </div>
      )}

      {feed.loading && !feed.data ? (
        <div className="vck-card p-4"><p className="vck-meta">…</p></div>
      ) : feed.error ? (
        <Empty tone="warn" title={feed.error} action={{ label: c.retry, onClick: feed.reload }} />
      ) : rows.length === 0 ? (
        <Empty title={source === "ted" ? c.emptyTed : c.emptyLaw} body={c.emptyBody} />
      ) : (
        <>
          <ul className="vck-card divide-y divide-[var(--vc-rule)]">
            {shown.map((i) => {
              const d = i.deadline ? daysUntil(i.deadline, today) : null;
              return (
                <li key={i.id} className="flex flex-col gap-1.5 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <a
                      href={lang === "el" && i.titleEl ? i.url.replace("/legal-content/EN/", "/legal-content/EL/") : i.url}
                      target="_blank"
                      rel="noreferrer"
                      lang={lang === "el" && i.titleEl ? "el" : i.titleLang}
                      className="font-medium leading-snug break-words hover:underline"
                    >
                      {lang === "el" && i.titleEl ? i.titleEl : i.title}
                    </a>
                    <p className="vck-meta mt-1 break-words">
                      {source === "ted"
                        ? [i.buyer, i.valueEur ? `${c.est} ${money(i.valueEur)}` : null, i.green ? c.green : null].filter(Boolean).join(" · ")
                        : [i.actType, ...i.topics].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    {source === "ted" && i.deadline ? (
                      <>
                        <p className="vck-num text-sm">{date(i.deadline)}</p>
                        <p className={`vck-meta ${d !== null && d <= 7 ? "text-[var(--vc-warn,inherit)]" : ""}`}>{c.days(Math.max(0, d ?? 0))}</p>
                      </>
                    ) : (
                      <p className="vck-num text-sm">{date(i.publishedAt)}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {rows.length > FIRST ? (
              <button type="button" className="vck-btn" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
                {showAll ? c.fewer : c.more(rows.length)}
              </button>
            ) : <span />}
            {feed.data?.fetchedAt && (
              <p className="vck-meta">{c.updated(new Date(feed.data.fetchedAt).toLocaleString(fmtLocale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))} · {source === "ted" ? "TED" : "EUR-Lex"}</p>
            )}
          </div>
        </>
      )}
    </Section>
  );
}
