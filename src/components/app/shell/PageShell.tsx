"use client";

import { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { PageSkeleton } from "./Skeletons";

interface PageShellProps {
  children: ReactNode;
  /** Shows the skeleton scaffold instead of children. */
  loading?: boolean;
  /** Shows a retryable error plate instead of children. */
  error?: string | null;
  onRetry?: () => void;
  /** Rendered above the sections, outside the vertical rhythm reset. */
  header?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
}

/**
 * The workspace page container. Every /app route renders exactly one of
 * these. It owns the max width, the vertical rhythm between sections and
 * the three async states, so no page hand-rolls a spinner again.
 */
export const PageShell = ({
  children,
  loading = false,
  error = null,
  onRetry,
  header,
  toolbar,
  className = ""
}: PageShellProps) => {
  return (
    <div className={`mx-auto w-full max-w-6xl ${className}`}>
      {header}
      {toolbar}

      {loading ? (
        <PageSkeleton />
      ) : error ? (
        <EmptyState
          title="This page could not load"
          description={error}
          action={
            onRetry
              ? { label: "Try again", onClick: onRetry }
              : undefined
          }
          tone="critical"
        />
      ) : (
        <div className="space-y-8">{children}</div>
      )}
    </div>
  );
};
