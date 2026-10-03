"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type State = { admin: boolean; mode: "sandbox" | "live" | null };

/** Founder-only: create the plans in Stripe. Hidden for everyone else. */
export function AdminStripeTools() {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/billing/setup-prices")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.admin && setState(d))
      .catch(() => undefined);
  }, []);

  if (!state) return null;

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch("/api/admin/billing/setup-prices", { method: "POST" });
      const d = await r.json();
      if (!r.ok) setResult(d.error === "PAYMENTS_OFF" ? "Stripe key not found on the server." : `Failed (ref ${d.ref ?? "?"}).`);
      else setResult(`Done in ${d.mode === "live" ? "live" : "test"} mode. ${d.changes.filter((l: string) => l.startsWith("+")).length} new items, the rest already existed.`);
    } catch {
      setResult("Request failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <p className="text-sm font-medium">Admin · Stripe ({state.mode === "live" ? "live" : state.mode === "sandbox" ? "test" : "not connected"})</p>
      <p className="text-sm text-muted-foreground">Create or update the Pro, Enterprise and credit-pack prices in your Stripe account. Safe to press again.</p>
      <Button size="sm" onClick={run} disabled={busy || !state.mode}>{busy ? "Working…" : "Set up prices in Stripe"}</Button>
      {result && <p className="text-sm" role="status">{result}</p>}
    </div>
  );
}
