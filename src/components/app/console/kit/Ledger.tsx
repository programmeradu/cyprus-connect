"use client";

import type { ReactNode } from "react";

export interface LedgerItem {
  id: string;
  /** The row heading. Wraps; never truncated. */
  title: ReactNode;
  /** One supporting line. */
  detail?: ReactNode;
  /** A third, quieter line: provenance, owner, cadence. */
  note?: ReactNode;
  /** The right-hand figure or state word. */
  value?: ReactNode;
  valueTone?: "good" | "bad" | "warn" | "live" | "idle";
  /** A small mark on the left: a glyph, an initial, a status dot. */
  lead?: ReactNode;
  onClick?: () => void;
  href?: string;
}

/**
 * The hairline-ruled row list. Agents, obligations, events, connections and
 * runs all share this shape, so a record reads the same on every page.
 */
export function Ledger({ items, empty }: { items: LedgerItem[]; empty?: ReactNode }) {
  if (items.length === 0) {
    return <p className="vck-quiet">{empty ?? "Nothing is recorded here yet."}</p>;
  }

  return (
    <ul className="vck-ledger">
      {items.map((item) => {
        const inner = (
          <>
            {item.lead && <span className="vck-ledger-lead">{item.lead}</span>}
            <span className="vck-ledger-copy">
              <strong>{item.title}</strong>
              {item.detail && <small>{item.detail}</small>}
              {item.note && <em>{item.note}</em>}
            </span>
            {item.value != null && (
              <span className="vck-ledger-value" data-tone={item.valueTone}>
                {item.value}
              </span>
            )}
          </>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <a href={item.href}>{inner}</a>
            ) : item.onClick ? (
              <button type="button" onClick={item.onClick}>
                {inner}
              </button>
            ) : (
              <div>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
