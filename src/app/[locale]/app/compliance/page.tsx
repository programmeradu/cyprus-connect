"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Custom thin SVG icons
const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <path d="M12 2 L20 6 L20 12 C20 16, 16 20, 12 22 C8 20, 4 16, 4 12 L4 6 Z" strokeWidth="1" strokeLinejoin="round" />
    <path d="M9 12 L11 14 L15 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <path d="M14 2 L6 2 C5 2, 4 3, 4 4 L4 20 C4 21, 5 22, 6 22 L18 22 C19 22, 20 21, 20 20 L20 8 Z" strokeWidth="1" strokeLinejoin="round" />
    <path d="M14 2 L14 8 L20 8" strokeWidth="1" strokeLinejoin="round" />
    <path d="M8 12 L16 12 M8 16 L14 16" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1" />
    <path d="M12 6 L12 12 L16 14" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1" />
    <path d="M2 12 L22 12 M12 2 C14 4, 15 8, 15 12 C15 16, 14 20, 12 22 M12 2 C10 4, 9 8, 9 12 C9 16, 10 20, 12 22" strokeWidth="1" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <path d="M12 2 L22 20 L2 20 Z" strokeWidth="1" strokeLinejoin="round" />
    <path d="M12 9 L12 13 M12 16 L12 16.5" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1" />
    <path d="M9 12 L11 14 L15 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="2" strokeWidth="1" />
    <path d="M12 2 L12 6 M12 18 L12 22 M22 12 L18 12 M6 12 L2 12 M18.36 5.64 L15.54 8.46 M8.46 15.54 L5.64 18.36 M18.36 18.36 L15.54 15.54 M8.46 8.46 L5.64 5.64" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <path d="M3 12 C3 7, 7 3, 12 3 C17 3, 21 7, 21 12 C21 17, 17 21, 12 21 C9 21, 6 19, 4.5 16.5" strokeWidth="1" />
    <path d="M3 12 L3 8 L7 8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7 L12 12 L15 15" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M12 2 L13 8 L12 14 L11 8 Z M2 12 L8 13 L14 12 L8 11 Z M6 6 L8 8 L10 10 M14 14 L16 16 L18 18 M6 18 L8 16 L10 14 M14 10 L16 8 L18 6" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M12 3 L12 15 M8 11 L12 15 L16 11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 16 L3 19 C3 20, 4 21, 5 21 L19 21 C20 21, 21 20, 21 19 L21 16" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Regulation {
  id: number;
  regulationId: string;
  name: string;
  jurisdiction: string;
  status: "compliant" | "action_required" | "upcoming";
  nextDeadline: string;
  description: string;
  requirements: string[];
}

interface Document {
  id: number;
  title: string;
  framework: string;
  status: "draft" | "ready" | "submitted";
  generatedAt: string;
  dueDate: string;
  content?: string;
}

interface AuditLog {
  id: number;
  action: string;
  details: string;
  createdBy: string;
  createdAt: string;
}

interface Settings {
  jurisdictions: string[];
  autoSubmit: boolean;
  emailNotifications: boolean;
}

type TabType = "overview" | "regulations" | "documents" | "audit" | "settings";

