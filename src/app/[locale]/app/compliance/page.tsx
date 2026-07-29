"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  DataTable,
  Metric,
  MetricRow,
  EmptyState
} from "@/components/app/shell";
import type { Column } from "@/components/app/shell";

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
  const [pageError, setPageError] = useState<string | null>(null);
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
      setPageError(null);
      const token = localStorage.getItem("bearer_token");

      await fetch("/api/compliance/regulations/init", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      await fetchComplianceData();
    } catch (error) {
      console.error("Error initializing compliance:", error);
      setPageError(t("toasts.initFailed"));
      toast.error(t("toasts.initFailed"));
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");

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
        toast.success(t("toasts.generatedSuccess", { framework }));
        await fetchComplianceData();
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
        await fetchComplianceData();
      } else {
        toast.error(t("toasts.settingsFailed"));
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(t("toasts.settingsFailed"));
    }
  };

  const tabs: { value: TabType; label: string }[] = [
    { value: "overview", label: t("tabs.overview") },
    { value: "regulations", label: t("tabs.regulations") },
    { value: "documents", label: t("tabs.documents") },
    { value: "audit", label: t("tabs.audit") },
    { value: "settings", label: t("tabs.settings") }
  ];

  return (
    <PageShell
      loading={isPending || loading}
      error={pageError}
      onRetry={initializeCompliance}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          meta={`${t("healthLabel")}: ${complianceScore}%`}
        />
      }
      toolbar={
        <PageToolbar>
          <ToolbarTabs options={tabs} value={activeTab} onChange={setActiveTab} ariaLabel={t("tabs.overview")} />
        </PageToolbar>
      }
    >
      {activeTab === "overview" && (
        <OverviewTab complianceScore={complianceScore} regulations={regulations} documents={documents} />
      )}
      {activeTab === "regulations" && <RegulationsTab regulations={regulations} />}
      {activeTab === "documents" && (
        <DocumentsTab documents={documents} onGenerate={handleGenerateReport} generating={generating} />
      )}
      {activeTab === "audit" && <AuditTab logs={auditLogs} />}
      {activeTab === "settings" && <SettingsTab settings={settings} onSave={handleSaveSettings} />}
    </PageShell>
  );
}

