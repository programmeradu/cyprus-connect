"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionData = {
  user: { id: string; email: string; name: string; image: string | null; emailVerified: boolean };
  session: { id: string; expiresAt: string | null };
} | null;

function rememberAccessToken(token: string | undefined) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("bearer_token", token);
  else localStorage.removeItem("bearer_token");
}

async function resolveVuneliSession(): Promise<{ data: SessionData; error: Error | null }> {
  const supabase = await getSupabaseBrowserClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    rememberAccessToken(undefined);
    return { data: null, error: error || null };
  }

  rememberAccessToken(session.access_token);
  const response = await fetch("/api/auth/session", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) {
    return { data: null, error: new Error("Unable to resolve the Vuneli user profile.") };
  }
  const payload = await response.json();
  return { data: payload.data ?? null, error: null };
}

export const authClient = {
  signUp: {
    email: async ({ email, name, password }: { email: string; name: string; password: string }) => {
      const redirectTo = `${window.location.origin}/en/auth/callback?next=/en/app`;
      return (await getSupabaseBrowserClient()).auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: redirectTo },
      });
    },
  },
  signIn: {
    email: async ({ email, password }: { email: string; password: string; rememberMe?: boolean; callbackURL?: string }) => {
      const result = await (await getSupabaseBrowserClient()).auth.signInWithPassword({ email, password });
      rememberAccessToken(result.data.session?.access_token);
      return result;
    },
    social: async ({ provider, callbackURL }: { provider: "google"; callbackURL?: string }) => {
      const redirectTo = `${window.location.origin}/en/auth/callback?next=${encodeURIComponent(callbackURL || "/en/app")}`;
      return (await getSupabaseBrowserClient()).auth.signInWithOAuth({ provider, options: { redirectTo } });
    },
  },
  resetPassword: async ({ email, redirectTo }: { email: string; redirectTo?: string }) =>
    (await getSupabaseBrowserClient()).auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/en/auth/callback?next=/en/auth?reset=1`,
    }),
  updatePassword: async (password: string) => (await getSupabaseBrowserClient()).auth.updateUser({ password }),
  getSession: resolveVuneliSession,
  signOut: async () => {
    const result = await (await getSupabaseBrowserClient()).auth.signOut();
    rememberAccessToken(undefined);
    return result;
  },
};

export function useSession() {
  const [session, setSession] = useState<SessionData>(null);
  const [isPending, setIsPending] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const result = await resolveVuneliSession();
      setSession(result.data);
      setError(result.error);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err : new Error("Unable to load session."));
    } finally {
      setIsPending(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsPending(true);
    setIsRefetching(true);
    await fetchSession();
    setIsRefetching(false);
  }, [fetchSession]);

  useEffect(() => {
    void fetchSession();
    let unsubscribe: (() => void) | undefined;
    void getSupabaseBrowserClient().then((supabase) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        void fetchSession();
      });
      unsubscribe = () => subscription.unsubscribe();
    });
    return () => unsubscribe?.();
  }, [fetchSession]);

  return { data: session, isPending, isRefetching, error, refetch };
}
