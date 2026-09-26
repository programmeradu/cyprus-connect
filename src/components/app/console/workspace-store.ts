"use client";

/**
 * The one client-side information system for /app.
 *
 * Every page reads workspace data through `useWorkspaceResource(path)` and
 * writes through `useWorkspaceAction()`. Both go through one cache keyed by
 * API path, so:
 *   - two pages asking for the same record share one request and one copy;
 *   - going back to a page shows what is known at once and refreshes quietly;
 *   - a write on any page invalidates the records it touched, and every page
 *     that shows them (and the dashboard overview) re-reads.
 *
 * Pages never call `fetch` directly; `tests/app-data-guard.test.ts` enforces it.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export const OVERVIEW_PATH = "/api/console/overview";

/** A record older than this is re-read in the background when a page opens it. */
const FRESH_MS = 30_000;

export class WorkspaceRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/* --------------------------------------------------------------- transport */

function bearer(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("bearer_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function signInRedirect() {
  if (typeof window === "undefined") return;
  const back = window.location.pathname + window.location.search;
  const locale = window.location.pathname.split("/")[1] || "en";
  window.location.replace(`/${locale}/auth?redirect=${encodeURIComponent(back)}`);
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON-serialisable body, or FormData for uploads. */
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * The single transport. Reads the body as text first so an empty answer or an
 * HTML error page becomes a readable message instead of a JSON parse error.
 */
export async function workspaceRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(path, {
    method,
    signal,
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...bearer(),
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = null;
  if (text.trim()) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  const record = (parsed ?? {}) as { message?: string; error?: string; ref?: string };

  if (res.status === 401) {
    signInRedirect();
    throw new WorkspaceRequestError(record.message ?? "Please sign in to open your workspace.", 401);
  }
  if (!res.ok) {
    const base =
      record.message ??
      (typeof record.error === "string" && record.error.includes(" ") ? record.error : null) ??
      `The server could not complete this (answer ${res.status}).`;
    throw new WorkspaceRequestError(record.ref && !base.includes(record.ref) ? `${base} Reference ${record.ref}.` : base, res.status);
  }
  if (parsed === null && text.trim()) {
    throw new WorkspaceRequestError("The server sent an answer the app cannot read. Please try again.", res.status);
  }
  return parsed as T;
}

/* ------------------------------------------------------------------- cache */

interface Entry {
  data: unknown;
  error: string | null;
  loading: boolean;
  fetchedAt: number;
  inflight: Promise<void> | null;
  subscribers: number;
}

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version++;
  for (const l of listeners) l();
}

function entry(path: string): Entry {
  let e = cache.get(path);
  if (!e) {
    e = { data: undefined, error: null, loading: false, fetchedAt: 0, inflight: null, subscribers: 0 };
    cache.set(path, e);
  }
  return e;
}

/** Reads a path into the cache. Concurrent callers share one request. */
export function loadResource(path: string, { retry = true } = {}): Promise<void> {
  const e = entry(path);
  if (e.inflight) return e.inflight;
  e.loading = true;
  notify();
  e.inflight = (async () => {
    try {
      let data: unknown;
      try {
        data = await workspaceRequest(path);
      } catch (first) {
        // One retry covers a dropped connection or a dev rebuild; a refusal is final.
        if (!retry || (first instanceof WorkspaceRequestError && first.status < 500 && first.status !== 0)) throw first;
        await new Promise((r) => setTimeout(r, 600));
        data = await workspaceRequest(path);
      }
      e.data = data;
      e.error = null;
      e.fetchedAt = Date.now();
    } catch (err) {
      e.error = err instanceof Error && err.message ? err.message : "The app cannot reach your data.";
    } finally {
      e.loading = false;
      e.inflight = null;
      notify();
    }
  })();
  return e.inflight;
}

/**
 * Marks records as changed. Every path equal to, or starting with, one of the
 * prefixes is re-read if a page is showing it, otherwise dropped. The
 * overview is always included: it carries the activity feed every page and
 * agent reads.
 */
export function invalidateWorkspace(prefixes: string[] = []) {
  const all = [...prefixes, OVERVIEW_PATH];
  for (const [path, e] of cache) {
    if (!all.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`) || path.startsWith(`${p}?`))) continue;
    if (e.subscribers > 0) void loadResource(path, { retry: false });
    else cache.delete(path);
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export interface Resource<T> {
  data: T | undefined;
  error: string | null;
  /** True only while nothing is known yet; background refreshes keep old data on screen. */
  loading: boolean;
  refreshing: boolean;
  reload: () => void;
}

/** Subscribes a page to one workspace record. Pass null to wait (e.g. no id yet). */
export function useWorkspaceResource<T>(path: string | null): Resource<T> {
  useSyncExternalStore(subscribe, () => version, () => 0);

  useEffect(() => {
    if (!path) return;
    const e = entry(path);
    e.subscribers++;
    if (!e.inflight && (e.data === undefined || Date.now() - e.fetchedAt > FRESH_MS)) void loadResource(path);
    return () => {
      e.subscribers--;
    };
  }, [path]);

  const e = path ? cache.get(path) : undefined;
  const reload = useCallback(() => {
    if (path) void loadResource(path);
  }, [path]);

  return {
    data: e?.data as T | undefined,
    error: e?.data === undefined ? (e?.error ?? null) : null,
    loading: !!path && (e?.data === undefined && !e?.error),
    refreshing: !!e?.loading && e.data !== undefined,
    reload,
  };
}

/* ----------------------------------------------------------------- writes */

export interface ActionOptions extends RequestOptions {
  /** API prefixes whose records this write changes. */
  invalidates?: string[];
}

/**
 * The one way a page changes workspace data. Tracks its own busy/error state,
 * and after success invalidates the records it touched so every page updates.
 */
export function useWorkspaceAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(path: string, options: ActionOptions = {}): Promise<T | null> => {
    setBusy(true);
    setError(null);
    try {
      const result = await workspaceRequest<T>(path, { method: "POST", ...options });
      invalidateWorkspace(options.invalidates ?? []);
      return result;
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "That did not work. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  return { run, busy, error, clearError: useCallback(() => setError(null), []) };
}
