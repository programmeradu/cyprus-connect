"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";


interface AccountingIntegrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type IntegrationType = "quickbooks" | "xero" | null;

export function AccountingIntegrationDialog({
  isOpen,
  onClose,
}: AccountingIntegrationDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType>(null);

  const handleConnect = async (type: "quickbooks" | "xero") => {
    setIsConnecting(true);
    setSelectedIntegration(type);

    try {
      // In a real implementation, this would open OAuth flow
      // For now, we'll simulate the connection
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success(`${type === "quickbooks" ? "QuickBooks" : "Xero"} connection initiated!`);
      toast.info("Please complete the authorization in the popup window.");
      
      // Simulate opening OAuth window
      // In production: window.location.href = `/api/auth/${type}?action=authorize`;
      
      setIsConnecting(false);
      setSelectedIntegration(null);
      onClose();
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to initiate connection. Please try again.");
      setIsConnecting(false);
      setSelectedIntegration(null);
    }
  };

  const integrations = [
    {
      id: "quickbooks" as const,
      name: "QuickBooks Online",
      description: "Connect your QuickBooks account for automated expense tracking",
      logo: "💼",
      features: [
        "Auto-sync invoices and bills",
        "Track business expenses",
        "Generate financial reports",
        "Real-time data updates",
      ],
      comingSoon: true,
    },
    {
      id: "xero" as const,
      name: "Xero",
      description: "Integrate with Xero for seamless accounting data import",
      logo: "📊",
      features: [
        "Import bank transactions",
        "Sync expense categories",
        "Access financial statements",
        "Automated reconciliation",
      ],
      comingSoon: true,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl z-50"
          >
            <div className="glass-strong rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Connect Accounting Software</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically import your expense and accounting data
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={isConnecting}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Integration Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="p-5 rounded-xl bg-background border border-border hover:border-primary/50 transition-all relative overflow-hidden"
                  >
                    {/* Coming Soon Badge */}
                    {integration.comingSoon && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-[9px] font-semibold rounded-full bg-primary/10 text-primary">
                          COMING SOON
                        </span>
                      </div>
                    )}

                    {/* Logo */}
                    <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center mb-4 text-2xl">
                      {integration.logo}
                    </div>

                    {/* Name & Description */}
                    <h3 className="text-base font-bold mb-2">{integration.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {integration.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-4">
                      {integration.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Connect Button */}
                    <button
                      onClick={() => handleConnect(integration.id)}
                      disabled={isConnecting || integration.comingSoon}
                      className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isConnecting && selectedIntegration === integration.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : integration.comingSoon ? (
                        "Coming Soon"
                      ) : (
                        <>
                          Connect {integration.name}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Info Banner */}
              <div className="mt-6 p-4 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">
                      Secure OAuth 2.0 Authentication
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      We use industry-standard OAuth 2.0 to securely connect to your accounting
                      software. Your credentials are never stored on our servers. You can revoke
                      access at any time from your accounting software settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
