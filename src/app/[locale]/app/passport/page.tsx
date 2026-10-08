"use client";

/**
 * VSME Passport (/app/passport).
 *
 * One page for the company's VSME data: what is backed by records, what is
 * still a company statement, and whether a public link is switched on.
 * "Checked" means a figure comes from bills or documents in the workspace;
 * anything else is shown as a statement, never as verified.
 */

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useWorkspaceResource, useWorkspaceAction } from "@/components/app/console/workspace-store";
import type { VsmePassportData, VsmeDisclosureBlock } from "@/lib/reports/types";
import {
  ConsolePage,
  ConsoleTabs,
  Plate,
  PlateGrid,
  Ledger,
  Reading,
  ReadingRail,
  Btn,
  State,
  Bar,
  Empty,
} from "@/components/app/console/kit";
import type { LedgerItem } from "@/components/app/console/kit";

const PATH = "/api/console/passport";
type Tab = "overview" | "disclosures" | "share";

function fmt(n: number, loc: string, digits = 1) {
  return n.toLocaleString(loc, { maximumFractionDigits: digits });
}

export default function PassportConsolePage() {
  const locale = useLocale();
  const isEl = locale === "el";
  const loc = isEl ? "el-CY" : "en-GB";
  const t = (en: string, el: string) => (isEl ? el : en);

  const res = useWorkspaceResource<VsmePassportData>(PATH);
  const data = res.data;
  const { run, busy } = useWorkspaceAction();
  const [tab, setTab] = useState<Tab>("overview");
  const [downloading, setDownloading] = useState(false);

  const shareUrl =
    typeof window !== "undefined" && data ? `${window.location.origin}/${locale}/passport/${data.passport.slug}` : "";

  async function setPublic(isPublic: boolean) {
    const out = await run(PATH, { method: "PATCH", body: { isPublic }, invalidates: [PATH] });
    if (out !== null) {
      toast.success(isPublic ? t("Public link switched on", "Ο δημόσιος σύνδεσμος ενεργοποιήθηκε") : t("Public link switched off", "Ο δημόσιος σύνδεσμος απενεργοποιήθηκε"));
      res.reload();
    }
  }

  async function download() {
    if (!data) return;
    setDownloading(true);
    try {
      const { downloadPassportPdf } = await import("@/lib/pdf/passport");
      const safe = (data.company.legalName || data.company.name).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "company";
      await downloadPassportPdf(data, `VSME-Passport-${safe}.pdf`);
      toast.success(t("PDF downloaded", "Το PDF λήφθηκε"));
    } catch {
      toast.error(t("The PDF could not be made. Try again.", "Το PDF δεν δημιουργήθηκε. Δοκιμάστε ξανά."));
    } finally {
      setDownloading(false);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("Link copied", "Ο σύνδεσμος αντιγράφηκε"));
    } catch {
      toast.error(t("Copy failed. Select the link and copy it.", "Η αντιγραφή απέτυχε. Επιλέξτε τον σύνδεσμο."));
    }
  }

  const items = data ? data.disclosures.flatMap((d) => d.items) : [];
  const checked = items.filter((i) => i.isVerified).length;
  const missing = items.filter((i) => i.value === null || i.value === undefined || i.value === "").length;

  return (
    <ConsolePage
      title={t("VSME Passport", "Διαβατήριο VSME")}
      purpose={t(
        "Your VSME figures in one place, ready to send to a bank or a customer.",
        "Τα στοιχεία VSME σας σε ένα σημείο, έτοιμα για τράπεζα ή πελάτη.",
      )}
      loading={res.loading && !data}
      error={res.error ? t("The passport could not be loaded.", "Το διαβατήριο δεν φορτώθηκε.") : null}
      onRetry={res.reload}
      actions={
        <Btn variant="primary" onClick={download} disabled={!data || downloading}>
          {downloading ? t("Preparing PDF…", "Προετοιμασία PDF…") : t("Download PDF", "Λήψη PDF")}
        </Btn>
      }
      toolbar={
        <ConsoleTabs
          value={tab}
          onChange={(k) => setTab(k as Tab)}
          items={[
            { key: "overview", label: t("Overview", "Σύνοψη") },
            { key: "disclosures", label: t("Disclosures", "Γνωστοποιήσεις"), count: data?.disclosures.length },
            { key: "share", label: t("Sharing", "Κοινοποίηση") },
          ]}
        />
      }
    >
      {data && (
        <>
          <ReadingRail>
            <Reading
              label={t("Complete", "Πληρότητα")}
              value={`${data.metrics.overallCompletenessPct}%`}
              tone={data.metrics.overallCompletenessPct >= 80 ? "good" : "warn"}
              note={t(`${checked} of ${items.length} items checked against records`, `${checked} από ${items.length} στοιχεία ελεγμένα με παραστατικά`)}
            />
            <Reading label={t("Electricity", "Ηλεκτρισμός")} value={fmt(data.metrics.totalEnergyMwh, loc, 2)} unit="MWh" note={`${fmt(data.metrics.scope2Tonnes, loc, 2)} t CO₂e · Scope 2`} />
            <Reading label={t("Fuel", "Καύσιμα")} value={fmt(data.metrics.scope1Tonnes, loc, 2)} unit="t CO₂e" note="Scope 1" />
            <Reading label={t("Water", "Νερό")} value={fmt(data.metrics.waterM3, loc, 0)} unit="m³" note={t("From water bills", "Από λογαριασμούς νερού")} />
          </ReadingRail>

          {tab === "overview" && (
            <PlateGrid columns={2}>
              <Plate label={t("Company", "Εταιρεία")}>
                <Ledger
                  items={[
                    { id: "name", title: t("Legal name", "Επωνυμία"), value: data.company.legalName || data.company.name },
                    {
                      id: "reg",
                      title: t("Registration number", "Αριθμός εγγραφής"),
                      value: data.company.registrationNo || t("Not added yet", "Δεν έχει προστεθεί"),
                      valueTone: data.company.registrationNo ? undefined : "warn",
                    },
                    { id: "sector", title: t("Industry", "Κλάδος"), value: data.company.sector || "—" },
                    { id: "staff", title: t("Staff", "Προσωπικό"), value: data.company.employees > 0 ? String(data.company.employees) : "—" },
                    { id: "year", title: t("Reporting year", "Έτος αναφοράς"), value: String(data.company.baselineYear) },
                  ]}
                />
              </Plate>

              <Plate label={t("What backs these figures", "Τι στηρίζει τα στοιχεία")}>
                <Ledger
                  items={[
                    { id: "docs", title: t("Bills and documents on file", "Λογαριασμοί και έγγραφα"), value: String(data.verifiedDocumentsCount) },
                    { id: "proj", title: t("Projects confirmed with proof", "Έργα επιβεβαιωμένα με αποδείξεις"), value: String(data.confirmedActionsCount) },
                    {
                      id: "gaps",
                      title: t("Items with no figure yet", "Στοιχεία χωρίς τιμή"),
                      value: String(missing),
                      valueTone: missing > 0 ? "warn" : "good",
                    },
                  ]}
                />
                <div className="vck-fingerprint">
                  <small>{t("Fingerprint of this version (SHA-256)", "Αποτύπωμα αυτής της έκδοσης (SHA-256)")}</small>
                  <code>{data.merkleRootHash}</code>
                  <small>
                    {t(
                      "It changes whenever a figure changes. Anyone can check a downloaded PDF at vuneli.com/verify.",
                      "Αλλάζει όταν αλλάζει κάποιο στοιχείο. Κάθε PDF ελέγχεται στο vuneli.com/verify.",
                    )}
                  </small>
                </div>
              </Plate>
            </PlateGrid>
          )}

          {tab === "disclosures" &&
            (data.disclosures.length === 0 ? (
              <Empty title={t("No disclosures yet", "Δεν υπάρχουν γνωστοποιήσεις")} body={t("Add bills to start filling the VSME items.", "Προσθέστε λογαριασμούς για να ξεκινήσετε.")} />
            ) : (
              <PlateGrid columns={1}>
                {data.disclosures.map((block) => (
                  <DisclosurePlate key={block.code} block={block} isEl={isEl} />
                ))}
              </PlateGrid>
            ))}

          {tab === "share" && (
            <PlateGrid columns={2}>
              <Plate
                label={t("Public link", "Δημόσιος σύνδεσμος")}
                meta={<State tone={data.passport.isPublic ? "live" : "idle"}>{data.passport.isPublic ? t("On", "Ενεργός") : t("Off", "Ανενεργός")}</State>}
              >
                <p className="vck-prose">
                  {data.passport.isPublic
                    ? t("Anyone with this link can see the figures on this page. Bills and documents stay private.", "Όποιος έχει τον σύνδεσμο βλέπει τα στοιχεία. Λογαριασμοί και έγγραφα μένουν ιδιωτικά.")
                    : t("Switch the link on to send the passport to a bank or customer. You can switch it off at any time.", "Ενεργοποιήστε τον σύνδεσμο για να τον στείλετε. Μπορείτε να τον απενεργοποιήσετε όποτε θέλετε.")}
                </p>
                {data.passport.isPublic && (
                  <div className="vck-fingerprint">
                    <code>{shareUrl}</code>
                  </div>
                )}
                <div className="vck-row-actions">
                  {data.passport.isPublic && <Btn onClick={copy}>{t("Copy link", "Αντιγραφή")}</Btn>}
                  <Btn variant={data.passport.isPublic ? "text" : "primary"} disabled={busy} onClick={() => setPublic(!data.passport.isPublic)}>
                    {data.passport.isPublic ? t("Switch off", "Απενεργοποίηση") : t("Switch on public link", "Ενεργοποίηση συνδέσμου")}
                  </Btn>
                </div>
              </Plate>

              <Plate label={t("Views", "Προβολές")}>
                <Ledger
                  items={[
                    { id: "views", title: t("Times opened", "Φορές που άνοιξε"), value: String(data.passport.viewCount) },
                    {
                      id: "last",
                      title: t("Last opened", "Τελευταία προβολή"),
                      value: data.passport.lastViewedAt
                        ? new Date(data.passport.lastViewedAt).toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" })
                        : t("Not opened yet", "Δεν έχει ανοιχτεί"),
                    },
                  ]}
                />
              </Plate>
            </PlateGrid>
          )}
        </>
      )}
    </ConsolePage>
  );
}

