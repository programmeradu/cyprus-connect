"use client";

/**
 * Hospitality Pack Page (/app/hospitality).
 *
 * Implements S-24 (Hospitality Pack & HCMI Engine):
 * - Displays hotel energy and carbon intensity per occupied room-night (POR).
 * - Computes water intensity per guest-night against Cyprus benchmarks.
 * - Shows readiness for European tour operators (TUI, Jet2, DER Touristik).
 * - Exports print-ready Typst PDF with cryptographic Merkle root hash.
 * - Allows configuration of property rooms, occupancy, and on-site facilities.
 */

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  PageShell,
  PageHeader,
  Section,
  MetricRow,
  Metric,
  DataTable,
  type Column,
} from "@/components/app/console/kit";
import { useWorkspaceResource, useWorkspaceAction } from "@/components/app/console/workspace-store";
import { toast } from "sonner";
import type { HospitalityPackData } from "@/lib/reports/hospitality.server";

const PATH = "/api/console/hospitality";

export default function HospitalityPage() {
  const locale = useLocale();
  const isEl = locale.startsWith("el");
  const t = (en: string, el: string) => (isEl ? el : en);

  const resource = useWorkspaceResource<HospitalityPackData>(PATH);
  const action = useWorkspaceAction();

  const data = resource.data ?? null;
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Editable form state
  const [rooms, setRooms] = useState(data?.profile.totalRooms ?? 60);
  const [occupied, setOccupied] = useState(data?.profile.annualOccupiedRooms ?? 14000);
  const [guests, setGuests] = useState(data?.profile.annualGuestNights ?? 28000);
  const [pool, setPool] = useState(data?.profile.hasPool ?? true);
  const [restaurant, setRestaurant] = useState(data?.profile.hasRestaurant ?? true);
  const [spa, setSpa] = useState(data?.profile.hasSpa ?? false);
  const [laundry, setLaundry] = useState(data?.profile.hasLaundryOnSite ?? true);
  const [ecoLabel, setEcoLabel] = useState(data?.profile.ecoLabel ?? "None");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await action.run(PATH, {
        method: "PATCH",
        body: {
          totalRooms: rooms,
          annualOccupiedRooms: occupied,
          annualGuestNights: guests,
          hasPool: pool,
          hasRestaurant: restaurant,
          hasSpa: spa,
          hasLaundryOnSite: laundry,
          ecoLabel,
        },
        invalidates: [PATH],
      });
      toast.success(t("Hotel capacity updated.", "Τα στοιχεία ξενοδοχείου ενημερώθηκαν."));
      setEditing(false);
    } catch {
      toast.error(t("Failed to update profile.", "Αποτυχία ενημέρωσης στοιχείων."));
    }
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const { downloadHospitalityPdf } = await import("@/lib/pdf/hospitality");
      await downloadHospitalityPdf(data, `${data.profile.propertyName}-hcmi-dossier.pdf`);
      toast.success(t("Hospitality Dossier exported successfully!", "Το Πακέτο Φιλοξενίας εξήχθη επιτυχώς!"));
    } catch {
      toast.error(t("Failed to export PDF dossier.", "Αποτυχία εξαγωγής PDF."));
    } finally {
      setDownloading(false);
    }
  };

  interface MetricItem {
    id: string;
    label: string;
    value: string;
    benchmark: string;
    status: "good" | "warn" | "neutral";
    source: string;
  }

  const metricsTable: MetricItem[] = data
    ? [
        {
          id: "m1",
          label: t("Energy per Occupied Room (POR)", "Ενέργεια ανά Κατειλημμένο Δωμάτιο (POR)"),
          value: `${data.hcmiMetrics.energyPerOccupiedRoomKwh} kWh / room`,
          benchmark: "Cyprus 4-star avg: ~24.0 kWh",
          status: data.hcmiMetrics.energyPerOccupiedRoomKwh <= 24 ? "good" : "warn",
          source: t("EAC bills / Occupied room-nights", "Λογαριασμοί ΑΗΚ / Κατειλημμένα δωμάτια"),
        },
        {
          id: "m2",
          label: t("Carbon per Occupied Room (HCMI)", "Άνθρακας ανά Κατειλημμένο Δωμάτιο (HCMI)"),
          value: `${data.hcmiMetrics.carbonPerOccupiedRoomKg} kg CO2e / room`,
          benchmark: "Cyprus 4-star avg: 18.5 kg",
          status: data.hcmiMetrics.tuiCarbonBenchmarkDiffPct <= 0 ? "good" : "warn",
          source: t("Statutory Grid factor (0.622 kg/kWh)", "Επίσημος συντελεστής ΑΗΚ (0.622 kg/kWh)"),
        },
        {
          id: "m3",
          label: t("Carbon per Guest-Night", "Άνθρακας ανά Διανυκτέρευση Επισκέπτη"),
          value: `${data.hcmiMetrics.carbonPerGuestNightKg} kg CO2e / guest`,
          benchmark: "Cyprus avg: ~9.2 kg",
          status: data.hcmiMetrics.carbonPerGuestNightKg <= 9.2 ? "good" : "warn",
          source: t("Operational emissions / Guest-nights", "Λειτουργικές εκπομπές / Επισκέπτες"),
        },
        {
          id: "m4",
          label: t("Water Consumption per Guest-Night (HWMI)", "Κατανάλωση Νερού ανά Επισκέπτη (HWMI)"),
          value: `${data.hcmiMetrics.waterPerGuestNightLiters} Litres / guest`,
          benchmark: "Cyprus tourism avg: 380 L",
          status: data.hcmiMetrics.waterBenchmarkDiffPct <= 0 ? "good" : "warn",
          source: t("Cyprus Water Board metered bills", "Μετρήσεις Συμβουλίου Υδατοπρομήθειας"),
        },
      ]
    : [];

  const columns: Column<MetricItem>[] = [
    {
      key: "metric",
      header: t("HCMI & HWMI Standard Metric", "Πρότυπος Δείκτης HCMI & HWMI"),
      render: (m) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{m.label}</span>,
    },
    {
      key: "value",
      header: t("Your Value", "Τιμή Μονάδας"),
      render: (m) => <strong className="font-mono text-sm text-neutral-900 dark:text-neutral-100">{m.value}</strong>,
    },
    {
      key: "benchmark",
      header: t("Cyprus Benchmark", "Κυπριακός Μέσος Όρος"),
      render: (m) => <span className="text-xs text-neutral-500">{m.benchmark}</span>,
    },
    {
      key: "variance",
      header: t("Tour Operator Status", "Κατάσταση Tour Operator"),
      render: (m) => (
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
            m.status === "good"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          {m.status === "good"
            ? t("Outperforming", "Υπεραποδίδει")
            : t("Requires Action", "Χρειάζεται Βελτίωση")}
        </span>
      ),
    },
    {
      key: "source",
      header: t("Verification Source", "Πηγή Επαλήθευσης"),
      render: (m) => <span className="text-xs text-neutral-400">{m.source}</span>,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title={t("Hospitality & Hotel Carbon Pack (HCMI)", "Πακέτο Φιλοξενίας & Ξενοδοχείων (HCMI)")}
        purpose={t(
          "Hotel Carbon & Water Measurement Initiative (HCMI/HWMI) intensity metrics and European tour operator compliance packs (TUI, Jet2).",
          "Δείκτες έντασης άνθρακα & νερού ξενοδοχείων (HCMI/HWMI) και πακέτα συμμόρφωσης για ευρωπαϊκούς tour operators (TUI, Jet2).",
        )}
      />

      {data && (
        <>
          <Section
            title={data.profile.propertyName}
            description={t(
              `Property: ${data.profile.hotelCategory} · Tour Partners: ${data.profile.tourOperatorPartners} · Eco-label: ${data.profile.ecoLabel}`,
              `Μονάδα: ${data.profile.hotelCategory} · Συνεργάτες: ${data.profile.tourOperatorPartners} · Οικολογικό σήμα: ${data.profile.ecoLabel}`,
            )}
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {editing ? t("Close Config", "Κλείσιμο Ρυθμίσεων") : t("Edit Operating Capacity", "Επεξεργασία Δυναμικότητας")}
                </button>
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadPdf}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {downloading ? t("Exporting...", "Εξαγωγή...") : t("Export Tour Operator PDF", "Εξαγωγή Tour Operator PDF")}
                </button>
              </div>
            }
          >
            <MetricRow>
              <Metric
                label={t("Tour Operator Readiness", "Ετοιμότητα Tour Operator")}
                value={`${data.hcmiMetrics.tourOperatorReadinessScore}/100`}
                note={t("TUI & Jet2 compliant", "Συμβατό με TUI & Jet2")}
              />
              <Metric
                label={t("Carbon / Room-Night", "Άνθρακας / Δωμάτιο")}
                value={`${data.hcmiMetrics.carbonPerOccupiedRoomKg} kg`}
                note={`${data.hcmiMetrics.tuiCarbonBenchmarkDiffPct > 0 ? "+" : ""}${data.hcmiMetrics.tuiCarbonBenchmarkDiffPct}% vs benchmark`}
              />
              <Metric
                label={t("Water / Guest-Night", "Νερό / Επισκέπτη")}
                value={`${data.hcmiMetrics.waterPerGuestNightLiters} L`}
                note={`${data.hcmiMetrics.waterBenchmarkDiffPct > 0 ? "+" : ""}${data.hcmiMetrics.waterBenchmarkDiffPct}% vs benchmark`}
              />
              <Metric
                label={t("Metered Utility Evidence", "Παραστατικά Μετρήσεων")}
                value={`${data.verifiedBills.eacBillsCount + data.verifiedBills.waterBillsCount} bills`}
                note={data.verifiedBills.allMetered ? t("Full EAC & Water audit", "Πλήρης έλεγχος ΑΗΚ & Νερού") : t("Data gaps exist", "Υπάρχουν κενά")}
              />
            </MetricRow>
          </Section>

          {editing && (
            <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t("Hotel Operating Parameters & Facility Configuration", "Λειτουργικές Παράμετροι & Εγκαταστάσεις Ξενοδοχείου")}
              </h3>
              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {t("Total Rooms", "Σύνολο Δωματίων")}
                  </label>
                  <input
                    type="number"
                    value={rooms}
                    onChange={(e) => setRooms(Number(e.target.value))}
                    className="mt-1 w-full rounded border border-neutral-300 p-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {t("Annual Occupied Room-Nights", "Ετήσια Κατειλημμένα Δωμάτια")}
                  </label>
                  <input
                    type="number"
                    value={occupied}
                    onChange={(e) => setOccupied(Number(e.target.value))}
                    className="mt-1 w-full rounded border border-neutral-300 p-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {t("Annual Guest-Nights", "Ετήσιες Διανυκτερεύσεις Επισκεπτών")}
                  </label>
                  <input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="mt-1 w-full rounded border border-neutral-300 p-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div className="sm:col-span-3 flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} />
                    {t("Swimming Pool", "Πισίνα")}
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={restaurant} onChange={(e) => setRestaurant(e.target.checked)} />
                    {t("Restaurant / Buffet", "Εστιατόριο / Μπουφές")}
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={spa} onChange={(e) => setSpa(e.target.checked)} />
                    {t("Spa & Wellness", "Spa & Ευεξία")}
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={laundry} onChange={(e) => setLaundry(e.target.checked)} />
                    {t("In-house Laundry", "Επιτόπιο Πλυντήριο")}
                  </label>
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded border border-neutral-300 px-3 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                  >
                    {t("Cancel", "Ακύρωση")}
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    {t("Save Changes", "Αποθήκευση")}
                  </button>
                </div>
              </form>
            </div>
          )}

          <DataTable
            rows={metricsTable}
            rowKey={(m) => m.id}
            columns={columns}
          />
        </>
      )}
    </PageShell>
  );
}
