"use client";

/**
 * Integrations: every source a figure in the workspace can come from, with
 * its real state. Live feeds show their latest measured reading; account
 * links show whether they are set up and made. One view, no guessed numbers.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ConsolePage, Plate, Reading, ReadingRail, Btn, Bar } from "@/components/app/console/kit";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { ConnectorTile } from "@/components/app/integrations/ConnectorTile";
import { SaltEdgeModal } from "@/components/app/integrations/SaltEdgeModal";
import { NangoModal } from "@/components/app/integrations/NangoModal";
import { BillInboxBlock, BillPaymentsBlock, billPayNote } from "@/components/app/integrations/BillChecks";
import { ERP_SYSTEMS } from "@/lib/integrations/erp-catalog";
import {
  CONNECTORS,
  CATEGORY_LABEL,
  CATEGORY_NOTE,
  CATEGORY_ORDER,
  type Connector,
} from "@/components/app/integrations/catalog";
import type { IntegrationsData } from "@/app/api/console/integrations/route";

const PATH = "/api/console/integrations";

/** Board names for the bill list. Mirrors WATER_BOARDS on the server (kept client-safe here). */
const WATER_BOARD_LABEL: Record<string, { en: string; el: string }> = {
  nicosia: { en: "Water Board of Nicosia", el: "ΣΥ Λευκωσίας" },
  limassol: { en: "Water Board of Limassol", el: "ΣΥ Λεμεσού" },
  larnaca: { en: "Water Board of Larnaca", el: "ΣΥ Λάρνακας" },
  paphos: { en: "Paphos water supply", el: "Υδατοπρομήθεια Πάφου" },
  other: { en: "Other water supplier", el: "Άλλος πάροχος νερού" },
};

