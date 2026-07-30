"use client";

import type { ReactNode } from "react";
import type { Connector } from "./catalog";

type Locale = "en" | "el";

const STATE_WORD: Record<Connector["state"], { en: string; el: string }> = {
  live: { en: "Live", el: "Ενεργό" },
  oauth: { en: "Ready to link", el: "Έτοιμο για σύνδεση" },
  scheduled: { en: "Scheduled", el: "Προγραμματισμένο" },
};

const STATE_TONE: Record<Connector["state"], string> = {
  live: "live",
  oauth: "warn",
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
 * One service in the directory. The card states what the connection gives
 * the workspace and where the figures come from, so a connector is never a
 * logo with a button next to it.
 */
export function ConnectorTile({
  connector,
  locale,
  status,
  action,
  detail,
}: {
  connector: Connector;
  locale: Locale;
  /** Overrides the catalogue state word, for a link that is already made. */
  status?: { word: string; tone: "live" | "good" | "warn" | "bad" | "idle" };
  action?: ReactNode;
  /** Extra rows shown under the copy, such as the last sync of a live link. */
  detail?: ReactNode;
}) {
  const word = status?.word ?? STATE_WORD[connector.state][locale];
  const tone = status?.tone ?? STATE_TONE[connector.state];

  return (
    <article className="vci-tile">
      <header className="vci-tile-head">
        <ConnectorMark connector={connector} />
        <span className="vck-state" data-tone={tone}>
          <i aria-hidden="true" />
          {word}
        </span>
      </header>

      <h3 className="vci-tile-name">{connector.name}</h3>
      <p className="vci-tile-desc">{connector.desc[locale]}</p>

      <dl className="vci-tile-meta">
        <div>
          <dt>{locale === "el" ? "Δίνει" : "Gives you"}</dt>
          <dd>{connector.gives[locale]}</dd>
        </div>
        <div>
          <dt>{locale === "el" ? "Πηγή" : "Source"}</dt>
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

      {action && <footer className="vci-tile-foot">{action}</footer>}
    </article>
  );
}
