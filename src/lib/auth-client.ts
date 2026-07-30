"use client"
import { createAuthClient } from "better-auth/react"
import { useEffect, useState, useCallback } from "react"

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
  fetchOptions: {
      onSuccess: (ctx) => {
        const authToken = ctx.response.headers.get("set-auth-token")
        // Better Auth bearer tokens include a signature after the dot. Keep
        // the complete value: removing the signature makes every API request
        // unauthenticated even while the browser session cookie is valid.
        if (authToken) {
          localStorage.setItem("bearer_token", authToken);
        }
      }
  }
});

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession(): SessionData {
   const [session, setSession] = useState<any>(null);
   const [isPending, setIsPending] = useState(true);
   const [isRefetching, setIsRefetching] = useState(false);
   const [error, setError] = useState<any>(null);

   const fetchSession = useCallback(async () => {
      try {
         // The browser session cookie is authoritative. An old or stale
         // local bearer token must never override a valid signed-in session.
         const res = await authClient.getSession();
         setSession(res.data);
         setError(null);
      } catch (err) {
         setSession(null);
         setError(err);
      } finally {
         setIsPending(false);
      }
   }, []);

   const refetch = useCallback(() => {
      setIsPending(true);
      setError(null);
      setIsRefetching(true);
      return fetchSession().finally(() => setIsRefetching(false));
   }, [fetchSession]);

   useEffect(() => {
      fetchSession();
   }, [fetchSession]);

   return { data: session, isPending, isRefetching, error, refetch };
}
