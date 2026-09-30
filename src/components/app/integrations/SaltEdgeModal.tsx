"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Btn } from "@/components/app/console/kit";
import { useWorkspaceAction } from "@/components/app/console/workspace-store";
import { CYPRUS_BANKS, type CyprusBankInstitution } from "@/lib/bank/saltedge";
import { ShieldCheck, Landmark, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface SaltEdgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "en" | "el";
}

export function SaltEdgeModal({ open, onOpenChange, locale }: SaltEdgeModalProps) {
  const [selectedBank, setSelectedBank] = useState<string>("hellenic_bank_cy");
  const action = useWorkspaceAction();

  const isEl = locale === "el";

  const handleConnect = async () => {
    const res = await action.run<{ connectUrl?: string }>(
      "/api/console/integrations/saltedge/connect",
      {
        method: "POST",
        body: { bankCode: selectedBank },
        invalidates: ["/api/console/integrations"],
      },
    );

    if (res?.connectUrl) {
      toast.info(
        isEl
          ? "Μετάβαση στην πύλη της τράπεζας για έγκριση..."
          : "Redirecting to bank authorization portal...",
      );
      window.location.href = res.connectUrl;
    } else {
      toast.error(
        isEl
          ? "Αδυναμία έναρξης σύνδεσης. Ελέγξτε τις ρυθμίσεις."
          : "Unable to initiate connection. Please check configuration.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
        {/* Header Ribbon */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/30 bg-muted/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                {isEl ? "Σύνδεση Κυπριακής Τράπεζας (Salt Edge)" : "Link Cyprus Bank (Salt Edge AISP)"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEl
                  ? "Ασφαλής ανάγνωση κινήσεων υπό την ευρωπαϊκή οδηγία PSD2."
                  : "Regulated read-only account feeds under European PSD2 compliance."}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              {isEl
                ? "Μόνο ανάγνωση: καμία πρόσβαση σε κωδικούς, καμία δυνατότητα μεταφοράς χρημάτων."
                : "Read-only guarantee: zero payment power, zero credential storage, 90-day sync."}
            </span>
          </div>
        </div>

        {/* Bank Selection List */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            {isEl ? "Επιλέξτε Τραπεζικό Ίδρυμα" : "Select Financial Institution"}
          </div>

          <div className="grid gap-2">
            {CYPRUS_BANKS.map((b: CyprusBankInstitution) => {
              const active = selectedBank === b.code;
              return (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => setSelectedBank(b.code)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/40 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {active && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {isEl ? b.name.el : b.name.en}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        BIC: {b.bic} {b.popular && (isEl ? "· Δημοφιλές" : "· Popular")}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">PSD2 AISP</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/30 bg-muted/10 flex items-center justify-between">
          <Btn variant="quiet" onClick={() => onOpenChange(false)}>
            {isEl ? "Ακύρωση" : "Cancel"}
          </Btn>
          <Btn
            variant="primary"
            onClick={handleConnect}
            disabled={action.busy}
            className="flex items-center gap-1.5"
          >
            <span>
              {action.busy
                ? isEl
                  ? "Έναρξη..."
                  : "Connecting..."
                : isEl
                  ? "Συνέχεια στην Τράπεζα"
                  : "Continue to Bank Portal"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
