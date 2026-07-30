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
    const controller = new AbortController();
    setLoading(true);

    /**
     * Reads the workspace once. The body is read as text first: a dev reload,
     * a proxy timeout or a gateway error can answer with an empty body or an
     * HTML page, and res.json() then throws "Unexpected end of JSON input",
     * which tells the user nothing. We turn those cases into a real message.
     */
    async function read(): Promise<ConsoleOverviewData> {
      const res = await fetch("/api/console/overview", {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        credentials: "include",
      });
      const text = await res.text();

      let body: unknown = null;
      if (text.trim().length > 0) {
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
      }

      const record = (body ?? {}) as { message?: string; error?: string };

      // No session: the workspace belongs to an account, so send them to sign in.
      if (res.status === 401 && typeof window !== "undefined") {
        const back = window.location.pathname + window.location.search;
        const locale = window.location.pathname.split("/")[1] || "en";
        window.location.replace(`/${locale}/auth?redirect=${encodeURIComponent(back)}`);
        throw new Error(record.message ?? "Please sign in to open your workspace.");
      }

      if (!res.ok) {
        throw new Error(
          record.message ??
            record.error ??
            `The console cannot reach your data (server answered ${res.status}).`,
        );
      }
      if (body === null) {
        throw new Error(
          "The console received an empty answer from the server. Please try again.",
        );
      }
      return body as ConsoleOverviewData;
    }


    (async () => {
      try {
        let body: ConsoleOverviewData;
        try {
          body = await read();
        } catch (first) {
          if (controller.signal.aborted) return;
          // One retry covers a dev rebuild or a dropped connection.
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (controller.signal.aborted) return;
          try {
            body = await read();
          } catch {
            throw first;
          }
        }
        if (!alive) return;
        setData(body);
        setError(null);
      } catch (err) {
        if (!alive || controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error && err.message
            ? err.message
            : "The console cannot reach your data.",
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [nonce]);

  const value = useMemo<ConsoleState>(
    () => ({ data, error, loading, refresh }),
    [data, error, loading, refresh],
  );

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export const useConsole = () => useContext(ConsoleContext);
