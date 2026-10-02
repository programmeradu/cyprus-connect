"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type Sub = { status?: string; planId?: string };

/**
 * Grace notice on Home when a payment failed or an invoice is overdue. The
 * plan keeps working; this just asks the person to sort the payment out.
 */
export function BillingNotice() {
  const t = useTranslations("billing.dashboard");
  const locale = useLocale();
  const [sub, setSub] = useState<Sub | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stripe/subscription", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setSub(d?.subscription ?? null))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!sub || sub.planId === "free" || (sub.status !== "past_due" && sub.status !== "unpaid")) return null;
  return (
    <div role="alert" className="vck-card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-sm font-semibold">{t("pastDueTitle")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("pastDueBody")}</p>
      </div>
      <Link href={`/${locale}/app/billing`} className="vch-btn">
        {t("sortPayment")}
      </Link>
    </div>
  );
}
