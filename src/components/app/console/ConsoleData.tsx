"use client";

/**
 * The workspace overview, shared by every /app page.
 *
 * It is one record in the shared workspace store (see workspace-store.ts), so
 * a write on any page that invalidates the store also refreshes the overview:
 * figures, agents, tasks and the activity feed stay the same everywhere.
 * `useConsole()` keeps its original shape for the pages that already use it.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ConsoleOverviewData } from "./types";
import { OVERVIEW_PATH, invalidateWorkspace, useWorkspaceResource } from "./workspace-store";

interface ConsoleState {
  data: ConsoleOverviewData | null;
  error: string | null;
  loading: boolean;
  /** Re-reads the workspace. Any mutation calls this when it finishes. */
  refresh: () => void;
}

const ConsoleContext = createContext<ConsoleState>({
  data: null,
  error: null,
  loading: true,
  refresh: () => {},
});

const refreshAll = () => invalidateWorkspace();

export function ConsoleDataProvider({ children }: { children: ReactNode }) {
  const overview = useWorkspaceResource<ConsoleOverviewData>(OVERVIEW_PATH);

  const value = useMemo<ConsoleState>(
    () => ({
      data: overview.data ?? null,
      error: overview.error,
      loading: overview.loading || (overview.refreshing && !overview.data),
      refresh: refreshAll,
    }),
    [overview.data, overview.error, overview.loading, overview.refreshing],
  );

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export const useConsole = () => useContext(ConsoleContext);