function IntegrationsContent() {
  const t = useTranslations("dashboard.integrations");
  const locale = (useLocale() === "el" ? "el" : "en") as "en" | "el";
  const loc = locale === "el" ? "el-CY" : "en-GB";
  const L = (en: string, el: string) => (locale === "el" ? el : en);
  const router = useRouter();
  const searchParams = useSearchParams();
  const res = useWorkspaceResource<IntegrationsData>(PATH);
  const bankAction = useWorkspaceAction();
  const saltEdgeAction = useWorkspaceAction();
  const nangoAction = useWorkspaceAction();
  const eacAction = useWorkspaceAction();
  const eacInput = useRef<HTMLInputElement>(null);
  const waterAction = useWorkspaceAction();
  const waterInput = useRef<HTMLInputElement>(null);
  const inboxAction = useWorkspaceAction();
  const [saltEdgeModalOpen, setSaltEdgeModalOpen] = useState(false);
  const [nangoModalOpen, setNangoModalOpen] = useState(false);
  const d = res.data;

  const time = useMemo(() => new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }), [loc]);
  const date = useMemo(() => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }), [loc]);

  // Result of the Bank of Cyprus sign-in round trip.
  useEffect(() => {
    const outcome = searchParams.get("bank");
    if (!outcome) return;
    const messages: Record<string, [string, string]> = {
      declined: ["The bank link was cancelled at the bank. Nothing was saved.", "Η σύνδεση ακυρώθηκε στην τράπεζα. Δεν αποθηκεύτηκε τίποτα."],
      missing_code: ["The bank did not send the approval back. Please try again.", "Η τράπεζα δεν επέστρεψε την έγκριση. Δοκιμάστε ξανά."],
      expired_request: ["That link request timed out. Please start again.", "Το αίτημα σύνδεσης έληξε. Ξεκινήστε ξανά."],
      signed_out: ["You were signed out during the link. Sign in and start again.", "Αποσυνδεθήκατε κατά τη σύνδεση. Συνδεθείτε και ξεκινήστε ξανά."],
      not_configured: ["Bank linking is not set up yet.", "Η σύνδεση τράπεζας δεν έχει ρυθμιστεί ακόμη."],
      activation_failed: ["The bank did not confirm the link. Please try again.", "Η τράπεζα δεν επιβεβαίωσε τη σύνδεση. Δοκιμάστε ξανά."],
      no_accounts: ["No account was selected at the bank, so nothing was linked.", "Δεν επιλέχθηκε λογαριασμός στην τράπεζα, οπότε δεν έγινε σύνδεση."],
      connected_unread: ["Account linked. The first read did not finish; use Read again.", "Ο λογαριασμός συνδέθηκε. Η πρώτη ανάγνωση δεν ολοκληρώθηκε· πατήστε Ανάγνωση ξανά."],
    };
    if (outcome === "connected") {
      toast.success(L("Bank of Cyprus account linked and read.", "Ο λογαριασμός Τράπεζας Κύπρου συνδέθηκε και διαβάστηκε."));
    } else {
      const m = messages[outcome] ?? ["The bank link did not finish. Please try again.", "Η σύνδεση τράπεζας δεν ολοκληρώθηκε. Δοκιμάστε ξανά."];
      (outcome === "connected_unread" ? toast.warning : toast.error)(L(m[0], m[1]));
    }
    res.reload();
    router.replace("/app/integrations");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Result of Salt Edge sign-in return trip.
  useEffect(() => {
    const prov = searchParams.get("provider");
    const st = searchParams.get("status");
    if (prov === "saltedge" && st === "connected") {
      toast.success(L("Cyprus bank linked successfully via Salt Edge.", "Η κυπριακή τράπεζα συνδέθηκε επιτυχώς μέσω Salt Edge."));
      res.reload();
      router.replace("/app/integrations");
    }
  }, [searchParams]);

  useEffect(() => {
    if (bankAction.error) toast.error(bankAction.error);
  }, [bankAction.error]);
  useEffect(() => {
    if (saltEdgeAction.error) toast.error(saltEdgeAction.error);
  }, [saltEdgeAction.error]);
  useEffect(() => {
    if (nangoAction.error) toast.error(nangoAction.error);
  }, [nangoAction.error]);
  useEffect(() => {
    if (eacAction.error) toast.error(eacAction.error);
  }, [eacAction.error]);
  useEffect(() => {
    if (waterAction.error) toast.error(waterAction.error);
  }, [waterAction.error]);
  useEffect(() => {
    if (inboxAction.error) toast.error(inboxAction.error);
  }, [inboxAction.error]);

  const openInbox = async (rotate: boolean) => {
    if (rotate && !window.confirm(L("Get a new address? The old one stops receiving bills, so update your forwarding rule.", "Νέα διεύθυνση; Η παλιά σταματά να δέχεται λογαριασμούς, οπότε ενημερώστε τον κανόνα προώθησης."))) return;
    const r = await inboxAction.run<{ address: string }>("/api/console/integrations/bill-inbox", { body: { rotate }, invalidates: [PATH] });
    if (r) toast.success(L("Forwarding address ready.", "Η διεύθυνση προώθησης είναι έτοιμη."));
  };
  const closeInbox = async () => {
    if (!window.confirm(L("Stop forwarding? Bills sent to this address will bounce.", "Διακοπή προώθησης; Οι λογαριασμοί σε αυτή τη διεύθυνση θα επιστρέφονται."))) return;
    const r = await inboxAction.run("/api/console/integrations/bill-inbox", { method: "DELETE", invalidates: [PATH] });
    if (r) toast.success(L("Forwarding stopped.", "Η προώθηση σταμάτησε."));
  };

  const uploadEac = async (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const r = await eacAction.run<{ bill: { kwh: number; periodStart: string; periodEnd: string }; duplicate: boolean }>(
      "/api/console/integrations/eac/bill",
      { body: form, invalidates: [PATH, "/api/console/overview"] },
    );
    if (eacInput.current) eacInput.current.value = "";
    if (!r) return;
    if (r.duplicate) toast.info(L("This bill was already added.", "Αυτός ο λογαριασμός έχει ήδη προστεθεί."));
    else toast.success(L(`Bill read: ${r.bill.kwh} kWh.`, `Ο λογαριασμός διαβάστηκε: ${r.bill.kwh} kWh.`));
  };
  const removeEac = async (id: number) => {
    if (!window.confirm(L("Remove this bill and its figures?", "Αφαίρεση αυτού του λογαριασμού και των στοιχείων του;"))) return;
    const r = await eacAction.run(`/api/console/integrations/eac/bill?id=${id}`, { method: "DELETE", invalidates: [PATH, "/api/console/overview"] });
    if (r) toast.success(L("Bill removed.", "Ο λογαριασμός αφαιρέθηκε."));
  };
  const uploadWater = async (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const r = await waterAction.run<{ bill: { m3: number }; duplicate: boolean }>(
      "/api/console/integrations/water/bill",
      { body: form, invalidates: [PATH, "/api/console/overview"] },
    );
    if (waterInput.current) waterInput.current.value = "";
    if (!r) return;
    if (r.duplicate) toast.info(L("This bill was already added.", "Αυτός ο λογαριασμός έχει ήδη προστεθεί."));
    else toast.success(L(`Bill read: ${r.bill.m3} m³.`, `Ο λογαριασμός διαβάστηκε: ${r.bill.m3} m³.`));
  };
  const removeWater = async (id: number) => {
    if (!window.confirm(L("Remove this bill and its figures?", "Αφαίρεση αυτού του λογαριασμού και των στοιχείων του;"))) return;
    const r = await waterAction.run(`/api/console/integrations/water/bill?id=${id}`, { method: "DELETE", invalidates: [PATH, "/api/console/overview"] });
    if (r) toast.success(L("Bill removed.", "Ο λογαριασμός αφαιρέθηκε."));
  };

  const connectBank = async () => {
    const r = await bankAction.run<{ authUrl?: string }>("/api/console/bank/connect", { invalidates: [] });
    if (r?.authUrl) window.location.href = r.authUrl;
  };
  const syncBank = async () => {
    const r = await bankAction.run<{ read: number; added: number }>("/api/console/bank/sync", { invalidates: [PATH, "/api/console/overview"] });
    if (r) toast.success(L(`Read ${r.read} payments, ${r.added} new.`, `Διαβάστηκαν ${r.read} πληρωμές, ${r.added} νέες.`));
  };
  const unlinkBank = async () => {
    const ok = window.confirm(
      L(
        "Unlink Bank of Cyprus? Vuneli deletes the link and every payment it read. You can also withdraw consent in 1Bank.",
        "Αποσύνδεση Τράπεζας Κύπρου; Η Vuneli διαγράφει τη σύνδεση και όλες τις πληρωμές που διάβασε. Μπορείτε επίσης να ανακαλέσετε τη συγκατάθεση στο 1Bank.",
      ),
    );
    if (!ok) return;
    const r = await bankAction.run("/api/console/bank/disconnect", { invalidates: [PATH, "/api/console/overview"] });
    if (r) toast.success(L("Bank link removed.", "Η σύνδεση τράπεζας αφαιρέθηκε."));
  };

  const unlinkSaltEdge = async () => {
    const ok = window.confirm(
      L(
        "Unlink this bank? Vuneli stops reading payments from it. You can also withdraw consent in your bank app.",
        "Αποσύνδεση αυτής της τράπεζας; Το Vuneli σταματά να διαβάζει πληρωμές. Μπορείτε επίσης να ανακαλέσετε τη συγκατάθεση στην εφαρμογή της τράπεζας.",
      ),
    );
    if (!ok) return;
    const r = await saltEdgeAction.run("/api/console/integrations/saltedge/connect", {
      method: "DELETE",
      invalidates: [PATH],
    });
    if (r) toast.success(L("Bank connection revoked.", "Η τραπεζική σύνδεση αφαιρέθηκε."));
  };

  const unlinkNango = async () => {
    const ok = window.confirm(
      L(
        "Disconnect your accounting system? Vuneli stops reading new bills. Figures already calculated stay in your history.",
        "Αποσύνδεση λογιστικού συστήματος; Το Vuneli σταματά να διαβάζει νέα τιμολόγια. Όσα έχουν ήδη υπολογιστεί μένουν στο ιστορικό σας.",
      ),
    );
    if (!ok) return;
    const r = await nangoAction.run("/api/console/integrations/nango/connect", {
      method: "DELETE",
      invalidates: [PATH],
    });
    if (r) toast.success(L("ERP connection disconnected.", "Η σύνδεση ERP αποσυνδέθηκε."));
  };

  const bank = d?.bank;
  const saltedge = d?.saltedge;
  const nango = d?.nango;
  const eur2 = useMemo(() => new Intl.NumberFormat(loc, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }), [loc]);
  const eur = useMemo(() => new Intl.NumberFormat(loc, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }), [loc]);
  const CAT: Record<string, [string, string]> = {
    electricity: ["Electricity", "Ρεύμα"],
    fuel: ["Fuel", "Καύσιμα"],
    water: ["Water", "Νερό"],
    freight: ["Freight and courier", "Μεταφορές"],
    other: ["Other", "Άλλο"],
  };
  // A live feed counts only when it actually answered on this visit.
  const answered: Record<string, boolean> = {
    "energy-charts": Boolean(d?.grid),
    "climate-trace": Boolean(d?.climateTrace),
    cystat: Boolean(d?.cystat),
    wikirate: d?.wikirate?.cyprusCompanies != null,
    registrar: Boolean(d?.registry),
  };
  const liveCount = CONNECTORS.filter((c) => c.state === "live" && answered[c.id]).length;
  const linkableCount = CONNECTORS.filter((c) => c.state === "oauth" || c.state === "upload").length;
  const linkedCount =
    (bank?.status === "active" ? 1 : 0) +
    (saltedge?.status === "active" ? 1 : 0) +
    (nango?.connected ? 1 : 0) +
    ((d?.eac?.bills.length ?? 0) > 0 ? 1 : 0) +
    ((d?.water?.bills.length ?? 0) > 0 ? 1 : 0);
  const num = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
  const num1 = new Intl.NumberFormat(loc, { maximumFractionDigits: 1 });
  const CT_SECTOR: Record<string, [string, string]> = {
    power: ["Power", "Ηλεκτροπαραγωγή"],
    transportation: ["Transport", "Μεταφορές"],
    buildings: ["Buildings", "Κτίρια"],
    manufacturing: ["Manufacturing", "Μεταποίηση"],
    waste: ["Waste", "Απόβλητα"],
    agriculture: ["Agriculture", "Γεωργία"],
  };
  const scheduledCount = CONNECTORS.filter((c) => c.state === "scheduled").length;
  const inUse = liveCount + linkedCount;
  const coverage = Math.round((inUse / CONNECTORS.length) * 100);

  const statusFor = (c: Connector) => {
    if (c.id === "water" && d?.water) {
      if (d.water.bills.length > 0) return { word: L(`${d.water.bills.length === 1 ? "1 bill" : `${d.water.bills.length} bills`}`, `Λογαριασμοί: ${d.water.bills.length}`), tone: "good" as const };
      if (!d.water.readerReady) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
    }
    if (c.id === "eac" && d?.eac) {
      if (d.eac.bills.length > 0) return { word: L(`${d.eac.bills.length === 1 ? "1 bill" : `${d.eac.bills.length} bills`}`, `Λογαριασμοί: ${d.eac.bills.length}`), tone: "good" as const };
      if (!d.eac.readerReady) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
    }
    if (c.state === "live" && d && c.id in answered && !answered[c.id]) {
      if (c.id === "registrar") return { word: L("Not linked yet", "Δεν έχει συνδεθεί"), tone: "idle" as const };
      if (c.id === "wikirate" && !d.wikirate.configured) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
      return { word: L("No answer now", "Χωρίς απάντηση"), tone: "warn" as const };
    }
    if (c.id === "bankofcyprus" && bank) {
      if (!bank.configured) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
      if (bank.status === "active") return bank.failed ? { word: L("Last read failed", "Η τελευταία ανάγνωση απέτυχε"), tone: "warn" as const } : { word: L("Linked", "Συνδεδεμένο"), tone: "good" as const };
      if (bank.status === "expired") return { word: L("Consent ended", "Η συγκατάθεση έληξε"), tone: "bad" as const };
    }
    if (c.id === "saltedge" && saltedge) {
      if (saltedge.status === "active") return { word: L("Linked", "Συνδεδεμένο"), tone: "good" as const };
      if (saltedge.status === "pending") return { word: L("Pending authorization", "Σε εκκρεμότητα"), tone: "warn" as const };
      if (!saltedge.configured) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
      return { word: saltedge.environment === "sandbox" ? L("Ready to link (test mode)", "Έτοιμο για σύνδεση (δοκιμαστικό)") : L("Ready to link", "Έτοιμο για σύνδεση"), tone: "idle" as const };
    }
    if (c.id === "nango" && nango) {
      if (nango.connected) return { word: L("Connected", "Συνδεδεμένο"), tone: "good" as const };
      if (!nango.configured) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
      return { word: L("Ready to link", "Έτοιμο για σύνδεση"), tone: "idle" as const };
    }
    if (c.id === "energy-charts" && d && !d.grid) return { word: L("No answer today", "Χωρίς απάντηση σήμερα"), tone: "warn" as const };
    return undefined;
  };

  const actionFor = (c: Connector) => {
    if (c.id === "bankofcyprus") {
      if (!bank || !bank.configured) return null;
      if (bank.status === "active") {
        return (
          <>
            <Btn variant="primary" onClick={syncBank} disabled={bankAction.busy}>
              {bankAction.busy ? L("Working…", "Σε εξέλιξη…") : L("Read again", "Ανάγνωση ξανά")}
            </Btn>
            <Btn onClick={unlinkBank} disabled={bankAction.busy}>{L("Unlink", "Αποσύνδεση")}</Btn>
          </>
        );
      }
      return (
        <>
          <Btn variant="primary" onClick={connectBank} disabled={bankAction.busy}>
            {bankAction.busy
              ? L("Opening the bank…", "Άνοιγμα τράπεζας…")
              : bank.status === "expired"
                ? L("Link again", "Νέα σύνδεση")
                : L("Link account", "Σύνδεση λογαριασμού")}
          </Btn>
          {bank.status === "expired" && <Btn onClick={unlinkBank} disabled={bankAction.busy}>{L("Delete stored payments", "Διαγραφή πληρωμών")}</Btn>}
        </>
      );
    }
    if (c.id === "saltedge") {
      if (saltedge?.status === "active") {
        return (
          <Btn onClick={unlinkSaltEdge} disabled={saltEdgeAction.busy}>
            {saltEdgeAction.busy ? L("Unlinking…", "Αποσύνδεση…") : L("Unlink bank", "Αποσύνδεση")}
          </Btn>
        );
      }
      return (
        <Btn variant="primary" onClick={() => setSaltEdgeModalOpen(true)} disabled={saltEdgeAction.busy}>
          {saltEdgeAction.busy ? L("Opening…", "Άνοιγμα…") : L("Choose a bank", "Επιλογή τράπεζας")}
        </Btn>
      );
    }
    if (c.id === "nango") {
      if (nango?.connected) {
        return (
          <Btn onClick={unlinkNango} disabled={nangoAction.busy}>
            {nangoAction.busy ? L("Disconnecting…", "Αποσύνδεση…") : L("Disconnect ERP", "Αποσύνδεση")}
          </Btn>
        );
      }
      return (
        <Btn variant="primary" onClick={() => setNangoModalOpen(true)} disabled={nangoAction.busy}>
          {nangoAction.busy ? L("Opening…", "Άνοιγμα…") : L("Choose a system", "Επιλογή συστήματος")}
        </Btn>
      );
    }
    if (c.id === "eac" && d?.eac) {
      return (
        <>
          <input
            ref={eacInput}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => uploadEac(e.target.files?.[0])}
          />
          <Btn variant="primary" onClick={() => eacInput.current?.click()} disabled={eacAction.busy || !d.eac.readerReady}>
            {eacAction.busy
              ? L("Reading the bill…", "Ανάγνωση λογαριασμού…")
              : d.eac.bills.length > 0
                ? L("Add another bill", "Προσθήκη λογαριασμού")
                : L("Upload a bill", "Ανέβασμα λογαριασμού")}
          </Btn>
        </>
      );
    }
    if (c.id === "water" && d?.water) {
      return (
        <>
          <input
            ref={waterInput}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => uploadWater(e.target.files?.[0])}
          />
          <Btn variant="primary" onClick={() => waterInput.current?.click()} disabled={waterAction.busy || !d.water.readerReady}>
            {waterAction.busy
              ? L("Reading the bill…", "Ανάγνωση λογαριασμού…")
              : d.water.bills.length > 0
                ? L("Add another bill", "Προσθήκη λογαριασμού")
                : L("Upload a bill", "Ανέβασμα λογαριασμού")}
          </Btn>
        </>
      );
    }
    if (c.id === "energy-charts" && d?.grid) {
      return <Link href="/app/insights" className="vck-btn vck-btn-quiet">{L("Open today's grid", "Το σημερινό δίκτυο")}</Link>;
    }
    return null;
  };

  const billCore = (c: Connector) => {
    if (!d) return null;
    if (c.id === "water" && d?.water) {
      const w = d.water;
      if (w.bills.length === 0) {
        return (
          <p className="vci-tile-note">
            {w.readerReady
              ? L("PDF or photo, up to 10 MB. A bill whose m³ or period cannot be read is refused, never guessed. Sewerage bills are not water bills.", "PDF ή φωτογραφία, έως 10 MB. Λογαριασμός χωρίς αναγνώσιμα m³ ή περίοδο απορρίπτεται, χωρίς εικασίες. Οι λογαριασμοί αποχέτευσης δεν είναι λογαριασμοί νερού.")
              : L("Bill reading opens once the workspace owner adds the AI reader key.", "Η ανάγνωση λογαριασμών ανοίγει όταν ο ιδιοκτήτης προσθέσει το κλειδί ανάγνωσης.")}
          </p>
        );
      }
      return (
        <>
          <div className="vci-tile-detail">
            <div>
              <span>{L("Water on your bills", "Νερό στους λογαριασμούς")}</span>
              <strong className="vck-num">{num1.format(w.totalM3)} m³</strong>
            </div>
            <div>
              <span>{L("Scope 3", "Scope 3")}</span>
              <strong className="vck-num">{num1.format(w.totalKgCo2e)} kg CO₂e</strong>
            </div>
          </div>
          <ul className="vci-bank-lines" aria-label={L("Latest bills", "Τελευταίοι λογαριασμοί")}>
            {w.bills.map((b) => (
              <li key={b.id}>
                <span className="vci-bank-line-what">
                  {date.format(new Date(b.periodStart))} – {date.format(new Date(b.periodEnd))}
                </span>
                <span className="vci-bank-line-why">
                  {WATER_BOARD_LABEL[b.board]?.[locale] ?? WATER_BOARD_LABEL.other[locale]}
                  {" · "}
                  {num1.format(b.m3)} m³{b.amountEur !== null ? ` · ${eur2.format(b.amountEur)}` : ""}{b.accountNumber ? ` · ${L("account", "λογ.")} ${b.accountNumber}` : ""}{(() => { const n = billPayNote(c.id === "water" ? d.waterPayments : d.eacPayments, b.id, L, date); return n ? ` · ${n}` : ""; })()}
                  {" · "}
                  <button type="button" className="vci-link-btn" onClick={() => removeWater(b.id)} disabled={waterAction.busy}>
                    {L("Remove", "Αφαίρεση")}
                  </button>
                </span>
                <strong className="vck-num">{num1.format(b.kgCo2e)} kg</strong>
              </li>
            ))}
          </ul>
          <p className="vci-tile-note">
            {L(`Factor: ${w.factor.kgPerM3} kg CO₂e per m³, ${w.factor.source}, ${w.factor.vintage}.`, `Συντελεστής: ${w.factor.kgPerM3} kg CO₂e ανά m³, ${w.factor.source}, ${w.factor.vintage}.`)}
          </p>
        </>
      );
    }
    if (c.id === "eac" && d?.eac) {
      const e = d.eac;
      if (e.bills.length === 0) {
        return (
          <p className="vci-tile-note">
            {e.readerReady
              ? L("PDF or photo, up to 10 MB. A bill whose kWh or period cannot be read is refused, never guessed.", "PDF ή φωτογραφία, έως 10 MB. Λογαριασμός χωρίς αναγνώσιμα kWh ή περίοδο απορρίπτεται, χωρίς εικασίες.")
              : L("Bill reading opens once the workspace owner adds the AI reader key.", "Η ανάγνωση λογαριασμών ανοίγει όταν ο ιδιοκτήτης προσθέσει το κλειδί ανάγνωσης.")}
          </p>
        );
      }
      return (
        <>
          <div className="vci-tile-detail">
            <div>
              <span>{L("Electricity on your bills", "Ηλεκτρισμός στους λογαριασμούς")}</span>
              <strong className="vck-num">{num.format(e.totalKwh)} kWh</strong>
            </div>
            <div>
              <span>{L("Scope 2", "Scope 2")}</span>
              <strong className="vck-num">{num1.format(e.totalKgCo2e / 1000)} t CO₂e</strong>
            </div>
          </div>
          <ul className="vci-bank-lines" aria-label={L("Latest bills", "Τελευταίοι λογαριασμοί")}>
            {e.bills.map((b) => (
              <li key={b.id}>
                <span className="vci-bank-line-what">
                  {date.format(new Date(b.periodStart))} – {date.format(new Date(b.periodEnd))}
                </span>
                <span className="vci-bank-line-why">
                  {num.format(b.kwh)} kWh{b.amountEur !== null ? ` · ${eur2.format(b.amountEur)}` : ""}{b.accountNumber ? ` · ${L("account", "λογ.")} ${b.accountNumber}` : ""}{(() => { const n = billPayNote(c.id === "water" ? d.waterPayments : d.eacPayments, b.id, L, date); return n ? ` · ${n}` : ""; })()}
                  {" · "}
                  <button type="button" className="vci-link-btn" onClick={() => removeEac(b.id)} disabled={eacAction.busy}>
                    {L("Remove", "Αφαίρεση")}
                  </button>
                </span>
                <strong className="vck-num">{num1.format(b.kgCo2e)} kg</strong>
              </li>
            ))}
          </ul>
          <p className="vci-tile-note">
            {L(`Factor: ${e.factor.kgPerKwh} kg CO₂e per kWh, ${e.factor.source}, ${e.factor.vintage}.`, `Συντελεστής: ${e.factor.kgPerKwh} kg CO₂e ανά kWh, ${e.factor.source}, ${e.factor.vintage}.`)}
          </p>
        </>
      );
    }
    return null;
  };

  const detailFor = (c: Connector) => {
    if (c.id === "bankofcyprus" && bank) {
      if (!bank.configured) {
        return <p className="vci-tile-note">{L("Bank linking opens once the workspace owner adds the Bank of Cyprus app keys.", "Η σύνδεση τράπεζας ανοίγει όταν ο ιδιοκτήτης προσθέσει τα κλειδιά της Τράπεζας Κύπρου.")}</p>;
      }
      const testNote = bank.environment === "sandbox" && (
        <p className="vci-tile-note">
          {L("Test mode: this uses the bank's practice system with sample accounts, not real money data.", "Δοκιμαστική λειτουργία: χρησιμοποιεί το δοκιμαστικό σύστημα της τράπεζας με δείγματα λογαριασμών, όχι πραγματικά δεδομένα.")}
        </p>
      );
      if (bank.status !== "active") {
        return (
          <>
            <p className="vci-tile-note">
              {bank.status === "expired"
                ? L("The bank consent has ended (it lasts up to 180 days). Link again to keep reading payments.", "Η συγκατάθεση της τράπεζας έληξε (διαρκεί έως 180 ημέρες). Συνδέστε ξανά για να συνεχίσει η ανάγνωση.")
                : L("You sign in at Bank of Cyprus and choose which accounts Vuneli may read. Vuneli never sees your passcode and cannot make payments.", "Συνδέεστε στην Τράπεζα Κύπρου και επιλέγετε ποιους λογαριασμούς μπορεί να διαβάσει η Vuneli. Η Vuneli δεν βλέπει τον κωδικό σας και δεν μπορεί να κάνει πληρωμές.")}
            </p>
            {testNote}
          </>
        );
      }
      const found = bank.categories.filter((c) => c.count > 0);
      return (
        <>
          <div className="vci-tile-detail">
            <div>
              <span>{L("Accounts read", "Λογαριασμοί")}</span>
              <strong className="vck-num">{bank.accounts}</strong>
            </div>
            <div>
              <span>{L(`Payments, last ${bank.windowDays} days`, `Πληρωμές, τελευταίες ${bank.windowDays} ημέρες`)}</span>
              <strong className="vck-num">{bank.paymentsRead}</strong>
            </div>
            <div>
              <span>{L("Last read", "Τελευταία ανάγνωση")}</span>
              <strong className="vck-num">{bank.lastSyncAt ? time.format(new Date(bank.lastSyncAt)) : L("Not yet", "Όχι ακόμη")}</strong>
            </div>
            {bank.consentEndsOn && (
              <div>
                <span>{L("Consent ends", "Λήξη συγκατάθεσης")}</span>
                <strong className="vck-num">{date.format(new Date(bank.consentEndsOn))}</strong>
              </div>
            )}
          </div>
          {found.length > 0 ? (
            <div className="vci-tile-detail">
              {found.map((c) => (
                <div key={c.category}>
                  <span>{L(CAT[c.category][0], CAT[c.category][1])} · {c.count}</span>
                  <strong className="vck-num">{eur.format(c.total)}</strong>
                </div>
              ))}
            </div>
          ) : (
            bank.paymentsRead > 0 && (
              <p className="vci-tile-note">
                {L("No fuel, electricity, water or freight payments were recognised yet. Unrecognised payments are left out, never guessed.", "Δεν αναγνωρίστηκαν ακόμη πληρωμές για καύσιμα, ρεύμα, νερό ή μεταφορές. Όσες δεν αναγνωρίζονται μένουν εκτός, χωρίς εικασίες.")}
              </p>
            )
          )}
          {bank.recent.length > 0 && (
            <ul className="vci-bank-lines" aria-label={L("Latest matched payments", "Τελευταίες πληρωμές που ταίριαξαν")}>
              {bank.recent.map((r, i) => (
                <li key={i}>
                  <span className="vci-bank-line-what">{r.description || L(CAT[r.category][0], CAT[r.category][1])}</span>
                  <span className="vci-bank-line-why">
                    {date.format(new Date(r.bookedOn))} · {L(CAT[r.category][0], CAT[r.category][1])}{r.rule ? ` · ${r.rule}` : ""}
                  </span>
                  <strong className="vck-num">{new Intl.NumberFormat(loc, { style: "currency", currency: r.currency || "EUR" }).format(r.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
          {bank.unmarked > 0 && (
            <p className="vci-tile-note">
              {L(`${bank.unmarked} payment(s) came without an in/out marker from the bank, so they are not counted as spend.`, `${bank.unmarked} πληρωμή(ές) ήρθαν χωρίς ένδειξη εισερχόμενης/εξερχόμενης, οπότε δεν μετρώνται ως δαπάνη.`)}
            </p>
          )}
          {testNote}
        </>
      );
    }
    if (c.id === "saltedge") {
      const se = d?.saltedge;
      if (se?.status === "active") {
        return (
          <div className="vci-tile-detail">
            <div>
              <span>{L("Accounts read", "Λογαριασμοί")}</span>
              <strong className="vck-num">{se.accounts}</strong>
            </div>
            <div>
              <span>{L("Connected bank", "Συνδεδεμένη τράπεζα")}</span>
              <strong>{se.banks.join(", ") || L("Not reported yet", "Δεν έχει αναφερθεί ακόμη")}</strong>
            </div>
            {se.lastSyncAt && (
              <div>
                <span>{L("Last sync", "Τελευταίος συγχρονισμός")}</span>
                <strong className="vck-num">{date.format(new Date(se.lastSyncAt))}</strong>
              </div>
            )}
          </div>
        );
      }
      return (
        <p className="vci-tile-note">
          {L(
            "For Eurobank (including former Hellenic Bank accounts) and Alpha Bank Cyprus. Read-only: Vuneli sees payments and cannot move money.",
            "Για Eurobank (και πρώην λογαριασμούς Ελληνικής Τράπεζας) και Alpha Bank Κύπρου. Μόνο ανάγνωση: το Vuneli βλέπει πληρωμές και δεν μπορεί να μεταφέρει χρήματα.",
          )}
        </p>
      );
    }
    if (c.id === "nango") {
      const ng = d?.nango;
      if (ng?.connected) {
        return (
          <div className="vci-tile-detail">
            <div>
              <span>{L("Active connectors", "Ενεργές συνδέσεις")}</span>
              <strong className="vck-num">{ng.connectionsCount}</strong>
            </div>
            <div>
              <span>{L("Connected platforms", "Συστήματα")}</span>
              <strong>{ng.providers.map((id) => ERP_SYSTEMS.find((s) => s.id === id)?.name ?? id).join(", ")}</strong>
            </div>
            {ng.lastSyncAt && (
              <div>
                <span>{L("Last sync", "Τελευταίος συγχρονισμός")}</span>
                <strong className="vck-num">{date.format(new Date(ng.lastSyncAt))}</strong>
              </div>
            )}
          </div>
        );
      }
      return (
        <p className="vci-tile-note">
          {L(
            "For Sage Intacct, SAP Business One, Oracle NetSuite, Dynamics 365 Business Central, QuickBooks Online, Xero, Zoho Books and FreshBooks. Read-only: Vuneli reads supplier bills and never edits your books.",
            "Για Sage Intacct, SAP Business One, Oracle NetSuite, Dynamics 365 Business Central, QuickBooks Online, Xero, Zoho Books και FreshBooks. Μόνο ανάγνωση: το Vuneli διαβάζει τιμολόγια προμηθευτών και δεν αλλάζει ποτέ τα βιβλία σας.",
          )}
        </p>
      );
    }
    if ((c.id === "water" || c.id === "eac") && d?.water && d?.eac) {
      return (
        <>
          {billCore(c)}
          <BillPaymentsBlock kind={c.id === "water" ? "water" : "electricity"} check={c.id === "water" ? d.waterPayments : d.eacPayments} L={L} date={date} eur2={eur2} />
          <BillInboxBlock inbox={d.billInbox} L={L} time={time} busy={inboxAction.busy} onOpen={() => openInbox(false)} onRotate={() => openInbox(true)} onClose={closeInbox} />
        </>
      );
    }
    if (c.id === "climate-trace" && d) {
      const ct = d.climateTrace;
      if (!ct) {
        return (
          <p className="vci-tile-note">
            {d.climateTraceReason === "unsupported"
              ? L(`Country figures are not wired for ${d.country} yet.`, `Τα στοιχεία χώρας δεν είναι διαθέσιμα για ${d.country} ακόμη.`)
              : L("Climate TRACE did not answer just now. Nothing is shown in its place.", "Το Climate TRACE δεν απάντησε. Τίποτα δεν εμφανίζεται στη θέση του.")}
          </p>
        );
      }
      const top = ct.sectors.slice(0, 3);
      return (
        <>
          <div className="vci-tile-detail">
            <div>
              <span>{L(`${ct.country} emissions, ${ct.year}`, `Εκπομπές ${ct.country}, ${ct.year}`)}</span>
              <strong className="vck-num">{num1.format(ct.totalTonnes / 1e6)} Mt CO₂e</strong>
            </div>
            <div>
              <span>{L("Share of world total", "Μερίδιο παγκοσμίως")}</span>
              <strong className="vck-num">{ct.worldSharePct.toFixed(3)}%</strong>
            </div>
          </div>
          {top.length > 0 && (
            <div className="vci-tile-detail">
              {top.map((s) => (
                <div key={s.sector}>
                  <span>{L(CT_SECTOR[s.sector][0], CT_SECTOR[s.sector][1])}</span>
                  <strong className="vck-num">{num1.format(s.tonnes / 1e6)} Mt</strong>
                </div>
              ))}
            </div>
          )}
          <p className="vci-tile-note">{L("Context only. These never fill your own figures.", "Μόνο πλαίσιο. Ποτέ δεν συμπληρώνουν τους δικούς σας αριθμούς.")}</p>
        </>
      );
    }
    if (c.id === "cystat" && d) {
      const cs = d.cystat;
      if (!cs) {
        return <p className="vci-tile-note">{L("CyStat did not answer just now. Nothing is shown in its place.", "Η CyStat δεν απάντησε. Τίποτα δεν εμφανίζεται στη θέση της.")}</p>;
      }
      return (
        <>
          <div className="vci-tile-detail">
            <div>
              <span>{L(`Establishments in Cyprus, ${cs.year}`, `Μονάδες στην Κύπρο, ${cs.year}`)}</span>
              <strong className="vck-num">{num.format(cs.total)}</strong>
            </div>
            {cs.own && (
              <div>
                <span>{cs.own.code} · {cs.own.label}</span>
                <strong className="vck-num">{num.format(cs.own.count)}</strong>
              </div>
            )}
            {cs.own && (
              <div>
                <span>{L("Your sector's share", "Μερίδιο του κλάδου σας")}</span>
                <strong className="vck-num">{num1.format(cs.own.sharePct)}%</strong>
              </div>
            )}
          </div>
          {!cs.own && (
            <p className="vci-tile-note">
              {d.industry
                ? L("Your sector has no single NACE match, so no peer count is shown.", "Ο κλάδος σας δεν αντιστοιχεί σε μία ενότητα NACE, οπότε δεν εμφανίζεται αριθμός.")
                : L("Add your sector in Settings to see how many Cyprus establishments share it.", "Προσθέστε τον κλάδο σας στις Ρυθμίσεις για να δείτε πόσες μονάδες τον μοιράζονται.")}
            </p>
          )}
        </>
      );
    }
    if (c.id === "registrar" && d) {
      if (!d.registry) {
        return (
          <p className="vci-tile-note">
            {L("Find your company in Settings to link its register entry.", "Βρείτε την εταιρεία σας στις Ρυθμίσεις για να συνδέσετε την εγγραφή της.")}{" "}
            <a href={`/${locale}/app/settings`}>{L("Open Settings", "Άνοιγμα Ρυθμίσεων")}</a>
          </p>
        );
      }
      return (
        <div className="vci-tile-detail">
          <div>
            <span>{d.registry.registrationNo}</span>
            <strong style={{ overflowWrap: "anywhere" }}>{d.registry.legalName}</strong>
          </div>
          <div>
            <span>{L("Status", "Κατάσταση")}</span>
            <strong>{d.registry.status === "Registered" ? L("Registered", "Εγγεγραμμένη") : d.registry.status}</strong>
          </div>
        </div>
      );
    }
    if (c.id === "wikirate" && d) {
      const w = d.wikirate;
      if (!w.configured) {
        return <p className="vci-tile-note">{L("Opens once the workspace owner adds a WikiRate API key.", "Ανοίγει όταν ο ιδιοκτήτης προσθέσει κλειδί WikiRate.")}</p>;
      }
      if (w.cyprusCompanies === null) {
        return <p className="vci-tile-note">{L("WikiRate did not answer just now. Nothing is shown in its place.", "Το WikiRate δεν απάντησε. Τίποτα δεν εμφανίζεται στη θέση του.")}</p>;
      }
      return (
        <>
          <div className="vci-tile-detail">
            <div>
              <span>{L("Cyprus companies listed", "Κυπριακές εταιρείες")}</span>
              <strong className="vck-num">{w.cyprusCompanies}{w.cyprusCompanies >= 100 ? "+" : ""}</strong>
            </div>
          </div>
          {w.sample.length > 0 && <p className="vci-tile-note">{w.sample.join(" · ")}</p>}
        </>
      );
    }
    if (c.id === "energy-charts" && d) {
      if (!d.grid) {
        return (
          <p className="vci-tile-note">
            {d.gridReason === "unsupported"
              ? L(`Energy-Charts does not publish hourly data for ${d.country}.`, `Το Energy-Charts δεν δημοσιεύει ωριαία δεδομένα για ${d.country}.`)
              : L("The feed did not answer just now. Nothing is shown in its place; it is tried again on the next visit.", "Η ροή δεν απάντησε. Τίποτα δεν εμφανίζεται στη θέση της· ξαναδοκιμάζεται στην επόμενη επίσκεψη.")}
          </p>
        );
      }
      return (
        <div className="vci-tile-detail">
          <div>
            <span>{L("Latest measured hour", "Τελευταία μετρημένη ώρα")}</span>
            <strong className="vck-num">{time.format(new Date(d.grid.latestAt))}</strong>
          </div>
          <div>
            <span>{L("Carbon intensity", "Ένταση άνθρακα")}</span>
            <strong className="vck-num">{Math.round(d.grid.latestGrams)} g CO₂/kWh</strong>
          </div>
          {d.grid.renewableShare !== null && (
            <div>
              <span>{L("Renewable share", "Μερίδιο ανανεώσιμων")}</span>
              <strong className="vck-num">{d.grid.renewableShare.toFixed(1)}%</strong>
            </div>
          )}
          <div>
            <span>{L("Hours received today", "Ώρες που λήφθηκαν σήμερα")}</span>
            <strong className="vck-num">{d.grid.hours}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ConsolePage
      title={t("title")}
      purpose={L("Every figure in the workspace comes from one of these sources.", "Κάθε αριθμός στην πλατφόρμα προέρχεται από μία από αυτές τις πηγές.")}
      loading={res.loading}
      error={res.error}
      onRetry={res.reload}
    >
      <ReadingRail>
        <Reading label={L("Live feeds", "Ενεργές ροές")} value={liveCount} note={L("no account needed", "χωρίς σύνδεση λογαριασμού")} />
        <Reading
          label={L("Linked accounts", "Συνδεδεμένοι λογαριασμοί")}
          value={`${linkedCount} / ${linkableCount}`}
          note={L("accounts you can link", "λογαριασμοί προς σύνδεση")}
        />
        <Reading label={L("Planned", "Προγραμματισμένες")} value={scheduledCount} note={L("no controls until they work", "χωρίς κουμπιά μέχρι να λειτουργούν")} />
        <Reading label={L("Sources in use", "Πηγές σε χρήση")} value={`${coverage}%`} note={<Bar pct={coverage} />} />
      </ReadingRail>

      {CATEGORY_ORDER.map((cat) => {
        const items = CONNECTORS.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        return (
          <Plate key={cat} label={CATEGORY_LABEL[cat][locale]} meta={`${items.length}`}>
            <p className="vci-group-note">{CATEGORY_NOTE[cat][locale]}</p>
            <div className="vci-grid">
              {items.map((c) => (
                <ConnectorTile key={c.id} connector={c} locale={locale} status={statusFor(c)} action={actionFor(c)} detail={detailFor(c)} />
              ))}
            </div>
          </Plate>
        );
      })}

      <SaltEdgeModal
        open={saltEdgeModalOpen}
        onOpenChange={setSaltEdgeModalOpen}
        locale={locale}
        configured={Boolean(saltedge?.configured)}
        environment={saltedge?.environment ?? null}
      />
      <NangoModal
        open={nangoModalOpen}
        onOpenChange={setNangoModalOpen}
        locale={locale}
        configured={Boolean(nango?.configured)}
      />
    </ConsolePage>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <ConsolePage title="Integrations" loading>
          <div />
        </ConsolePage>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
