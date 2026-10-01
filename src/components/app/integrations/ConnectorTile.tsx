"use client";

import { useId, useState, type ReactNode } from "react";
import type { Connector } from "./catalog";

type Locale = "en" | "el";

/** One headline fact shown on the closed card, so people know whether to open it. */
export type TileFact = { label: string; value: ReactNode; tone?: "warn" };

const STATE_WORD: Record<Connector["state"], { en: string; el: string }> = {
  live: { en: "Live", el: "Ενεργό" },
  oauth: { en: "Ready to link", el: "Έτοιμο για σύνδεση" },
  upload: { en: "Upload a bill", el: "Ανέβασμα λογαριασμού" },
  scheduled: { en: "Coming soon", el: "Έρχεται σύντομα" },
};

const STATE_TONE: Record<Connector["state"], string> = {
  live: "live",
  oauth: "warn",
  upload: "warn",
  scheduled: "idle",
};

/** The mark. Two cuts, one shown per colour mode, never a text fallback. */
export function ConnectorMark({
  connector,
  height,
}: {
  connector: Connector;
  height?: number;
}) {
  const h = height ?? connector.markHeight;
  return (
    <span className="vci-mark" aria-hidden="true">
      <img src={connector.light} alt="" data-mode="light" style={{ height: h }} />
      <img src={connector.dark} alt="" data-mode="dark" style={{ height: h }} />
    </span>
  );
}

/**
 * One service in the directory. Closed by default: name, one line on what it
 * does, up to three headline facts and the actions. Everything else (what it
 * gives, the source, bills, bank check, forwarding) opens under "Details".
 */
export function ConnectorTile({
  connector,
  locale,
  status,
  action,
  detail,
  facts,
}: {
  connector: Connector;
  locale: Locale;
  /** Overrides the catalogue state word, for a link that is already made. */
  status?: { word: string; tone: "live" | "good" | "warn" | "bad" | "idle" };
  action?: ReactNode;
  /** Extra content shown inside Details, such as the last sync of a live link. */
  detail?: ReactNode;
  facts?: TileFact[];
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const word = status?.word ?? STATE_WORD[connector.state][locale];
  const tone = status?.tone ?? STATE_TONE[connector.state];
  const el = locale === "el";

  return (
    <article className="vci-tile" data-open={open || undefined}>
      <header className="vci-tile-head">
        <ConnectorMark connector={connector} />
        <span className="vck-state" data-tone={tone}>
          <i aria-hidden="true" />
          {word}
        </span>
      </header>

      <div className="vci-tile-intro">
        <h3 className="vci-tile-name">{connector.name}</h3>
        <p className="vci-tile-desc">{connector.desc[locale]}</p>
      </div>

      {facts && facts.length > 0 && (
        <dl className="vci-tile-facts">
          {facts.slice(0, 3).map((f) => (
            <div key={f.label} data-tone={f.tone}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <button
        type="button"
        className="vci-tile-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? (el ? "Λιγότερα" : "Hide details") : el ? "Λεπτομέρειες" : "Details"}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id={panelId} className="vci-tile-panel" hidden={!open}>
        <dl className="vci-tile-meta">
          <div>
            <dt>{el ? "Τι δίνει" : "What you get"}</dt>
            <dd>{connector.gives[locale]}</dd>
          </div>
          <div>
            <dt>{el ? "Πηγή" : "Source"}</dt>
            <dd>
              {connector.href ? (
                <a href={connector.href} target="_blank" rel="noreferrer noopener">
                  {connector.source}
                </a>
              ) : (
                connector.source
              )}
            </dd>
          </div>
        </dl>
        {detail}
      </div>

      {action && <footer className="vci-tile-foot">{action}</footer>}
    </article>
  );
}
