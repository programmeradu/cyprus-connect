"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useWorkspaceResource, useWorkspaceAction } from "@/components/app/console/workspace-store";
import type { VsmePassportData } from "@/lib/reports/passport.server";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  Metric,
  MetricRow,
  Empty,
} from "@/components/app/console/kit";
import { downloadPassportPdf } from "@/lib/pdf/passport";

const PATH = "/api/console/passport";

export default function PassportConsolePage() {
  const locale = useLocale();
  const isEl = locale === "el";
  const passportRes = useWorkspaceResource<VsmePassportData>(PATH);
  const data = passportRes.data;
  const { run: updatePassport, busy: isUpdating } = useWorkspaceAction();

  const [activeTab, setActiveTab] = useState<"overview" | "disclosures" | "share">("overview");
  const [downloading, setDownloading] = useState(false);

  async function handleTogglePublic(isPublic: boolean) {
    const res = await updatePassport(
      PATH,
      {
        method: "PATCH",
        body: { isPublic },
      }
    );
    if (res !== null) {
      toast.success(
        isPublic
          ? (isEl ? "Το διαβατήριο είναι δημόσιο" : "Passport made public")
          : (isEl ? "Το διαβατήριο έγινε ιδιωτικό" : "Passport made private")
      );
      passportRes.reload();
    }
  }

  async function handleDownloadPdf() {
    if (!data) return;
    setDownloading(true);
    try {
      const fileName = `VSME-Passport-${data.company.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      await downloadPassportPdf(data, fileName);
      toast.success(isEl ? "Το επίσημο PDF λήφθηκε επιτυχώς" : "Official VSME Passport PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error(isEl ? "Σφάλμα κατά τη δημιουργία του PDF" : "Failed to compile Passport PDF");
    } finally {
      setDownloading(false);
    }
  }

  const shareUrl = typeof window !== "undefined" && data
    ? `${window.location.origin}/${locale}/passport/${data.passport.slug}`
    : "";

  function copyShareLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success(isEl ? "Ο σύνδεσμος αντιγράφηκε στο πρόχειρο" : "Share link copied to clipboard");
  }

  return (
    <PageShell
      loading={passportRes.loading}
      error={passportRes.error ? (isEl ? "Αδυναμία φόρτωσης διαβατηρίου" : "Could not load VSME Passport") : null}
      onRetry={passportRes.reload}
      header={
        <PageHeader
          title={isEl ? "Ψηφιακό Διαβατήριο VSME" : "VSME Digital Passport"}
          purpose={
            isEl
              ? "Επίσημη, επαληθευμένη αναφορά κατά το πρότυπο EFRAG VSME. Μοιραστείτε την με τράπεζες, πελάτες και ελεγκτές με έναν σύνδεσμο."
              : "Single verified EFRAG VSME data pack. Share with enterprise buyers, credit underwriters and auditors with one consent link."
          }
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={copyShareLink}
                disabled={!data?.passport.isPublic}
                className="h-9 px-4 text-xs font-semibold rounded-md border border-foreground/20 hover:bg-foreground/5 transition disabled:opacity-40"
              >
                {isEl ? "Αντιγραφή Συνδέσμου" : "Copy Share Link"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading || !data}
                className="h-9 px-4 text-xs font-semibold rounded-md bg-[var(--accent-lime)] text-[var(--accent-lime-foreground)] transition hover:opacity-95 disabled:opacity-50"
              >
                {downloading ? (isEl ? "Δημιουργία..." : "Compiling...") : (isEl ? "Λήψη Επίσημου PDF" : "Download Official PDF")}
              </button>
            </div>
          }
        />
      }
      toolbar={
        <PageToolbar>
          <ToolbarTabs
            value={activeTab}
            onChange={(v) => setActiveTab(v as typeof activeTab)}
            options={[
              { value: "overview", label: isEl ? "Σύνοψη" : "Overview" },
              {
                value: "disclosures",
                label: isEl ? "Αποκαλύψεις EFRAG" : "EFRAG Disclosures",
                count: data?.disclosures.length,
              },
              { value: "share", label: isEl ? "Κοινοποίηση & Έλεγχος" : "Share & Access" },
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
              label={isEl ? "Πληρότητα EFRAG VSME" : "VSME Completeness"}
              value={`${data.metrics.overallCompletenessPct}%`}
            />
            <Metric
              label={isEl ? "Ενέργεια (Scope 2)" : "Grid Electricity (Scope 2)"}
              value={`${data.metrics.totalEnergyMwh} MWh`}
              note={`${data.metrics.scope2Tonnes} t CO₂e`}
            />
            <Metric
              label={isEl ? "Άμεσες Εκπομπές (Scope 1)" : "Direct Fuels (Scope 1)"}
              value={`${data.metrics.scope1Tonnes} t`}
              note="CO₂e"
            />
            <Metric
              label={isEl ? "Απορρόφηση Νερού" : "Water Withdrawal"}
              value={`${data.metrics.waterM3} m³`}
              note="WDD / municipal"
            />
          </MetricRow>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <Section
                title={isEl ? "Ταυτότητα Εταιρείας & Νομικό Πλαίσιο" : "Corporate Identity & Legal Framework"}
                description={isEl ? "Στοιχεία εγγραφής στην Κυπριακή Δημοκρατία και όρια αναφοράς" : "Registration in the Republic of Cyprus and reporting boundary"}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-foreground/10 p-4 bg-foreground/[0.01]">
                    <div className="text-xs uppercase text-foreground/50">{isEl ? "Επωνυμία" : "Legal Entity"}</div>
                    <div className="mt-1 font-semibold text-base">{data.company.legalName || data.company.name}</div>
                  </div>
                  <div className="rounded-lg border border-foreground/10 p-4 bg-foreground/[0.01]">
                    <div className="text-xs uppercase text-foreground/50">{isEl ? "Αριθμός Εγγραφής / ΑΦΜ" : "Registration / VAT"}</div>
                    <div className="mt-1 font-semibold text-base">{data.company.registrationNo || (isEl ? "Επαληθευμένη ΜμΕ" : "Verified Cyprus SME")}</div>
                  </div>
                  <div className="rounded-lg border border-foreground/10 p-4 bg-foreground/[0.01]">
                    <div className="text-xs uppercase text-foreground/50">{isEl ? "Κλάδος Δραστηριότητας" : "Sector"}</div>
                    <div className="mt-1 font-semibold text-base">{data.company.sector}</div>
                  </div>
                  <div className="rounded-lg border border-foreground/10 p-4 bg-foreground/[0.01]">
                    <div className="text-xs uppercase text-foreground/50">{isEl ? "Προσωπικό" : "Headcount"}</div>
                    <div className="mt-1 font-semibold text-base">{data.company.employees} {isEl ? "εργαζόμενοι" : "employees"}</div>
                  </div>
                  <div className="rounded-lg border border-foreground/10 p-4 bg-foreground/[0.01]">
                    <div className="text-xs uppercase text-foreground/50">{isEl ? "Έτος Βάσης" : "Baseline Year"}</div>
                    <div className="mt-1 font-semibold text-base">{data.company.baselineYear}</div>
                  </div>
                  <div className="rounded-lg border border-foreground/10 p-4 bg-foreground/[0.01]">
                    <div className="text-xs uppercase text-foreground/50">{isEl ? "Καθεστώς Προστασίας" : "Omnibus I Cap"}</div>
                    <div className="mt-1 font-semibold text-base text-[var(--accent-emerald)]">VSME Standard Ceiling</div>
                  </div>
                </div>
              </Section>

              <Section
                title={isEl ? "Αδιάσειστα Τεκμήρια Ελέγχου" : "Cryptographic Audit Anchors"}
                description={isEl ? "Κάθε αριθμός συνδέεται με πρωτότυπα τιμολόγια και το δημόσιο μητρώο επαλήθευσης" : "Every figure is anchored by raw utility invoices and verifiable via Merkle hash"}
              >
                <div className="rounded-xl border border-foreground/10 p-5 bg-foreground/[0.01] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/10 pb-4">
                    <div>
                      <div className="text-sm font-semibold">{isEl ? "Ρίζα Merkle (SHA-256 Hash)" : "Merkle Root Hash (SHA-256)"}</div>
                      <div className="font-mono text-xs text-foreground/60 break-all">{data.merkleRootHash}</div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-lime)]/20 text-foreground">
                      {isEl ? "Επαληθεύσιμο στο /verify" : "Verified at /verify"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm text-foreground/80">
                    <div>
                      <strong>{data.verifiedDocumentsCount}</strong> {isEl ? "επαληθευμένοι λογαριασμοί κοινής ωφέλειας" : "metered utility invoices read and matched"}
                    </div>
                    <div>
                      <strong>{data.confirmedActionsCount}</strong> {isEl ? "επιβεβαιωμένα έργα απαλλαγής από άνθρακα" : "confirmed decarbonisation capital projects"}
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* Tab 2: Disclosures */}
          {activeTab === "disclosures" && (
            <div className="space-y-6">
              {data.disclosures.map((block) => (
                <Section
                  key={block.code}
                  title={`${block.code}: ${isEl ? block.titleEl : block.titleEn}`}
                  description={isEl ? block.summaryEl : block.summaryEn}
                  action={
                    <span className="text-xs font-medium text-foreground/60">
                      {block.completenessPct}% {isEl ? "ολοκληρωμένο" : "complete"}
                    </span>
                  }
                >
                  <div className="divide-y divide-foreground/10 border border-foreground/10 rounded-lg overflow-hidden bg-background">
                    {block.items.map((item) => (
                      <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-foreground/[0.01] transition">
                        <div>
                          <div className="text-xs font-mono text-foreground/45">{item.code}</div>
                          <div className="text-sm font-medium">{isEl ? item.labelEl : item.labelEn}</div>
                          <div className="text-xs text-foreground/60">{item.source}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">
                            {item.value !== null && item.value !== undefined ? (
                              <span>
                                {item.value} {item.unit}
                              </span>
                            ) : (
                              <span className="text-foreground/40 italic">{isEl ? "Δεν καταχωρήθηκε" : "Not recorded"}</span>
                            )}
                          </div>
                          <div>
                            {item.isVerified ? (
                              <span className="text-[11px] font-medium text-[var(--accent-emerald)]">✓ {isEl ? "Επαληθευμένο" : "Verified"}</span>
                            ) : (
                              <span className="text-[11px] font-medium text-foreground/40">{isEl ? "Εκκρεμεί" : "Pending"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              ))}
            </div>
          )}

          {/* Tab 3: Share & Access */}
          {activeTab === "share" && (
            <div className="space-y-6">
              <Section
                title={isEl ? "Σύνδεσμος Κοινοποίησης για Αγοραστές & Τράπεζες" : "Buyer & Banking Consent Share Link"}
                description={isEl ? "Δώστε πρόσβαση σε μεγάλους πελάτες ή πιστωτικούς οργανισμούς χωρίς να στέλνετε αρχεία Excel" : "Provide corporate buyers or lending officers instant live access without emailing spreadsheets"}
              >
                <div className="rounded-xl border border-foreground/10 p-6 bg-foreground/[0.01] space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-base">{isEl ? "Δημόσια Πρόσβαση Συνδέσμου" : "Public Share Link Access"}</div>
                      <div className="text-xs text-foreground/60 mt-0.5">
                        {isEl ? "Όποιος διαθέτει τον σύνδεσμο μπορεί να δει μόνο τις επίσημες αποκαλύψεις VSME." : "Anyone with this URL can view verified EFRAG VSME disclosures."}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.passport.isPublic}
                        disabled={isUpdating}
                        onChange={(e) => handleTogglePublic(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-lime)]"></div>
                    </label>
                  </div>

                  {data.passport.isPublic && (
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="h-10 px-3 flex-1 rounded-md border border-foreground/15 bg-background font-mono text-xs select-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={copyShareLink}
                          className="h-10 px-4 text-xs font-semibold rounded-md bg-foreground text-background transition hover:opacity-90"
                        >
                          {isEl ? "Αντιγραφή" : "Copy"}
                        </button>
                      </div>

                      <div className="text-xs text-foreground/60 flex items-center gap-4 pt-1">
                        <span>
                          {isEl ? "Προβολές:" : "Views:"} <strong>{data.passport.viewCount}</strong>
                        </span>
                        {data.passport.lastViewedAt && (
                          <span>
                            {isEl ? "Τελευταία προβολή:" : "Last accessed:"} {new Date(data.passport.lastViewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
