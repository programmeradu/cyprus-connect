"use client";

import type { ReactNode } from "react";

/**
 * A designed empty state: what is missing, why, and one thing to do.
 * "No data" alone is not allowed anywhere in the console.
 */
export function Empty({
  title,
  body,
  action,
  tone = "quiet",
  children,
}: {
  title: string;
  body?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  tone?: "quiet" | "bad" | "warn";
  children?: ReactNode;
}) {
  return (
    <div className="vck-empty" data-tone={tone} role={tone === "bad" ? "alert" : undefined}>
      <strong>{title}</strong>
      {body && <p>{body}</p>}
      {children}
      {action &&
        (action.href ? (
          <a className="vck-btn" href={action.href}>
            {action.label}
          </a>
        ) : (
          <button type="button" className="vck-btn" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

/** Shown wherever a model call would run but no key is configured. */
export function AiUnavailable({ what = "This surface" }: { what?: string }) {
  return (
    <Empty
      tone="warn"
      title="The model is not available"
      body={`${what} needs a language model key. Add one in workspace settings, then run it again.`}
      action={{ label: "Open settings", href: "/app/settings" }}
    />
  );
}
