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
 * The single page header used by every /app route. Title on the editorial
 * display face, one purpose line, actions on the right, closed by a hairline.
 * The account menu lives in the sidebar footer, not here.
 */
export const PageHeader = ({
  title,
  purpose,
  actions,
  breadcrumb,
  meta
}: PageHeaderProps) => {
  return (
    <header className="mb-6 border-b border-[var(--app-rule)] pb-5">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] font-medium text-muted-foreground">
            {breadcrumb.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href as never}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] leading-tight break-words">{title}</h1>
          {purpose && (
            <p className="mt-1.5 max-w-[68ch] text-[0.9375rem] leading-relaxed text-muted-foreground break-words">
              {purpose}
            </p>
          )}
        </div>

        {(actions || meta) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {meta && <span className="app-meta mr-1">{meta}</span>}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};
