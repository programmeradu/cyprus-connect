"use client";

import { ReactNode } from "react";

interface SectionProps {
  /** Short section label, sentence case. */
  title?: string;
  description?: string;
  /** Right-aligned action, usually a quiet button or a link. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A titled block inside a page. The deck owns the space between sections,
 * so a Section never sets an outer margin.
 */
export const Section = ({
  title,
  description,
  action,
  children,
  className = ""
}: SectionProps) => {
  return (
    <section className={`vck-section ${className}`}>
      {(title || action) && (
        <div className="vck-section-head">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action && <div className="vck-section-action">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
