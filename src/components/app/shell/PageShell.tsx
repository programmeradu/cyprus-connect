"use client";

import { ReactNode } from "react";
import { DeckSkeleton } from "@/components/app/console/kit/Skeleton";
import { Empty } from "@/components/app/console/kit/Empty";

interface PageShellProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /**
   * No account is behind this view. The page has nothing to read, so it
   * says so and offers the way in rather than holding a skeleton open.
   */
  signedOut?: boolean;
  header?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
}

/**
 * The workspace page container.
 *
 * This is the console kit's ConsolePage with a slot-shaped signature, kept
 * so the routes written before the kit landed hold their contract. New
 * pages import ConsolePage from @/components/app/console/kit instead.
 */
export const PageShell = ({
  children,
  loading = false,
  error = null,
  onRetry,
  signedOut = false,
  header,
  toolbar,
  className = ""
}: PageShellProps) => {
  return (
    <div className={`vck-page ${className}`}>
      {header}
      {toolbar}

      {signedOut ? (
        <Empty
          title="No workspace is signed in"
          body="This page reads the figures held against your account. Sign in, or open the console overview to see the demo workspace."
          action={{ label: "Sign in", href: "/auth" }}
        />
      ) : loading ? (
        <DeckSkeleton />
      ) : error ? (
        <Empty
          tone="bad"
          title="This page could not load"
          body={error}
          action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
        />
      ) : (
        <div className="vck-deck">{children}</div>
      )}
    </div>
  );
};
