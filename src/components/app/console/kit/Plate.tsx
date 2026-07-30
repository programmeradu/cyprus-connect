"use client";

import type { ReactNode } from "react";

/**
 * The plate: a sage glass veil that lies flat on the field. It is the only
 * surface in the console. Nothing is a white card, nothing casts a shadow.
 */
export function Plate({
  label,
  meta,
  metaTone,
  action,
  foot,
  span,
  tight = false,
  flush = false,
  children,
}: {
  /** The quiet label in the plate header. */
  label?: string;
  /** The figure or word on the right of the header. */
  meta?: ReactNode;
  metaTone?: "good" | "bad" | "warn";
  /** A control on the right of the header, in place of meta. */
  action?: ReactNode;
  /** A single quiet line under the content. */
  foot?: ReactNode;
  /** Columns to take inside a vck-grid. */
  span?: 2 | 3;
  tight?: boolean;
  /** Drops the padding so a table can reach the plate edge. */
  flush?: boolean;
  children: ReactNode;
}) {
  const classes = [
    "vck-plate",
    tight ? "vck-plate-tight" : "",
    flush ? "vck-plate-flush" : "",
    span ? `vck-span-${span}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      {(label || meta || action) && (
        <header className="vck-plate-head">
          <span>{label}</span>
          {action ?? (meta != null ? <strong data-tone={metaTone}>{meta}</strong> : null)}
        </header>
      )}
      <div className="vck-plate-body">{children}</div>
      {foot && <p className="vck-plate-foot">{foot}</p>}
    </section>
  );
}

/** The plate grid. Plates never set their own width. */
export function PlateGrid({
  columns = 2,
  children,
}: {
  columns?: 1 | 2 | 3;
  children: ReactNode;
}) {
  return <div className={`vck-grid vck-grid-${columns}`}>{children}</div>;
}
