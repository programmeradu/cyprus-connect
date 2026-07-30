"use client";

/**
 * The console page frame.
 *
 * Every /app route renders exactly one of these. It owns the deck width,
 * the rhythm between plates, and the three states every asynchronous
 * surface must ship: skeleton, error with a retry, and empty.
 */

import type { ReactNode } from "react";
import { ConsoleHeader } from "./ConsoleHeader";
import { DeckSkeleton } from "./Skeleton";
import { Empty } from "./Empty";

interface ConsolePageProps {
  /** Page title. One line, sentence case, no product name. */
  title: string;
  /** One sentence saying what the page is for. */
  purpose?: string;
  /** Primary action first. One primary per page. */
  actions?: ReactNode;
  /** Rendered between the header and the deck: tabs, filters, a range. */
  toolbar?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: ReactNode;
}

export function ConsolePage({
  title,
  purpose,
  actions,
  toolbar,
  loading = false,
  error = null,
  onRetry,
  children,
}: ConsolePageProps) {
  return (
    <div className="vck-page">
      <ConsoleHeader title={title} purpose={purpose} actions={actions} />
      {toolbar}

      {loading ? (
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
}
