"use client";

import { useEffect, useState } from "react";
import { Btn } from "@/components/app/console/kit";
import { useWorkspaceAction } from "@/components/app/console/workspace-store";
import { CYPRUS_BANKS } from "@/lib/bank/saltedge";
import { ConnectDialog, ConnectTerms, DualMark } from "./ConnectDialog";
import { toast } from "sonner";

interface SaltEdgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "en" | "el";
  /** Salt Edge keys are present on the server. */
  configured: boolean;
  environment: "sandbox" | "production" | null;
}

export function SaltEdgeModal({ open, onOpenChange, locale, configured, environment }: SaltEdgeModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const action = useWorkspaceAction();
  const L = (en: string, el: string) => (locale === "el" ? el : en);

  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  const bank = CYPRUS_BANKS.find((b) => b.code === selected) ?? null;
  const bankName = bank ? (locale === "el" ? bank.name.el : bank.name.en) : "";

  const handleConnect = async () => {
    if (!bank) return;
    const res = await action.run<{ connectUrl?: string }>("/api/console/integrations/saltedge/connect", {
      method: "POST",
      body: { bankCode: bank.code },
      invalidates: ["/api/console/integrations"],
    });
    if (res?.connectUrl) {
      window.location.href = res.connectUrl;
    } else {
      toast.error(L("Vuneli could not open the bank page. Try again in a minute.", "Το Vuneli δεν μπόρεσε να ανοίξει τη σελίδα της τράπεζας. Δοκιμάστε ξανά σε ένα λεπτό."));
    }
  };

  const cta = action.busy
    ? L(`Opening ${bankName}…`, `Άνοιγμα ${bankName}…`)
    : bank
      ? L(`Continue to ${bankName}`, `Συνέχεια στην ${bankName}`)
      : L("Choose your bank", "Επιλέξτε τράπεζα");

  return (
    <ConnectDialog
      open={open}
      onOpenChange={onOpenChange}
      locale={locale}
      title={L("Link a Cyprus bank account", "Σύνδεση κυπριακού τραπεζικού λογαριασμού")}
      description={L(
        "Choose your bank. You approve access on the bank's own page, then Vuneli reads your business payments to find fuel, electricity, water and freight spending.",
        "Επιλέξτε την τράπεζά σας. Εγκρίνετε την πρόσβαση στη σελίδα της τράπεζας και το Vuneli διαβάζει τις επαγγελματικές πληρωμές για να βρει έξοδα καυσίμων, ρεύματος, νερού και μεταφορών.",
      )}
      provider={{ name: "Salt Edge", light: "/integrations/saltedge-light.svg", dark: "/integrations/saltedge-dark.svg", height: 24 }}
      footer={
        <>
          <p className="vcm-foot-note" role={configured ? undefined : "status"}>
            {!configured
              ? L("Bank linking opens once the workspace owner adds the Salt Edge keys.", "Η σύνδεση τράπεζας ανοίγει μόλις ο κάτοχος του χώρου εργασίας προσθέσει τα κλειδιά Salt Edge.")
              : environment === "sandbox"
                ? L("Test mode: Salt Edge shows practice banks, not real accounts.", "Δοκιμαστική λειτουργία: το Salt Edge δείχνει δοκιμαστικές τράπεζες, όχι πραγματικούς λογαριασμούς.")
                : L("You leave Vuneli for a moment and come back here when the bank is done.", "Φεύγετε για λίγο από το Vuneli και επιστρέφετε εδώ μόλις τελειώσει η τράπεζα.")}
          </p>
          <div className="vcm-foot-actions">
            <Btn variant="quiet" onClick={() => onOpenChange(false)}>
              {L("Cancel", "Ακύρωση")}
            </Btn>
            <Btn variant="primary" onClick={handleConnect} disabled={!configured || !bank || action.busy} aria-busy={action.busy || undefined}>
              {cta}
            </Btn>
          </div>
        </>
      }
    >
      <fieldset className="vcm-group">
        <legend className="vcm-label">{L("Your bank", "Η τράπεζά σας")}</legend>
        <div className="vcm-list">
          {CYPRUS_BANKS.map((b) => (
            <label key={b.code} className="vcm-option vcm-option-row">
              <input
                type="radio"
                name="saltedge-bank"
                value={b.code}
                checked={selected === b.code}
                onChange={() => setSelected(b.code)}
                className="vcm-sr"
              />
              <img className="vcm-app-icon" src={b.icon} alt="" aria-hidden="true" />
              <span className="vcm-option-text">
                <span className="vcm-option-name">{locale === "el" ? b.name.el : b.name.en}</span>
                <span className="vcm-option-sub">{locale === "el" ? b.system.el : b.system.en}</span>
              </span>
              <span className="vcm-radio" aria-hidden="true" />
            </label>
          ))}
        </div>
        <p className="vcm-aside">
          <span className="vcm-aside-mark" aria-hidden="true">
            <DualMark light="/integrations/bankofcyprus-light.png" dark="/integrations/bankofcyprus-dark.png" alt="" height={16} />
          </span>
          <span>
            {L(
              "Bank of Cyprus has its own direct link on the Integrations page, so it is not listed here.",
              "Η Τράπεζα Κύπρου έχει δική της απευθείας σύνδεση στη σελίδα Συνδέσεων, γι' αυτό δεν εμφανίζεται εδώ.",
            )}
          </span>
        </p>
      </fieldset>

      <ConnectTerms
        label={L("What this link allows", "Τι επιτρέπει η σύνδεση")}
        rows={[
          [L("Vuneli reads", "Το Vuneli διαβάζει"), L("Account names, balances and the last 90 days of payments.", "Ονόματα λογαριασμών, υπόλοιπα και πληρωμές των τελευταίων 90 ημερών.")],
          [L("Vuneli cannot", "Το Vuneli δεν μπορεί"), L("Move money or make payments. Access is read-only.", "Να μεταφέρει χρήματα ή να κάνει πληρωμές. Η πρόσβαση είναι μόνο για ανάγνωση.")],
          [L("Your passcode", "Ο κωδικός σας"), L("You type it on your bank's page. Vuneli never sees it.", "Τον πληκτρολογείτε στη σελίδα της τράπεζας. Το Vuneli δεν τον βλέπει ποτέ.")],
          [L("To stop", "Για διακοπή"), L("Unlink here at any time, or withdraw consent in your bank app.", "Αποσυνδέστε εδώ οποιαδήποτε στιγμή ή ανακαλέστε τη συγκατάθεση στην εφαρμογή της τράπεζας.")],
        ]}
      />
    </ConnectDialog>
  );
}
