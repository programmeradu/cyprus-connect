"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { PageShell, PageHeader, Section, EmptyState } from "@/components/app/shell";

const COPY = {
  en: {
    title: "Privacy & data",
    subtitle:
      "Manage your personal data under the EU General Data Protection Regulation (GDPR) and the Cyprus Data Protection Law.",
    exportTitle: "Export your data",
    exportBody:
      "Download a JSON file containing your Vuneli profile and preferences. Corresponds to your GDPR right of access (Art. 15) and portability (Art. 20).",
    exportCta: "Download my data",
    exporting: "Preparing export…",
    exportOk: "Export downloaded",
    exportErr: "Could not export data",
    deleteTitle: "Delete your account",
    deleteBody:
      "This permanently deletes your account and associated records. Invoices are retained for 7 years to meet Cyprus tax law; encrypted backups are pruned within 12 months. This action cannot be undone.",
    deleteCta: "Delete my account",
    deleting: "Deleting…",
    confirmTitle: "Type DELETE to confirm",
    confirmPlaceholder: "DELETE",
    cancel: "Cancel",
    confirm: "Permanently delete",
    deleteOk: "Account deleted",
    deleteErr: "Could not delete account",
    signInRequired: "Please sign in to manage your data.",
    signIn: "Sign in",
    docs: "See our Privacy Policy for details on retention and your rights.",
    privacyLink: "Privacy Policy",
    back: "Back to settings"
  },
  el: {
    title: "Απόρρητο & δεδομένα",
    subtitle:
      "Διαχειριστείτε τα προσωπικά σας δεδομένα βάσει του GDPR και του Κυπριακού Νόμου Προστασίας Δεδομένων.",
    exportTitle: "Εξαγωγή δεδομένων",
    exportBody:
      "Κατεβάστε ένα αρχείο JSON με το προφίλ και τις προτιμήσεις σας στο Vuneli. Αντιστοιχεί στο δικαίωμα πρόσβασης (Άρ. 15) και φορητότητας (Άρ. 20) του GDPR.",
    exportCta: "Λήψη των δεδομένων μου",
    exporting: "Προετοιμασία εξαγωγής…",
    exportOk: "Η εξαγωγή κατέβηκε",
    exportErr: "Αποτυχία εξαγωγής",
    deleteTitle: "Διαγραφή λογαριασμού",
    deleteBody:
      "Διαγράφει οριστικά τον λογαριασμό και τα σχετικά αρχεία. Τα τιμολόγια διατηρούνται 7 έτη για φορολογικούς λόγους· τα κρυπτογραφημένα αντίγραφα εκκαθαρίζονται εντός 12 μηνών. Η ενέργεια είναι μη αναστρέψιμη.",
    deleteCta: "Διαγραφή λογαριασμού",
    deleting: "Διαγραφή…",
    confirmTitle: "Πληκτρολογήστε DELETE για επιβεβαίωση",
    confirmPlaceholder: "DELETE",
    cancel: "Ακύρωση",
    confirm: "Οριστική διαγραφή",
    deleteOk: "Ο λογαριασμός διαγράφηκε",
    deleteErr: "Αποτυχία διαγραφής",
    signInRequired: "Συνδεθείτε για να διαχειριστείτε τα δεδομένα σας.",
    signIn: "Σύνδεση",
    docs: "Δείτε την Πολιτική Απορρήτου για λεπτομέρειες.",
    privacyLink: "Πολιτική Απορρήτου",
    back: "Πίσω στις ρυθμίσεις"
  }
} as const;

const inputClass =
  "w-full max-w-xs h-11 px-3 rounded-[0.375rem] border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40";

export default function PrivacySettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;

  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const header = (
    <PageHeader
      title={t.title}
      purpose={t.subtitle}
      breadcrumb={[{ label: "Settings", href: "/app/settings" }, { label: t.title }]}
    />
  );

  if (isPending) {
    return (
      <PageShell loading header={header}>
        <div />
      </PageShell>
    );
  }

  if (!session?.user?.id) {
    return (
      <PageShell header={header}>
        <EmptyState
          title={t.signInRequired}
          action={{ label: t.signIn, href: "/auth" }}
        />
      </PageShell>
    );
  }

  const userId = session.user.id;

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/users/${userId}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vuneli-data-export-${userId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t.exportOk);
    } catch (e) {
      toast.error(t.exportErr);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(String(res.status));
      await authClient.signOut().catch(() => {});
      try {
        localStorage.removeItem("bearer_token");
      } catch {}
      toast.success(t.deleteOk);
      router.push("/");
    } catch (e) {
      toast.error(t.deleteErr);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageShell header={header}>
      <Section title={t.exportTitle} description={t.exportBody}>
        <div className="app-card p-4">
          <button className="app-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? t.exporting : t.exportCta}
          </button>
        </div>
      </Section>

      <Section title={t.deleteTitle} description={t.deleteBody}>
        <div className="app-card p-4 border-[var(--destructive)]">
          {!confirming ? (
            <button
              className="app-btn-ghost app-btn border-[var(--destructive)] text-[var(--destructive)]"
              onClick={() => setConfirming(true)}
            >
              {t.deleteCta}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="app-label block mb-1.5">{t.confirmTitle}</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t.confirmPlaceholder}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="app-btn-ghost app-btn"
                  onClick={() => {
                    setConfirming(false);
                    setConfirmText("");
                  }}
                  disabled={deleting}
                >
                  {t.cancel}
                </button>
                <button
                  className="app-btn"
                  style={{ background: "var(--destructive)" }}
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                >
                  {deleting ? t.deleting : t.confirm}
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <p className="app-meta">
        {t.docs}{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          {t.privacyLink}
        </Link>
        .
      </p>
    </PageShell>
  );
}
