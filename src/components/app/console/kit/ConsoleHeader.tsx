"use client";

import type { ReactNode } from "react";

/**
 * The page header. Title, one purpose line, and the actions slot.
 * The type scale matches the overview greeting so the surfaces read alike.
 */
export function ConsoleHeader({
  title,
  purpose,
  actions,
}: {
  title: string;
  purpose?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="vck-head">
      <div className="vck-head-copy">
        <h1>{title}</h1>
        {purpose && <p>{purpose}</p>}
      </div>
      {actions && <div className="vck-head-actions">{actions}</div>}
    </header>
  );
}
