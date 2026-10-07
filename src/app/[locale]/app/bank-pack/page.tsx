"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import type { BankBorrowerPackData, BankTarget } from "@/lib/reports/types";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  Metric,
  MetricRow,
} from "@/components/app/console/kit";
import { downloadBankPackPdf } from "@/lib/pdf/bank";

export default function BankPackConsolePage() {
  const locale = useLocale();
  const isEl = locale === "el";
  const [bank, setBank] = useState<BankTarget>("boc");
  const [principal, setPrincipal] = useState(250000);
  const [downloading, setDownloading] = useState(false);

  const path = `/api/console/bank-pack?bank=${bank}&principal=${principal}`;
  const packRes = useWorkspaceResource<BankBorrowerPackData>(path);
  const data = packRes.data;

  async function handleDownloadPdf() {
    if (!data) return;
    setDownloading(true);
    try {
      const fileName = `${bank.toUpperCase()}-ESG-Borrower-Pack-${data.company.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      await downloadBankPackPdf(data, fileName);
      toast.success(isEl ? "Ο τραπεζικός φάκελος λήφθηκε επιτυχώς" : "Bank ESG submission pack downloaded");
    } catch (err) {
      console.error(err);
      toast.error(isEl ? "Σφάλμα κατά τη λήψη του φακέλου" : "Failed to compile bank pack PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <PageShell
      loading={packRes.loading}
      error={packRes.error ? (isEl ? "Αδυναμία φόρτωσης τραπεζικού πακέτου" : "Could not load Bank ESG pack") : null}
      onRetry={packRes.reload}
      header={
        <PageHeader
          title={isEl ? "Τραπεζικό Πακέτο ESG & Πράσινες Χορηγήσεις" : "Bank ESG Borrower Auto-Pack"}
          purpose={
            isEl
              ? "Αυτόματη συμπλήρωση ερωτηματολογίων δανειοληπτών για Τράπεζα Κύπρου & Ελληνική Τράπεζα με πιστοποίηση έκπτωσης επιτοκίου."
              : "Pre-filled borrower ESG credit questionnaires for Bank of Cyprus & Hellenic Bank with green lending margin discounts."
          }
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading || !data}
                className="h-9 px-4 text-xs font-semibold rounded-md bg-[var(--accent-lime)] text-[var(--accent-lime-foreground)] transition hover:opacity-95 disabled:opacity-50"
              >
                {downloading ? (isEl ? "Δημιουργία..." : "Compiling...") : (isEl ? "Λήψη Τραπεζικού Φακέλου PDF" : "Download Bank Credit Dossier")}
              </button>
            </div>
          }
        />
      }
      toolbar={
        <PageToolbar
          meta={
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <span>{isEl ? "Ενδεικτικό Δάνειο:" : "Facility Amount:"}</span>
              <select
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="h-8 px-2 rounded border border-foreground/15 bg-background text-xs font-mono"
              >
                <option value={100000}>€100,000</option>
                <option value={250000}>€250,000</option>
                <option value={500000}>€500,000</option>
                <option value={1000000}>€1,000,000</option>
              </select>
            </div>
          }
        >
          <ToolbarTabs
            value={bank}
            onChange={(v) => setBank(v as BankTarget)}
            options={[
              { value: "boc", label: isEl ? "Τράπεζα Κύπρου (BoC)" : "Bank of Cyprus (BoC)" },
              { value: "hellenic", label: isEl ? "Ελληνική Τράπεζα" : "Hellenic Bank" },
            ]}
          />
        </PageToolbar>
      }
    >
      {data && (
        <>
          {/* Key Metrics */}
          <MetricRow>
            <Metric
              label={isEl ? "Έκπτωση Περιθωρίου (Green Margin)" : "Green Margin Discount"}
              value={`-${data.metrics.greenMarginDiscountBps} bps`}
              note={data.covenantEligibility.tier}
            />
            <Metric
              label={isEl ? "Εκτιμώμενο Ετήσιο Όφελος Τόκων" : "Est. Annual Interest Saved"}
              value={data.metrics.estimatedAnnualInterestSavedEur ? `€${data.metrics.estimatedAnnualInterestSavedEur.toLocaleString()}` : "—"}
              note={isEl ? "ανά έτος" : "per year"}
            />
            <Metric
              label={isEl ? "Ηλεκτρισμός Δικτύου" : "Grid Electricity"}
              value={`${Math.round(data.metrics.annualElectricityKwh).toLocaleString()} kWh`}
              note={`${data.metrics.scope2Tonnes} t CO₂e`}
            />
            <Metric
              label={isEl ? "Επαληθευμένες Απαντήσεις" : "Verified Answers"}
              value={`${data.questionnaire.filter((q) => q.isVerified).length} / ${data.questionnaire.length}`}
            />
          </MetricRow>

          {/* Green Covenant Memorandum */}
          <Section
            title={isEl ? "Πιστοποίηση Επιλεξιμότητας Πράσινου Επιτοκίου" : "Green Lending Margin Eligibility Certification"}
            description={
              isEl
                ? "Αυτοματοποιημένο υπόμνημα προς την Επιτροπή Πιστοδοτήσεων με βάση πραγματικά ενεργειακά δεδομένα"
                : "Automated credit underwriting memo demonstrating covenant qualification under EBA guidelines"
            }
          >
            <div className="rounded-xl border border-foreground/10 p-6 bg-foreground/[0.01] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/10 pb-4">
                <div>
                  <div className="text-sm font-semibold">{data.bankName}</div>
                  <div className="text-xs text-foreground/60">{isEl ? "Κατηγορία Χορήγησης:" : "Covenant Classification:"} <strong>{data.covenantEligibility.tier}</strong></div>
                </div>
                <div className="font-mono text-xs text-foreground/50 break-all">
                  SHA-256: {data.merkleRootHash.slice(0, 24)}…
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  {isEl ? "Κριτήρια Επιλεξιμότητας που Πληρούνται:" : "Validated Covenant Criteria:"}
                </div>
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  {(isEl ? data.covenantEligibility.reasonsEl : data.covenantEligibility.reasonsEn).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--accent-emerald)] font-bold">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* Pre-filled Borrower Questionnaire */}
          <Section
            title={isEl ? "Ερωτηματολόγιο ESG Δανειολήπτη (Προ-συμπληρωμένο)" : "Borrower ESG Credit Questionnaire (Pre-filled)"}
            description={
              isEl
                ? "Κάθε ερώτηση αντιστοιχίζεται αυτόματα με αποδείξεις από λογαριασμούς ΑΗΚ και τιμολόγια"
                : "Line-by-line responses anchored directly to parsed invoices and verified ledgers"
            }
          >
            <div className="divide-y divide-foreground/10 border border-foreground/10 rounded-lg overflow-hidden bg-background">
              {data.questionnaire.map((q) => (
                <div key={q.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-foreground/[0.01] transition">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-foreground/45">{q.code}</span>
                      <span className="text-xs font-semibold text-foreground/60">{q.category}</span>
                    </div>
                    <div className="text-sm font-medium mt-0.5">{isEl ? q.questionEl : q.questionEn}</div>
                    <div className="text-xs text-foreground/60 mt-1 font-mono">{q.auditTrail}</div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-semibold text-sm">
                      {q.answer} {q.unit}
                    </div>
                    <div>
                      {q.isVerified ? (
                        <span className="text-[11px] font-medium text-[var(--accent-emerald)]">✓ {isEl ? "Επαληθευμένο" : "Audited"}</span>
                      ) : (
                        <span className="text-[11px] font-medium text-foreground/40">{isEl ? "Εκκρεμεί" : "Pending"}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </PageShell>
  );
}