function OverviewTab({
  complianceScore,
  regulations,
  documents
}: {
  complianceScore: number;
  regulations: Regulation[];
  documents: Document[];
}) {
  const t = useTranslations("dashboard.compliance");
  const urgentItems = regulations.filter((r) => r.status === "action_required").length;
  const upcomingDeadlines = regulations.filter((r) => {
    const daysUntil = Math.floor((new Date(r.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil > 0;
  }).length;

  const complianceBreakdown = regulations.map((reg) => {
    const statusMap: Record<string, { status: string; value: number }> = {
      compliant: { status: t("status.compliantLabel"), value: 95 },
      action_required: { status: t("status.actionRequiredLabel"), value: 60 },
      upcoming: { status: t("status.preparation"), value: 75 }
    };
    const mapped = statusMap[reg.status] || { status: t("status.inProgress"), value: 70 };
    return { label: reg.name, value: mapped.value, status: mapped.status };
  });

  const recentUpdates = regulations
    .slice()
    .sort((a, b) => new Date(b.nextDeadline).getTime() - new Date(a.nextDeadline).getTime())
    .slice(0, 3)
    .map((reg) => ({
      date: new Date(reg.nextDeadline).toISOString().split("T")[0],
      title: `${reg.name} - ${t("overview.nextDeadlinePrefix")} ${new Date(reg.nextDeadline).toLocaleDateString()}`,
      type: reg.status === "action_required" ? "important" : reg.status === "compliant" ? "info" : "update"
    }));

  return (
    <>
      <Section title={t("overview.healthBreakdown")}>
        <MetricRow columns={3}>
          <Metric label={t("overview.actionRequired")} value={urgentItems} note={t("overview.regulationsNeedAttention")} />
          <Metric label={t("overview.next30Days")} value={upcomingDeadlines} note={t("overview.upcomingDeadlines")} />
          <Metric label={t("overview.generated")} value={documents.length} note={t("overview.complianceDocuments")} />
        </MetricRow>
      </Section>

      <Section title={t("overview.healthBreakdown")}>
        {complianceBreakdown.length > 0 ? (
          <div className="app-ledger">
            {complianceBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium break-words">{item.label}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="app-meta">{item.status}</span>
                  <span className="app-num text-sm font-semibold">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No regulations tracked yet"
            description="Once regulations are initialised for your account, their compliance health will appear here."
          />
        )}
      </Section>

      <Section title={t("overview.recentUpdates")}>
        {recentUpdates.length > 0 ? (
          <div className="app-ledger">
            {recentUpdates.map((item, index) => (
              <div key={index} className="flex items-start justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium break-words">{item.title}</span>
                <span className="app-meta shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent regulatory activity"
            description="Updates to your tracked regulations will show up here as they happen."
          />
        )}
      </Section>
    </>
  );
}

function RegulationsTab({ regulations }: { regulations: Regulation[] }) {
  const t = useTranslations("dashboard.compliance");
  const statusLabel = (s: string) =>
    s === "compliant"
      ? t("status.compliant")
      : s === "action_required"
        ? t("status.actionRequired")
        : s === "upcoming"
          ? t("status.upcoming")
          : s.replace("_", " ");

  const statusTone = (s: string) => (s === "compliant" ? "positive" : s === "action_required" ? "critical" : "caution");

  const columns: Column<Regulation>[] = [
    {
      key: "name",
      header: t("tabs.regulations"),
      render: (reg) => (
        <div>
          <p className="font-medium break-words">{reg.name}</p>
          <p className="app-meta break-words">{reg.jurisdiction}</p>
        </div>
      )
    },
    {
      key: "status",
      header: t("status.compliant"),
      render: (reg) => (
        <span className="app-tag" data-tone={statusTone(reg.status)}>
          {statusLabel(reg.status)}
        </span>
      )
    },
    {
      key: "deadline",
      header: t("regulations.nextDeadline"),
      hideOnMobile: true,
      render: (reg) => {
        const daysUntil = Math.floor(
          (new Date(reg.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return (
          <div>
            <p>{new Date(reg.nextDeadline).toLocaleDateString()}</p>
            <p className="app-meta">
              {daysUntil > 0 ? t("regulations.daysRemaining", { days: daysUntil }) : t("regulations.overdue")}
            </p>
          </div>
        );
      }
    }
  ];

  return (
    <Section title={t("tabs.regulations")}>
      <DataTable
        columns={columns}
        rows={regulations}
        rowKey={(r) => String(r.id)}
        empty={
          <EmptyState
            title="No regulations to review"
            description="Regulations relevant to your jurisdiction will be listed here once initialised."
          />
        }
      />
    </Section>
  );
}

function DocumentsTab({
  documents,
  onGenerate,
  generating
}: {
  documents: Document[];
  onGenerate: (framework: string) => void;
  generating: boolean;
}) {
  const t = useTranslations("dashboard.compliance");
  const statusLabel = (s: string) =>
    s === "submitted" ? t("status.submitted") : s === "ready" ? t("status.ready") : t("status.draft");
  const statusTone = (s: string) => (s === "submitted" ? "positive" : s === "ready" ? "caution" : undefined);

  const columns: Column<Document>[] = [
    {
      key: "title",
      header: t("documents.framework"),
      render: (doc) => (
        <div>
          <p className="font-medium break-words">{doc.title}</p>
          <p className="app-meta">{doc.framework}</p>
        </div>
      )
    },
    {
      key: "status",
      header: t("status.ready"),
      render: (doc) => (
        <span className="app-tag" data-tone={statusTone(doc.status)}>
          {statusLabel(doc.status)}
        </span>
      )
    },
    {
      key: "dueDate",
      header: t("documents.dueDate"),
      hideOnMobile: true,
      render: (doc) => new Date(doc.dueDate).toLocaleDateString()
    },
    {
      key: "actions",
      header: "",
      render: (doc) => (
        <button
          type="button"
          className="app-btn-ghost app-btn"
          onClick={() => {
            if (doc.content) {
              const blob = new Blob([doc.content], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${doc.title}.md`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success(t("toasts.downloaded"));
            }
          }}
        >
          {t("documents.download")}
        </button>
      )
    }
  ];

  return (
    <>
      <Section title={t("documents.aiTitle")} description={t("documents.aiDescription")}>
        <div className="app-card flex flex-wrap gap-2 p-4">
          {["CSRD", "CDP", "GHG Protocol", "SEC"].map((framework) => (
            <button
              key={framework}
              type="button"
              className="app-btn-ghost app-btn"
              onClick={() => onGenerate(framework)}
              disabled={generating}
            >
              {generating ? t("documents.generating") : t("documents.generatePrefix", { framework })}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("tabs.documents")}>
        <DataTable
          columns={columns}
          rows={documents}
          rowKey={(d) => String(d.id)}
          empty={
            <EmptyState
              title={t("documents.noDocuments")}
              description={t("documents.noDocumentsHint")}
            />
          }
        />
      </Section>
    </>
  );
}

function AuditTab({ logs }: { logs: AuditLog[] }) {
  const t = useTranslations("dashboard.compliance");
  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      header: t("audit.activityLog"),
      render: (log) => (
        <div>
          <p className="font-medium break-words">{log.action}</p>
          <p className="app-meta break-words">{log.details}</p>
          <p className="app-meta">{t("audit.by", { user: log.createdBy })}</p>
        </div>
      )
    },
    {
      key: "createdAt",
      header: "",
      numeric: true,
      render: (log) => new Date(log.createdAt).toLocaleString()
    }
  ];

  return (
    <Section title={t("audit.activityLog")}>
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(l) => String(l.id)}
        empty={
          <EmptyState
            title={t("audit.noActivity")}
            description="Actions you take on this page, like generating reports or changing settings, will be recorded here."
          />
        }
      />
    </Section>
  );
}

function SettingsTab({ settings, onSave }: { settings: Settings; onSave: (settings: Settings) => void }) {
  const t = useTranslations("dashboard.compliance");
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const jurisdictionOptions: { value: string; label: string }[] = [
    { value: "European Union", label: t("settings.jurisdictionOptions.eu") },
    { value: "United States", label: t("settings.jurisdictionOptions.us") },
    { value: "United Kingdom", label: t("settings.jurisdictionOptions.uk") },
    { value: "Global", label: t("settings.jurisdictionOptions.global") }
  ];

  return (
    <>
      <Section title={t("settings.jurisdictionsTitle")} description={t("settings.jurisdictionsDescription")}>
        <div className="app-card space-y-2 p-4">
          {jurisdictionOptions.map(({ value, label }) => (
            <label
              key={value}
              className="app-card-inset flex items-center gap-2 px-3 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={localSettings.jurisdictions.includes(value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLocalSettings({
                      ...localSettings,
                      jurisdictions: [...localSettings.jurisdictions, value]
                    });
                  } else {
                    setLocalSettings({
                      ...localSettings,
                      jurisdictions: localSettings.jurisdictions.filter((j) => j !== value)
                    });
                  }
                }}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
          <button type="button" className="app-btn mt-2" onClick={() => onSave(localSettings)}>
            {t("settings.save")}
          </button>
        </div>
      </Section>

      <Section title={t("settings.automationTitle")}>
        <div className="app-card space-y-3 p-4">
          <label className="app-card-inset flex items-center justify-between gap-3 px-3 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium">{t("settings.autoSubmitTitle")}</p>
              <p className="app-meta">{t("settings.autoSubmitDesc")}</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoSubmit}
              onChange={(e) => setLocalSettings({ ...localSettings, autoSubmit: e.target.checked })}
            />
          </label>

          <label className="app-card-inset flex items-center justify-between gap-3 px-3 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium">{t("settings.emailNotificationsTitle")}</p>
              <p className="app-meta">{t("settings.emailNotificationsDesc")}</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.emailNotifications}
              onChange={(e) => setLocalSettings({ ...localSettings, emailNotifications: e.target.checked })}
            />
          </label>
        </div>
      </Section>
    </>
  );
}
