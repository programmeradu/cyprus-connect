"use client";

/**
 * Integrations: every source a figure in the workspace can come from, with
 * its real state. Live feeds show their latest measured reading; account
 * links show whether they are set up and made. One view, no guessed numbers.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ConsolePage, Plate, Reading, ReadingRail, Btn, Bar } from "@/components/app/console/kit";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { ConnectorTile } from "@/components/app/integrations/ConnectorTile";
import { SaltEdgeModal } from "@/components/app/integrations/SaltEdgeModal";
import { NangoModal } from "@/components/app/integrations/NangoModal";
import {
  CONNECTORS,
  CATEGORY_LABEL,
  CATEGORY_NOTE,
  CATEGORY_ORDER,
  type Connector,
} from "@/components/app/integrations/catalog";
import type { IntegrationsData } from "@/app/api/console/integrations/route";

const PATH = "/api/console/integrations";
const QB_TOKENS = "/api/oauth/quickbooks/tokens";

function IntegrationsContent() {
  const t = useTranslations("dashboard.integrations");
  const locale = (useLocale() === "el" ? "el" : "en") as "en" | "el";
  const loc = locale === "el" ? "el-CY" : "en-GB";
  const L = (en: string, el: string) => (locale === "el" ? el : en);
  const router = useRouter();
  const searchParams = useSearchParams();
  const res = useWorkspaceResource<IntegrationsData>(PATH);
  const qbAction = useWorkspaceAction();
  const bankAction = useWorkspaceAction();
  const saltEdgeAction = useWorkspaceAction();
  const nangoAction = useWorkspaceAction();
  const [saltEdgeModalOpen, setSaltEdgeModalOpen] = useState(false);
  const [nangoModalOpen, setNangoModalOpen] = useState(false);
  const d = res.data;

  const time = useMemo(() => new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }), [loc]);
  const date = useMemo(() => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }), [loc]);

  // Result of the QuickBooks sign-in round trip.
  useEffect(() => {
    const ok = searchParams.get("qb_success");
    const err = searchParams.get("qb_error");
    if (!ok && !err) return;
    if (ok === "true") {
      toast.success(t("toasts.qbConnected"));
      res.reload();
    } else if (err) {
      const known = ["missing_parameters", "invalid_state", "missing_user", "token_exchange_failed", "storage_failed", "callback_failed"];
      toast.error(known.includes(err) ? t(`toasts.qbErrors.${err}` as never) : t("toasts.qbErrors.default"));
    }
    router.replace("/app/integrations");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    if (qbAction.error) toast.error(qbAction.error);
  }, [qbAction.error]);
  useEffect(() => {
    if (bankAction.error) toast.error(bankAction.error);
  }, [bankAction.error]);
  useEffect(() => {
    if (saltEdgeAction.error) toast.error(saltEdgeAction.error);
  }, [saltEdgeAction.error]);
  useEffect(() => {
    if (nangoAction.error) toast.error(nangoAction.error);
  }, [nangoAction.error]);

  const connectQb = async () => {
    const r = await qbAction.run<{ authUrl?: string }>("/api/oauth/quickbooks/authorize", { method: "GET", invalidates: [] });
    if (r?.authUrl) window.location.href = r.authUrl;
  };
  const disconnectQb = async () => {
    const r = await qbAction.run(QB_TOKENS, { method: "DELETE", invalidates: [PATH] });
    if (r) toast.success(t("toasts.qbDisconnected"));
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
        "Unlink Cyprus bank connection? Vuneli will stop reading statements from this account.",
        "Αποσύνδεση κυπριακής τράπεζας; Η Vuneli θα σταματήσει την ανάγνωση κινήσεων από αυτόν τον λογαριασμό.",
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
        "Disconnect unified ERP integration? Synced invoices and ledger lines will remain for historical audit.",
        "Αποσύνδεση ενοποιημένου ERP; Τα τιμολόγια και οι γραμμές καθολικού θα διατηρηθούν για ιστορικό έλεγχο.",
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
  const eur = useMemo(() => new Intl.NumberFormat(loc, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }), [loc]);
  const CAT: Record<string, [string, string]> = {
    electricity: ["Electricity", "Ρεύμα"],
    fuel: ["Fuel", "Καύσιμα"],
    water: ["Water", "Νερό"],
    freight: ["Freight and courier", "Μεταφορές"],
    other: ["Other", "Άλλο"],
  };
  const qb = d?.quickbooks;
  const liveCount = CONNECTORS.filter((c) => c.state === "live").length;
  const linkableCount = CONNECTORS.filter((c) => c.state === "oauth").length;
  const linkedCount =
    (qb?.connected ? 1 : 0) +
    (bank?.status === "active" ? 1 : 0) +
    (saltedge?.status === "active" ? 1 : 0) +
    (nango?.connected ? 1 : 0);
  const scheduledCount = CONNECTORS.filter((c) => c.state === "scheduled").length;
  const inUse = liveCount + linkedCount;
  const coverage = Math.round((inUse / CONNECTORS.length) * 100);

  const statusFor = (c: Connector) => {
    if (c.id === "quickbooks" && qb) {
      if (qb.connected) return qb.expired ? { word: L("Link expired", "Η σύνδεση έληξε"), tone: "bad" as const } : { word: t("quickbooks.connected"), tone: "good" as const };
      if (!qb.configured) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
    }
    if (c.id === "bankofcyprus" && bank) {
      if (!bank.configured) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
      if (bank.status === "active") return bank.failed ? { word: L("Last read failed", "Η τελευταία ανάγνωση απέτυχε"), tone: "warn" as const } : { word: L("Linked", "Συνδεδεμένο"), tone: "good" as const };
      if (bank.status === "expired") return { word: L("Consent ended", "Η συγκατάθεση έληξε"), tone: "bad" as const };
    }
    if (c.id === "saltedge" && saltedge) {
      if (saltedge.status === "active") return { word: L("Linked", "Συνδεδεμένο"), tone: "good" as const };
      if (saltedge.status === "pending") return { word: L("Pending authorization", "Σε εκκρεμότητα"), tone: "warn" as const };
      if (!saltedge.configured) return { word: L("Ready (Sandbox)", "Έτοιμο (Δοκιμαστικό)"), tone: "warn" as const };
      return { word: L("Ready to link", "Έτοιμο για σύνδεση"), tone: "warn" as const };
    }
    if (c.id === "nango" && nango) {
      if (nango.connected) return { word: L("Connected", "Συνδεδεμένο"), tone: "good" as const };
      if (!nango.configured) return { word: L("Ready (Sandbox)", "Έτοιμο (Δοκιμαστικό)"), tone: "warn" as const };
      return { word: L("Ready to link", "Έτοιμο για σύνδεση"), tone: "warn" as const };
    }
    if (c.id === "energy-charts" && d && !d.grid) return { word: L("No answer today", "Χωρίς απάντηση σήμερα"), tone: "warn" as const };
    return undefined;
  };

  const actionFor = (c: Connector) => {
    if (c.id === "quickbooks") {
      if (!qb || !qb.configured) return null;
      return qb.connected ? (
        <Btn onClick={disconnectQb} disabled={qbAction.busy}>
          {qbAction.busy ? t("quickbooks.disconnecting") : t("quickbooks.disconnect")}
        </Btn>
      ) : (
        <Btn variant="primary" onClick={connectQb} disabled={qbAction.busy}>
          {qbAction.busy ? t("quickbooks.connecting") : t("quickbooks.connect")}
        </Btn>
      );
    }
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
          {saltEdgeAction.busy ? L("Opening…", "Άνοιγμα…") : L("Link Cyprus Bank", "Σύνδεση Τράπεζας")}
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
          {nangoAction.busy ? L("Opening…", "Άνοιγμα…") : L("Link ERP & Accounting", "Σύνδεση ERP")}
        </Btn>
      );
    }
    if (c.id === "energy-charts" && d?.grid) {
      return <Link href="/app/insights" className="vck-btn vck-btn-quiet">{L("Open today's grid", "Το σημερινό δίκτυο")}</Link>;
    }
    return null;
  };

  const detailFor = (c: Connector) => {
    if (c.id === "quickbooks" && qb) {
      if (!qb.configured) {
        return <p className="vci-tile-note">{L("QuickBooks linking opens once the workspace owner adds the QuickBooks app keys. Until then, upload bills or enter figures.", "Η σύνδεση QuickBooks ανοίγει όταν ο ιδιοκτήτης προσθέσει τα κλειδιά της εφαρμογής. Μέχρι τότε, ανεβάστε λογαριασμούς ή καταχωρίστε αριθμούς.")}</p>;
      }
      if (!qb.connected) return null;
      return (
        <div className="vci-tile-detail">
          <div>
            <span>{t("quickbooks.environment")}</span>
            <strong className="capitalize">{qb.environment}</strong>
          </div>
          <div>
            <span>{t("quickbooks.lastSync")}</span>
            <strong className="vck-num">{qb.lastSyncedAt ? date.format(new Date(qb.lastSyncedAt)) : L("Not yet", "Όχι ακόμη")}</strong>
          </div>
          {qb.expired && <div>{t("quickbooks.tokenExpired")}</div>}
        </div>
      );
    }
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
              <strong>{se.banks.join(", ") || "Hellenic Bank"}</strong>
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
            "Regulated AISP aggregation for Hellenic Bank, Eurobank CY, Alpha Bank, AstroBank and Ancoria. Strictly read-only under PSD2.",
            "Εποπτευόμενη διασύνδεση AISP για Ελληνική Τράπεζα, Eurobank, Alpha Bank, AstroBank και Ancoria. Αποκλειστικά μόνο ανάγνωση βάσει PSD2.",
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
              <strong>{ng.providers.join(", ")}</strong>
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
            "Two-way sync with Sage, SAP, NetSuite, Xero, Zoho Books and 150+ ERPs. Automated general ledger and vendor bill carbon mapping.",
            "Αμφίδρομος συγχρονισμός με Sage, SAP, NetSuite, Xero, Zoho Books και 150+ ERPs. Αυτόματη αντιστοίχιση τιμολογίων προμηθευτών σε εκπομπές άνθρακα.",
          )}
        </p>
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
          note={qb && !qb.configured ? L("linking not set up yet", "η σύνδεση δεν έχει ρυθμιστεί") : L("accounts you can link", "λογαριασμοί προς σύνδεση")}
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
      />
      <NangoModal
        open={nangoModalOpen}
        onOpenChange={setNangoModalOpen}
        locale={locale}
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
