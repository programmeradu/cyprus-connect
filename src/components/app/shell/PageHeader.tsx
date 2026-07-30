"use client";

import { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  /** One line explaining what this page is for. Always worth writing. */
  purpose?: string;
  actions?: ReactNode;
  breadcrumb?: Crumb[];
  /** Right-aligned metadata, e.g. "Updated 4 Jul 2026". */
  meta?: ReactNode;
}

/**
 * The single page header used by every /app route. It renders the console
 * kit header markup, so the title, the purpose line and the actions read
 * the same on the overview and on every other page.
 */
export const PageHeader = ({
  title,
  purpose,
  actions,
  breadcrumb,
  meta
}: PageHeaderProps) => {
  return (
    <>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="vck-crumb">
          <ol>
            {breadcrumb.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`}>
                {index > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href as never}>{crumb.label}</Link>
                ) : (
                  <strong>{crumb.label}</strong>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <header className="vck-head">
        <div className="vck-head-copy">
          <h1>{title}</h1>
          {purpose && <p>{purpose}</p>}
        </div>

        {(actions || meta) && (
          <div className="vck-head-actions">
            {meta && <span className="vck-head-meta">{meta}</span>}
            {actions}
          </div>
        )}
      </header>
    </>
  );
};
