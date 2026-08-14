"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;
let browserClientPromise: Promise<ReturnType<typeof createBrowserClient>> | null = null;

type SupabaseBrowserConfig = { url: string; publishableKey: string };

async function fetchBrowserConfig(): Promise<SupabaseBrowserConfig> {
  const response = await fetch("/api/auth/config", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Supabase Auth configuration is unavailable. Please refresh and try again.");
  }
  const config = (await response.json()) as Partial<SupabaseBrowserConfig>;
  if (!config.url || !config.publishableKey) {
    throw new Error("Supabase Auth configuration is incomplete. Please refresh and try again.");
  }
  return { url: config.url, publishableKey: config.publishableKey };
}

export async function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClientPromise ??= fetchBrowserConfig().then(({ url, publishableKey }) => {
    browserClient ??= createBrowserClient(url, publishableKey);
    return browserClient;
  });
  return browserClientPromise;
}