function DisclosurePlate({ block, isEl }: { block: VsmeDisclosureBlock; isEl: boolean }) {
  const ledger: LedgerItem[] = block.items.map((item) => {
    const empty = item.value === null || item.value === undefined || item.value === "";
    return {
      id: item.id,
      lead: item.code,
      title: isEl ? item.labelEl : item.labelEn,
      detail: item.source,
      value: empty ? (isEl ? "Δεν καταχωρήθηκε" : "Not recorded") : `${item.value}${item.unit ? ` ${item.unit}` : ""}`,
      valueTone: empty ? "warn" : undefined,
      note: empty ? undefined : item.isVerified ? (isEl ? "Ελεγμένο με παραστατικά" : "Checked against records") : isEl ? "Δήλωση εταιρείας" : "Company statement",
    };
  });
  return (
    <Plate
      label={`${block.code} · ${isEl ? block.titleEl : block.titleEn}`}
      meta={`${block.completenessPct}%`}
      metaTone={block.completenessPct >= 80 ? "good" : "warn"}
      foot={<Bar pct={block.completenessPct} tone={block.completenessPct >= 80 ? "lime" : "warn"} />}
    >
      <p className="vck-prose">{isEl ? block.summaryEl : block.summaryEn}</p>
      <Ledger items={ledger} />
    </Plate>
  );
}
