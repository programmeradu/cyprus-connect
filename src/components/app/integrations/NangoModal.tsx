"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Btn } from "@/components/app/console/kit";
import { useWorkspaceAction } from "@/components/app/console/workspace-store";
import { Database, Check, ArrowRight, Layers } from "lucide-react";
import { toast } from "sonner";

interface NangoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "en" | "el";
}

interface ErpOption {
  id: string;
  name: string;
  category: string;
  popular?: boolean;
}

const ERP_OPTIONS: ErpOption[] = [
  { id: "sage-intacct", name: "Sage (Intacct / 50 / Business Cloud)", category: "Enterprise ERP", popular: true },
  { id: "sap-business-one", name: "SAP (Business One / S/4HANA)", category: "Enterprise ERP", popular: true },
  { id: "netsuite", name: "Oracle NetSuite", category: "Cloud ERP", popular: true },
  { id: "xero", name: "Xero Accounting", category: "SME Cloud", popular: true },
  { id: "quickbooks", name: "Intuit QuickBooks Online", category: "SME Cloud" },
  { id: "zoho-books", name: "Zoho Books", category: "Cloud Accounting" },
  { id: "freshbooks", name: "FreshBooks", category: "Invoicing & Spend" },
  { id: "microsoft-dynamics-365", name: "Microsoft Dynamics 365", category: "Enterprise ERP" },
];

export function NangoModal({ open, onOpenChange, locale }: NangoModalProps) {
  const [selectedErp, setSelectedErp] = useState<string>("sage-intacct");
  const [search, setSearch] = useState<string>("");
  const action = useWorkspaceAction();

  const isEl = locale === "el";

  const filtered = ERP_OPTIONS.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = async () => {
    const res = await action.run<{ connectUrl?: string }>(
      "/api/console/integrations/nango/connect",
      {
        method: "POST",
        body: { integrationId: selectedErp },
        invalidates: ["/api/console/integrations"],
      },
    );

    if (res?.connectUrl) {
      toast.info(
        isEl
          ? "Μετάβαση στην ασφαλή πύλη Nango Connect..."
          : "Opening secure Nango Connect dialog...",
      );
      window.location.href = res.connectUrl;
    } else {
      toast.error(
        isEl
          ? "Αδυναμία έναρξης σύνδεσης ERP. Ελέγξτε τις ρυθμίσεις."
          : "Unable to initiate ERP connection. Please check configuration.",
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
              <Database className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                {isEl ? "Σύνδεση ERP & Λογιστικού Συστήματος (Nango)" : "Link Unified ERP & Accounting (Nango)"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEl
                  ? "Αυτόματος συγχρονισμός τιμολογίων, παραστατικών και αναλυτικού καθολικού."
                  : "Automated two-way sync for bills, purchase ledger, and general ledger accounts."}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs">
            <Layers className="h-4 w-4 shrink-0" />
            <span>
              {isEl
                ? "Υποστηρίζει 150+ συστήματα: Sage, SAP, NetSuite, Zoho, Dynamics 365 και Xero."
                : "150+ native connectors with automated Scope 3 supplier carbon mapping."}
            </span>
          </div>
        </div>

        {/* Search & Selector */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              {isEl ? "Επιλέξτε Σύστημα" : "Select Platform"}
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEl ? "Αναζήτηση ERP..." : "Filter ERP..."}
              className="px-2.5 py-1 text-xs rounded-lg border border-border/40 bg-background/60 focus:outline-none focus:border-primary w-40"
            />
          </div>

          <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
            {filtered.map((e) => {
              const active = selectedErp === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedErp(e.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
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
                      <div className="text-sm font-medium text-foreground">{e.name}</div>
                      <div className="text-[11px] text-muted-foreground">{e.category}</div>
                    </div>
                  </div>
                  {e.popular && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {isEl ? "Δημοφιλές" : "Popular"}
                    </span>
                  )}
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
                  ? "Σύνδεση..."
                  : "Connecting..."
                : isEl
                  ? "Έναρξη Σύνδεσης"
                  : "Connect with Nango"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
