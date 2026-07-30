"use client";

import type { ReactNode } from "react";

/**
 * A reading: the only way a figure gets rendered large in the console.
 * Label above, value with its unit, one line of movement or provenance.
 */
export function Reading({
  label,
  value,
  unit,
  delta,
  tone,
  note,
  onClick,
  active,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: string;
  tone?: "good" | "bad" | "flat" | "warn";
  note?: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <>
      <small>{label}</small>
      <strong>
        {value}
        {unit && <em>{unit}</em>}
      </strong>
      {(delta || note) && (
        <span className="vck-reading-foot">
          {delta && <b data-tone={tone}>{delta}</b>}
          {note}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="vck-reading" data-active={active} onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className="vck-reading">{body}</div>;
}

/** The row of readings that opens most pages. */
export const ReadingRail = ({ children }: { children: ReactNode }) => (
  <div className="vck-reading-rail">{children}</div>
);
