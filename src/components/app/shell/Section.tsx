"use client";

import { ReactNode } from "react";

interface SectionProps {
  /** Short section label, sentence case. */
  title?: string;
  description?: string;
  /** Right-aligned action, usually a ghost button or link. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A titled block inside a page. Spacing between sections is owned by
 * PageShell, so a Section never sets its own outer margin.
 */
export const Section = ({
  title,
  description,
  action,
  children,
  className = ""
}: SectionProps) => {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[1.0625rem] leading-snug break-words">
                {title}
              </h2>
            )}
            {description && (
              <p className="app-meta mt-1 max-w-[68ch] break-words">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
