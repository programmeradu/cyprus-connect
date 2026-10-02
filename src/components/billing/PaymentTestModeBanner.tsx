"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { PaymentsStatus } from "@/lib/stripe/env";

/**
 * Tells people on the Plan page when payments are in test mode or not
 * switched on yet. The server decides the mode from the Stripe key.
 */
export function PaymentTestModeBanner() {
  const t = useTranslations("billing.dashboard");
  const [status, setStatus] = useState<PaymentsStatus | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stripe/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => alive && setStatus(s))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!status || status.mode === "live") return null;
  return (
    <div role="status" className="w-full border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-center text-sm font-medium text-amber-900 dark:text-amber-200">
      {status.configured ? t("testMode") : t("paymentsOffBanner")}
    </div>
  );
}
