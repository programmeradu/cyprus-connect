"use client";

/**
 * Lender pack (/app/bank-pack).
 *
 * The energy, emissions and water answers banks usually ask borrowers for,
 * each with its source. Blank answers stay blank and are named as gaps.
 * No bank names, no rate promises: those are the bank's to make.
 */

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import type { LenderPackData, LenderAnswer } from "@/lib/reports/types";
import { ConsolePage, Section, Metric, MetricRow, Ledger, Btn, State } from "@/components/app/console/kit";
import { Link } from "@/i18n/navigation";

export default function LenderPackPage() {
  const isEl = useLocale().startsWith("el");
  const t = (en: string, el: string) => (isEl ? el : en);
  const res = useWorkspaceResource<LenderPackData>("/api/console/bank-pack");
  const data = res.data;
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!data) return;
    setBusy(true);
    try {
      const { downloadLenderPackPdf } = await import("@/lib/pdf/bank");
      const name = (data.company.legalName || data.company.name).replace(/[^\p{L}\p{N}]+/gu, "-");
      await downloadLenderPackPdf(data, `ESG-summary-for-lenders-${name}.pdf`);
      toast.success(t("Lender pack downloaded.", "Ο φάκελος λήφθηκε."));
    } catch {
      toast.error(t("The PDF could not be made. Try again.", "Δεν δημιουργήθηκε το PDF. Δοκιμάστε ξανά."));
    } finally {
      setBusy(false);
    }
  }

  const fmt = (a: LenderAnswer) =>
    a.value === null ? t("Not yet recorded", "Δεν έχει καταγραφεί") : `${a.value.toLocaleString(isEl ? "el-CY" : "en-GB")}${a.unit ? ` ${a.unit}` : ""}`;
  const backed = data?.answers.filter((a) => a.fromRecords).length ?? 0;
  const gaps = data?.answers.filter((a) => a.value === null) ?? [];

  return (
    <ConsolePage
      title={t("Lender pack", "Φάκελος για τράπεζες")}
      purpose={t(
        "The energy, emissions and water answers banks ask borrowers for, each with its source.",
        "Οι απαντήσεις για ενέργεια, εκπομπές και νερό που ζητούν οι τράπεζες, με την πηγή τους.",
      )}
      actions={
        <Btn variant="primary" onClick={download} disabled={busy || !data}>
          {busy ? t("Making PDF…", "Δημιουργία PDF…") : t("Download PDF", "Λήψη PDF")}
        </Btn>
      }
      loading={res.loading && !data}
      error={res.error ? t("The lender pack could not load.", "Ο φάκελος δεν φορτώθηκε.") : null}
      onRetry={res.reload}
    >
      {data && (
        <>
          <MetricRow>
            <Metric label={t("From bills or documents", "Από λογαριασμούς ή έγγραφα")} value={`${backed} / ${data.answers.length}`} />
            <Metric label={t("Electricity bills cover", "Λογαριασμοί ρεύματος")} value={`${data.coverage.electricityMonths} ${t("months", "μήνες")}`} note={data.coverage.electricityMonths < 12 ? t("Banks usually want 12", "Οι τράπεζες ζητούν συνήθως 12") : undefined} />
            <Metric label={t("Water bills cover", "Λογαριασμοί νερού")} value={`${data.coverage.waterMonths} ${t("months", "μήνες")}`} />
            <Metric label={t("Still blank", "Κενά")} value={String(gaps.length)} />
          </MetricRow>

          <Section
            title={t("Answers", "Απαντήσεις")}
            description={t(
              "This is not a bank form and promises no loan terms. Your bank decides how it uses these figures.",
              "Δεν είναι έντυπο τράπεζας και δεν υπόσχεται όρους δανείου. Η τράπεζα αποφασίζει πώς θα τα χρησιμοποιήσει.",
            )}
          >
            <Ledger
              items={data.answers.map((a) => ({
                id: a.id,
                title: isEl ? a.questionEl : a.questionEn,
                detail: isEl ? a.sourceEl : a.sourceEn,
                note: a.value === null ? undefined : a.fromRecords ? (
                  <State tone="good">{t("From records", "Από αρχεία")}</State>
                ) : (
                  <State tone="idle">{t("Company statement", "Δήλωση εταιρείας")}</State>
                ),
                value: fmt(a),
                valueTone: a.value === null ? "warn" : undefined,
              }))}
            />
          </Section>

          {gaps.length > 0 && (
            <Section title={t("Fill the gaps", "Συμπληρώστε τα κενά")}>
              <p className="vck-prose">
                {t(
                  "Add your EAC, water and fuel bills and the blank answers fill in by themselves.",
                  "Προσθέστε λογαριασμούς ΑΗΚ, νερού και καυσίμων και τα κενά θα συμπληρωθούν μόνα τους.",
                )}{" "}
                <Link href={"/app/calculator" as never} className="vck-link">
                  {t("Add data", "Προσθήκη δεδομένων")}
                </Link>
              </p>
            </Section>
          )}
        </>
      )}
    </ConsolePage>
  );
}
