"use client";

import Link from "next/link";
import { useMemo } from "react";
import { findGlossaryMatches, type GlossaryEntry } from "@/data/learn/glossary";

type Props = {
  text: string;
  locale: "en" | "el";
  maxPerParagraph?: number;
  /** Avoid annotating the current pillar's own primary term. */
  excludeSlug?: string;
};

/**
 * Renders `text` with inline tooltip annotations for known glossary terms.
 * Uses <details>/<summary>-free approach: a keyboard-focusable <button> that
 * reveals the tooltip on hover/focus. Small "Read more" link deep-links to the
 * relevant pillar page when available.
 */
export default function GlossaryText({ text, locale, maxPerParagraph = 3, excludeSlug }: Props) {
  const matches = useMemo(() => {
    const found = findGlossaryMatches(text, maxPerParagraph + 3);
    return found.filter((m) => m.entry.slug !== excludeSlug).slice(0, maxPerParagraph);
  }, [text, maxPerParagraph, excludeSlug]);

  if (matches.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index > cursor) parts.push(<span key={`t-${i}`}>{text.slice(cursor, m.index)}</span>);
    parts.push(
      <GlossaryTerm
        key={`g-${i}`}
        raw={m.raw}
        entry={m.entry}
        locale={locale}
      />
    );
    cursor = m.index + m.length;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);

  return <>{parts}</>;
}

function GlossaryTerm({ raw, entry, locale }: { raw: string; entry: GlossaryEntry; locale: "en" | "el" }) {
  const definition = entry[locale];
  return (
    <span className="group relative inline-block whitespace-nowrap">
      <button
        type="button"
        className="cursor-help border-b border-dotted border-primary/60 text-inherit decoration-none transition hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-describedby={`gloss-${entry.term}`}
      >
        {raw}
      </button>
      <span
        id={`gloss-${entry.term}`}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-72 -translate-x-1/2 rounded-xl border bg-popover p-3 text-left text-sm font-normal leading-relaxed text-popover-foreground shadow-lg group-hover:block group-focus-within:pointer-events-auto group-focus-within:block sm:w-80"
      >
        <span className="mb-1 block eyebrow text-primary">
          {entry.term}
        </span>
        <span className="block whitespace-normal text-foreground/85">{definition}</span>
        <Link
          href={`/${locale}/glossary/${entry.termSlug}`}
          className="mt-2 inline-block whitespace-normal text-xs font-medium text-primary hover:underline"
        >
          {locale === "el" ? "Ορισμός →" : "Full definition →"}
        </Link>
        {entry.slug && (
          <Link
            href={`/${locale}/learn/${entry.slug}`}
            className="ml-3 mt-2 inline-block whitespace-normal text-xs font-medium text-foreground/70 hover:underline"
          >
            {locale === "el" ? "Οδηγός →" : "Guide →"}
          </Link>
        )}
      </span>
    </span>
  );
}
