"use client";

/**
 * One workspace read for the whole console.
 *
 * Every /app page needs the same records: the workspace, its agents, tasks,
 * obligations, connections and metrics. Fetching them per page would show a
 * different figure on each screen and a spinner on every navigation, so the
 * layout fetches once and hands the result down. Pages never call the API
 * directly; they call useConsole() and render the three states from it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ConsoleOverviewData } from "./types";

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

export function ConsoleDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ConsoleOverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch("/api/console/overview")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message ?? body?.error ?? "The console cannot reach your data");
        return body as ConsoleOverviewData;
      })
      .then((body) => {
        if (!alive) return;
        setData(body);
        setError(null);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  const value = useMemo<ConsoleState>(
    () => ({ data, error, loading, refresh }),
    [data, error, loading, refresh],
  );

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export const useConsole = () => useContext(ConsoleContext);
