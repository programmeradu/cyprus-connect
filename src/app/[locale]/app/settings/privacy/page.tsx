"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";

const COPY = {
  en: {
    title: "Privacy & data",
    subtitle:
      "Manage your personal data under the EU General Data Protection Regulation (GDPR) and the Cyprus Data Protection Law.",
    exportTitle: "Export your data",
    exportBody:
      "Download a JSON file containing your VerdeIQ profile and preferences. Corresponds to your GDPR right of access (Art. 15) and portability (Art. 20).",
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
    back: "Back to settings",
  },
  el: {
    title: "Απόρρητο & δεδομένα",
    subtitle:
      "Διαχειριστείτε τα προσωπικά σας δεδομένα βάσει του GDPR και του Κυπριακού Νόμου Προστασίας Δεδομένων.",
    exportTitle: "Εξαγωγή δεδομένων",
    exportBody:
      "Κατεβάστε ένα αρχείο JSON με το προφίλ και τις προτιμήσεις σας στο VerdeIQ. Αντιστοιχεί στο δικαίωμα πρόσβασης (Άρ. 15) και φορητότητας (Άρ. 20) του GDPR.",
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
    back: "Πίσω στις ρυθμίσεις",
  },
} as const;

export default function PrivacySettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;

  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (isPending) {
    return <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">{t.signInRequired}</p>
        <Link href="/auth">
          <PremiumButton size="sm">{t.signIn}</PremiumButton>
        </Link>
      </div>
    );
  }

  const userId = session.user.id;

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/users/${userId}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `verdeiq-data-export-${userId}.json`;
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="mb-8">
        <Link
          href="/app/settings"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← {t.back}
        </Link>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-3">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{t.subtitle}</p>
      </div>

      <div className="space-y-4">
        <PremiumCard className="p-6">
          <h2 className="text-base font-semibold mb-2">{t.exportTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.exportBody}</p>
          <PremiumButton size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? t.exporting : t.exportCta}
          </PremiumButton>
        </PremiumCard>

        <PremiumCard className="p-6 border-destructive/40">
          <h2 className="text-base font-semibold mb-2 text-destructive">{t.deleteTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.deleteBody}</p>

          {!confirming ? (
            <PremiumButton
              variant="outline"
              size="sm"
              onClick={() => setConfirming(true)}
              className="border-destructive/60 text-destructive hover:bg-destructive/10"
            >
              {t.deleteCta}
            </PremiumButton>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                {t.confirmTitle}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t.confirmPlaceholder}
                className="w-full max-w-xs px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40"
                autoFocus
              />
              <div className="flex gap-2">
                <PremiumButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirming(false);
                    setConfirmText("");
                  }}
                  disabled={deleting}
                >
                  {t.cancel}
                </PremiumButton>
                <PremiumButton
                  size="sm"
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {deleting ? t.deleting : t.confirm}
                </PremiumButton>
              </div>
            </div>
          )}
        </PremiumCard>

        <p className="text-xs text-muted-foreground pt-2">
          {t.docs}{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            {t.privacyLink}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
