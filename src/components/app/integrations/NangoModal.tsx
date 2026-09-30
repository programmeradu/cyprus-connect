"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Btn } from "@/components/app/console/kit";
import { useWorkspaceAction } from "@/components/app/console/workspace-store";
import { ERP_SYSTEMS } from "@/lib/integrations/erp-catalog";
import { ConnectDialog, ConnectTerms, DualMark } from "./ConnectDialog";
import { toast } from "sonner";

interface NangoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "en" | "el";
  /** Nango key is present on the server. */
  configured: boolean;
}

const fold = (s: string) => s.toLocaleLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export function NangoModal({ open, onOpenChange, locale, configured }: NangoModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const action = useWorkspaceAction();
  const searchId = useId();
  const labelId = useId();
  const L = (en: string, el: string) => (locale === "el" ? el : en);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQuery("");
    }
  }, [open]);

  const q = fold(query.trim());
  const shown = useMemo(
    () => (q ? ERP_SYSTEMS.filter((s) => fold(`${s.name} ${s.fit.en} ${s.fit.el}`).includes(q)) : ERP_SYSTEMS),
    [q],
  );
  const system = ERP_SYSTEMS.find((s) => s.id === selected) ?? null;

  const handleConnect = async () => {
    if (!system) return;
    const res = await action.run<{ connectUrl?: string }>("/api/console/integrations/nango/connect", {
      method: "POST",
      body: { integrationId: system.id },
      invalidates: ["/api/console/integrations"],
    });
    if (res?.connectUrl) {
      window.location.href = res.connectUrl;
    } else {
      toast.error(L(`Vuneli could not open the ${system.name} sign-in. Try again in a minute.`, `Το Vuneli δεν μπόρεσε να ανοίξει τη σύνδεση ${system.name}. Δοκιμάστε ξανά σε ένα λεπτό.`));
    }
  };

  const cta = action.busy
    ? L(`Opening ${system?.name ?? ""}…`, `Άνοιγμα ${system?.name ?? ""}…`)
    : system
      ? L(`Continue to ${system.name}`, `Συνέχεια στο ${system.name}`)
      : L("Choose your system", "Επιλέξτε σύστημα");

  return (
    <ConnectDialog
      open={open}
      onOpenChange={onOpenChange}
      locale={locale}
      title={L("Connect your accounting system", "Σύνδεση λογιστικού συστήματος")}
      description={L(
        "Pick the system your books live in. You sign in there, then Vuneli reads supplier bills and ledger accounts to work out spend-based supply-chain (Scope 3) emissions.",
        "Επιλέξτε το σύστημα όπου τηρούνται τα βιβλία σας. Συνδέεστε εκεί και το Vuneli διαβάζει τιμολόγια προμηθευτών και λογαριασμούς καθολικού για να υπολογίσει τις εκπομπές της εφοδιαστικής αλυσίδας (Scope 3).",
      )}
      provider={{ name: "Nango", light: "/integrations/nango-light.svg", dark: "/integrations/nango-dark.svg", height: 18 }}
      footer={
        <>
          <p className="vcm-foot-note" role={configured ? undefined : "status"}>
            {configured
              ? L("You leave Vuneli for a moment and come back here after signing in.", "Φεύγετε για λίγο από το Vuneli και επιστρέφετε εδώ μετά τη σύνδεση.")
              : L("Accounting links open once the workspace owner adds the Nango key.", "Οι λογιστικές συνδέσεις ανοίγουν μόλις ο κάτοχος του χώρου εργασίας προσθέσει το κλειδί Nango.")}
          </p>
          <div className="vcm-foot-actions">
            <Btn variant="quiet" onClick={() => onOpenChange(false)}>
              {L("Cancel", "Ακύρωση")}
            </Btn>
            <Btn variant="primary" onClick={handleConnect} disabled={!configured || !system || action.busy} aria-busy={action.busy || undefined}>
              {cta}
            </Btn>
          </div>
        </>
      }
    >
      <section className="vcm-group">
        <div className="vcm-group-head">
          <h3 className="vcm-label" id={labelId}>{L("Your system", "Το σύστημά σας")}</h3>
          <div className="vcm-search">
            <Search aria-hidden="true" strokeWidth={1.75} />
            <label htmlFor={searchId} className="vcm-sr">
              {L("Find your system", "Βρείτε το σύστημά σας")}
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={L("Find your system", "Βρείτε το σύστημά σας")}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {shown.length > 0 ? (
          <div className="vcm-grid" role="radiogroup" aria-labelledby={labelId}>
            {shown.map((s) => (
              <label key={s.id} className="vcm-option vcm-option-card">
                <input
                  type="radio"
                  name="nango-system"
                  value={s.id}
                  checked={selected === s.id}
                  onChange={() => setSelected(s.id)}
                  className="vcm-sr"
                />
                <span className="vcm-card-mark">
                  <DualMark light={s.light} dark={s.dark} alt="" height={s.markHeight} />
                </span>
                <span className="vcm-card-foot">
                  <span className="vcm-option-text">
                    <span className="vcm-option-name">{s.name}</span>
                    <span className="vcm-option-sub">{locale === "el" ? s.fit.el : s.fit.en}</span>
                  </span>
                  <span className="vcm-radio" aria-hidden="true" />
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="vcm-empty" role="status">
            <p>{L(`No system in the list matches “${query.trim()}”.`, `Κανένα σύστημα δεν ταιριάζει με «${query.trim()}».`)}</p>
            <Btn variant="text" onClick={() => setQuery("")}>
              {L("Show all systems", "Εμφάνιση όλων")}
            </Btn>
          </div>
        )}

        {selected && !shown.some((s) => s.id === selected) && system && (
          <p className="vcm-aside">{L(`${system.name} stays selected.`, `Το ${system.name} παραμένει επιλεγμένο.`)}</p>
        )}

        <p className="vcm-aside">
          <img className="vcm-app-icon vcm-app-icon-sm vcm-app-icon-flat" src="/integrations/erp/quickbooks-brand.svg" alt="" aria-hidden="true" />
          <span>
            {L(
              "QuickBooks has its own direct link on the Integrations page, so it is not listed here.",
              "Το QuickBooks έχει δική του απευθείας σύνδεση στη σελίδα Συνδέσεων, γι' αυτό δεν εμφανίζεται εδώ.",
            )}
          </span>
        </p>
      </section>

      <ConnectTerms
        label={L("What this link allows", "Τι επιτρέπει η σύνδεση")}
        rows={[
          [L("Vuneli reads", "Το Vuneli διαβάζει"), L("Supplier bills, bill lines and your chart of accounts.", "Τιμολόγια προμηθευτών, γραμμές τιμολογίων και το λογιστικό σχέδιο.")],
          [L("Vuneli never", "Το Vuneli ποτέ"), L("Posts, edits or deletes entries in your books.", "Δεν καταχωρεί, αλλάζει ή διαγράφει εγγραφές στα βιβλία σας.")],
          [L("Your password", "Ο κωδικός σας"), L(`You sign in at ${system?.name ?? "your system"}. Vuneli never sees it.`, `Συνδέεστε στο ${system?.name ?? "σύστημά σας"}. Το Vuneli δεν τον βλέπει ποτέ.`)],
          [L("To stop", "Για διακοπή"), L("Disconnect here at any time.", "Αποσυνδέστε εδώ οποιαδήποτε στιγμή.")],
        ]}
      />
    </ConnectDialog>
  );
}