export default function CompliancePage() {
  const t = useTranslations("dashboard.compliance");
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [complianceScore, setComplianceScore] = useState(85);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<Settings>({
    jurisdictions: ["European Union", "Global"],
    autoSubmit: false,
    emailNotifications: true
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=/app/compliance");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      initializeCompliance();
    }
  }, [session]);

  const initializeCompliance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      
      // Initialize regulations if needed
      await fetch("/api/compliance/regulations/init", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      // Fetch all compliance data
      await fetchComplianceData();
    } catch (error) {
      console.error("Error initializing compliance:", error);
      toast.error(t("toasts.initFailed"));
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      
      // Fetch main data
      const dataResponse = await fetch("/api/compliance/data", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setComplianceScore(data.score || 85);
        setRegulations(data.regulations || []);
        setDocuments(data.documents || []);
        
        if (data.settings) {
          setSettings({
            jurisdictions: data.settings.jurisdictions || ["European Union", "Global"],
            autoSubmit: data.settings.autoSubmit || false,
            emailNotifications: data.settings.emailNotifications || true
          });
        }
      }

      // Fetch audit logs
      const logsResponse = await fetch("/api/compliance/audit-logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAuditLogs(logsData.logs || []);
      }
    } catch (error) {
      console.error("Error fetching compliance data:", error);
      toast.error(t("toasts.fetchFailed"));
    }
  };

  const handleGenerateReport = async (framework: string) => {
    try {
      setGenerating(true);
      const token = localStorage.getItem("bearer_token");
      
      toast.info(t("toasts.generating", { framework }));
      
      const response = await fetch("/api/compliance/documents/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ framework })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(t("toasts.generatedSuccess", { framework }));
        await fetchComplianceData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || t("toasts.generateFailed"));
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(t("toasts.generateFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    try {
      const token = localStorage.getItem("bearer_token");
      
      const response = await fetch("/api/compliance/settings", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setSettings(newSettings);
        toast.success(t("toasts.settingsSaved"));
        await fetchComplianceData(); // Refresh to get updated audit log
      } else {
        toast.error(t("toasts.settingsFailed"));
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(t("toasts.settingsFailed"));
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ComponentType }[] = [
    { id: "overview", label: t("tabs.overview"), icon: ShieldCheckIcon },
    { id: "regulations", label: t("tabs.regulations"), icon: GlobeIcon },
    { id: "documents", label: t("tabs.documents"), icon: DocumentIcon },
    { id: "audit", label: t("tabs.audit"), icon: HistoryIcon },
    { id: "settings", label: t("tabs.settings"), icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold mb-1.5 tracking-tight">
              {t("title")} <span className="gradient-text">{t("titleAccent")}</span>
            </h1>
            <p className="text-xs text-muted-foreground font-light">
              {t("subtitle")}
            </p>
          </div>
          
          {/* Compliance Score Badge */}
          <div className="flex items-center gap-2">
            <PremiumCard className="px-3 py-2 bg-gradient-to-br from-card to-card/50">
              <div className="text-[9px] text-muted-foreground mb-0.5 font-light">{t("healthLabel")}</div>
              <div className="flex items-center gap-1.5">
                <div className={`text-xl font-bold ${complianceScore >= 80 ? 'text-primary' : complianceScore >= 60 ? 'text-yellow-500' : 'text-destructive'}`}>
                  {complianceScore}%
                </div>
                {complianceScore >= 80 && <CheckCircleIcon />}
                {complianceScore < 80 && complianceScore >= 60 && <AlertIcon />}
                {complianceScore < 60 && <AlertIcon />}
              </div>
            </PremiumCard>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-border/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-accent border border-border/50"
                }`}
              >
                <Icon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === "overview" && <OverviewTab complianceScore={complianceScore} regulations={regulations} documents={documents} />}
        {activeTab === "regulations" && <RegulationsTab regulations={regulations} />}
        {activeTab === "documents" && <DocumentsTab documents={documents} onGenerate={handleGenerateReport} generating={generating} />}
        {activeTab === "audit" && <AuditTab logs={auditLogs} />}
        {activeTab === "settings" && <SettingsTab settings={settings} onSave={handleSaveSettings} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ complianceScore, regulations, documents }: { complianceScore: number; regulations: Regulation[]; documents: Document[] }) {
  const t = useTranslations("dashboard.compliance");
  const urgentItems = regulations.filter(r => r.status === "action_required").length;
  const upcomingDeadlines = regulations.filter(r => {
    const daysUntil = Math.floor((new Date(r.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil > 0;
  }).length;

  // Calculate compliance breakdown from actual regulations
  const complianceBreakdown = regulations.map(reg => {
    const statusMap: Record<string, { status: string; value: number }> = {
      'compliant': { status: t("status.compliantLabel"), value: 95 },
      'action_required': { status: t("status.actionRequiredLabel"), value: 60 },
      'upcoming': { status: t("status.preparation"), value: 75 }
    };
    const mapped = statusMap[reg.status] || { status: t("status.inProgress"), value: 70 };
    return {
      label: reg.name,
      value: mapped.value,
      status: mapped.status
    };
  });

  // Get recent regulations sorted by deadline
  const recentUpdates = regulations
    .slice()
    .sort((a, b) => new Date(b.nextDeadline).getTime() - new Date(a.nextDeadline).getTime())
    .slice(0, 3)
    .map(reg => ({
      date: new Date(reg.nextDeadline).toISOString().split('T')[0],
      title: `${reg.name} - ${t("overview.nextDeadlinePrefix")} ${new Date(reg.nextDeadline).toLocaleDateString()}`,
      type: reg.status === 'action_required' ? 'important' : reg.status === 'compliant' ? 'info' : 'update'
    }));

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Quick Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PremiumCard className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <AlertIcon />
            </div>
            <span className="text-[9px] text-muted-foreground font-light">{t("overview.actionRequired")}</span>
          </div>
          <div className="text-2xl font-bold mb-1">{urgentItems}</div>
          <div className="text-[10px] text-muted-foreground font-light">{t("overview.regulationsNeedAttention")}</div>
        </PremiumCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <PremiumCard className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClockIcon />
            </div>
            <span className="text-[9px] text-muted-foreground font-light">{t("overview.next30Days")}</span>
          </div>
          <div className="text-2xl font-bold mb-1">{upcomingDeadlines}</div>
          <div className="text-[10px] text-muted-foreground font-light">{t("overview.upcomingDeadlines")}</div>
        </PremiumCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <PremiumCard className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DocumentIcon />
            </div>
            <span className="text-[9px] text-muted-foreground font-light">{t("overview.generated")}</span>
          </div>
          <div className="text-2xl font-bold mb-1">{documents.length}</div>
          <div className="text-[10px] text-muted-foreground font-light">{t("overview.complianceDocuments")}</div>
        </PremiumCard>
      </motion.div>

      {/* Compliance Score Visualization */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="md:col-span-2 lg:col-span-3">
        <PremiumCard className="p-4">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {t("overview.healthBreakdown")}
          </h3>
          <div className="space-y-3">
            {complianceBreakdown.length > 0 ? (
              complianceBreakdown.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-foreground font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{item.status}</span>
                      <span className="font-semibold">{item.value}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                      className={`h-full rounded-full ${
                        item.value >= 80 ? 'bg-primary' : item.value >= 60 ? 'bg-yellow-500' : 'bg-destructive'
                      }`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                {t("overview.noComplianceData")}
              </div>
            )}
          </div>
        </PremiumCard>
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2 lg:col-span-3">
        <PremiumCard className="p-4">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {t("overview.recentUpdates")}
          </h3>
          <div className="space-y-2">
            {recentUpdates.length > 0 ? (
              recentUpdates.map((item, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={`w-1 h-1 rounded-full mt-1.5 ${item.type === 'important' ? 'bg-destructive' : item.type === 'update' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium mb-0.5">{item.title}</div>
                    <div className="text-[9px] text-muted-foreground font-light">{item.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                {t("overview.noRecentUpdates")}
              </div>
            )}
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
}

// Regulations Tab Component
function RegulationsTab({ regulations }: { regulations: Regulation[] }) {
  const t = useTranslations("dashboard.compliance");
  const statusLabel = (s: string) =>
    s === 'compliant' ? t("status.compliant") :
    s === 'action_required' ? t("status.actionRequired") :
    s === 'upcoming' ? t("status.upcoming") :
    s.replace('_', ' ').toUpperCase();
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {regulations.map((reg, index) => {
        const daysUntil = Math.floor((new Date(reg.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        return (
          <motion.div
            key={reg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PremiumCard className="p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-1 line-clamp-2">{reg.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                    <GlobeIcon />
                    <span>{reg.jurisdiction}</span>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap ml-2 ${
                  reg.status === 'compliant' ? 'bg-primary/10 text-primary' :
                  reg.status === 'action_required' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {statusLabel(reg.status)}
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3 font-light leading-relaxed">{reg.description}</p>

              <div className="mb-3 p-2.5 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground font-light">{t("regulations.nextDeadline")}</span>
                  <ClockIcon />
                </div>
                <div className="text-sm font-bold">{new Date(reg.nextDeadline).toLocaleDateString()}</div>
                <div className={`text-[9px] mt-0.5 ${daysUntil <= 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {daysUntil > 0 ? t("regulations.daysRemaining", { days: daysUntil }) : t("regulations.overdue")}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-muted-foreground mb-1">{t("regulations.keyRequirements")}</div>
                {reg.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground font-light">{req}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border/50">
                <PremiumButton size="sm" variant="outline" className="w-full text-xs h-7">
                  {t("regulations.viewDetails")}
                </PremiumButton>
              </div>
            </PremiumCard>
          </motion.div>
        );
      })}
    </div>
  );
}

// Documents Tab Component - updated
function DocumentsTab({ documents, onGenerate, generating }: { documents: Document[]; onGenerate: (framework: string) => void; generating: boolean }) {
  const t = useTranslations("dashboard.compliance");
  const statusLabel = (s: string) =>
    s === 'submitted' ? t("status.submitted") :
    s === 'ready' ? t("status.ready") :
    s === 'draft' ? t("status.draft") :
    s.toUpperCase();
  return (
    <div className="space-y-4">
      {/* Generate New Document */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PremiumCard className="p-4 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <SparkleIcon />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold mb-1">{t("documents.aiTitle")}</h3>
              <p className="text-[10px] text-muted-foreground font-light mb-3">
                {t("documents.aiDescription")}
              </p>
              <div className="flex flex-wrap gap-2">
                {["CSRD", "CDP", "GHG Protocol", "SEC"].map((framework) => (
                  <PremiumButton
                    key={framework}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => onGenerate(framework)}
                    disabled={generating}
                  >
                    {generating ? t("documents.generating") : t("documents.generatePrefix", { framework })}
                  </PremiumButton>
                ))}
              </div>
            </div>
          </div>
        </PremiumCard>
      </motion.div>

      {/* Documents List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full">
            <PremiumCard className="p-8 text-center">
              <DocumentIcon />
              <p className="text-sm text-muted-foreground mt-2">{t("documents.noDocuments")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("documents.noDocumentsHint")}</p>
            </PremiumCard>
          </div>
        ) : (
          documents.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <PremiumCard className="p-4 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DocumentIcon />
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                    doc.status === 'submitted' ? 'bg-primary/10 text-primary' :
                    doc.status === 'ready' ? 'bg-green-500/10 text-green-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {doc.status.toUpperCase()}
                  </div>
                </div>

                <h3 className="text-xs font-semibold mb-2 line-clamp-2">{doc.title}</h3>
                
                <div className="space-y-1.5 mb-3 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-light">Framework</span>
                    <span className="font-medium">{doc.framework}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-light">Generated</span>
                    <span className="font-medium">{new Date(doc.generatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-light">Due Date</span>
                    <span className="font-medium">{new Date(doc.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <PremiumButton 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs h-7 gap-1"
                    onClick={() => {
                      if (doc.content) {
                        const blob = new Blob([doc.content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${doc.title}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("Document downloaded");
                      }
                    }}
                  >
                    <DownloadIcon />
                    Download
                  </PremiumButton>
                </div>
              </PremiumCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Audit Tab Component - updated
function AuditTab({ logs }: { logs: AuditLog[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PremiumCard className="p-4">
        <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-primary" />
          Activity Log
        </h3>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No activity logged yet</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HistoryIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold">{log.action}</span>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1 font-light">{log.details}</p>
                  <span className="text-[9px] text-muted-foreground/70 font-light">by {log.createdBy}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </PremiumCard>
    </motion.div>
  );
}

// Settings Tab Component - updated
function SettingsTab({ settings, onSave }: { settings: Settings; onSave: (settings: Settings) => void }) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PremiumCard className="p-4">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            Operating Jurisdictions
          </h3>
          <p className="text-[10px] text-muted-foreground mb-3 font-light">
            Select the jurisdictions where your company operates to track relevant regulations
          </p>
          <div className="space-y-2">
            {["European Union", "United States", "United Kingdom", "Global"].map((jurisdiction) => (
              <label key={jurisdiction} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.jurisdictions.includes(jurisdiction)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setLocalSettings({
                        ...localSettings,
                        jurisdictions: [...localSettings.jurisdictions, jurisdiction]
                      });
                    } else {
                      setLocalSettings({
                        ...localSettings,
                        jurisdictions: localSettings.jurisdictions.filter(j => j !== jurisdiction)
                      });
                    }
                  }}
                  className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs">{jurisdiction}</span>
              </label>
            ))}
          </div>
        </PremiumCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <PremiumCard className="p-4">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            Automation Preferences
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
              <div>
                <div className="text-xs font-medium mb-0.5">Auto-submit reports</div>
                <div className="text-[10px] text-muted-foreground font-light">Automatically submit ready reports</div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoSubmit}
                onChange={(e) => setLocalSettings({ ...localSettings, autoSubmit: e.target.checked })}
                className="w-9 h-5 rounded-full bg-muted border-border checked:bg-primary transition-colors appearance-none cursor-pointer relative
                  before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform
                  checked:before:translate-x-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
              <div>
                <div className="text-xs font-medium mb-0.5">Email notifications</div>
                <div className="text-[10px] text-muted-foreground font-light">Receive deadline reminders via email</div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.emailNotifications}
                onChange={(e) => setLocalSettings({ ...localSettings, emailNotifications: e.target.checked })}
                className="w-9 h-5 rounded-full bg-muted border-border checked:bg-primary transition-colors appearance-none cursor-pointer relative
                  before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform
                  checked:before:translate-x-4"
              />
            </label>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/50">
            <PremiumButton size="sm" onClick={handleSave} className="w-full text-xs h-7">
              Save Settings
            </PremiumButton>
          </div>
        </PremiumCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <PremiumCard className="p-4 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <SparkleIcon />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold mb-1">AI Configuration</h3>
              <p className="text-[10px] text-muted-foreground font-light mb-3">
                The AI Autopilot monitors 195 countries' regulations in real-time and generates reports automatically
              </p>
              <PremiumButton size="sm" variant="outline" className="text-xs h-7">
                Configure AI Settings
              </PremiumButton>
            </div>
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
}