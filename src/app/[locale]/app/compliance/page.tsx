"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspaceAction, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
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
  Empty
} from "@/components/app/console/kit";
import type { DataTableColumn as Column } from "@/components/app/console/kit";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { FRAMEWORKS } from "@/lib/compliance/frameworks";

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
  const [settings, setSettings] = useState<Settings>({
    jurisdictions: ["European Union", "Global"],
    autoSubmit: false,
    emailNotifications: true
  });
  const [generating, setGenerating] = useState(false);
  const writer = useWorkspaceAction();

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=/app/compliance");
    }
  }, [session, isPending, router]);

  // Make sure this account has its Cyprus/EU framework rows (idempotent), then read the shared records.
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const initializeCompliance = useCallback(async () => {
    setInitError(null);
    try {
      await workspaceRequest("/api/compliance/regulations/init", { method: "POST" });
      setReady(true);
    } catch {
      setInitError(t("toasts.initFailed"));
    }
  }, [t]);
  useEffect(() => {
    if (session?.user && !ready) void initializeCompliance();
  }, [session?.user, ready, initializeCompliance]);

  const data = useWorkspaceResource<{
    score?: number | null;
    regulations?: Regulation[];
    documents?: Document[];
    settings?: Partial<Settings> | null;
  }>(ready ? "/api/compliance/data" : null);
  const logs = useWorkspaceResource<{ logs?: AuditLog[] }>(ready ? "/api/compliance/audit-logs" : null);

  const complianceScore = typeof data.data?.score === "number" ? data.data.score : null;
  const regulations = data.data?.regulations ?? [];
  const documents = data.data?.documents ?? [];
  const auditLogs = logs.data?.logs ?? [];
  const loading = !ready && !initError ? true : data.loading;
  const pageError = initError ?? (data.error ? t("toasts.fetchFailed") : null);

  useEffect(() => {
    const saved = data.data?.settings;
    if (!saved) return;
    setSettings({
      jurisdictions: saved.jurisdictions?.length ? saved.jurisdictions : ["European Union", "Global"],
      autoSubmit: saved.autoSubmit ?? false,
      emailNotifications: saved.emailNotifications ?? true
    });
  }, [data.data?.settings]);

  const handleGenerateReport = async (framework: string) => {
    setGenerating(true);
    toast.info(t("toasts.generating", { framework }));
    const ok = await writer.run("/api/compliance/documents/generate", {
      method: "POST",
      body: { framework },
      invalidates: ["/api/compliance", "/api/reports"]
    });
    setGenerating(false);
    if (ok) toast.success(t("toasts.generatedSuccess", { framework }));
    else toast.error(t("toasts.generateFailed"));
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    const ok = await writer.run("/api/compliance/settings", {
      method: "PUT",
      body: newSettings,
      invalidates: ["/api/compliance"]
    });
    if (ok) {
      setSettings(newSettings);
      toast.success(t("toasts.settingsSaved"));
    } else {
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
      signedOut={!isPending && !session?.user}
      loading={isPending || (!!session?.user && loading)}
      error={pageError}
      onRetry={initError ? initializeCompliance : data.reload}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          meta={complianceScore === null ? `${t("healthLabel")}: —` : `${t("healthLabel")}: ${complianceScore}%`}
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
  complianceScore: number | null;
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
          <div className="vck-ledgerbox">
            {complianceBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium break-words">{item.label}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="vck-meta">{item.status}</span>
                  <span className="vck-num text-sm font-semibold">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="No regulations tracked yet"
            body="Once regulations are initialised for your account, their compliance health will appear here."
          />
        )}
      </Section>

      <Section title={t("overview.recentUpdates")}>
        {recentUpdates.length > 0 ? (
          <div className="vck-ledgerbox">
            {recentUpdates.map((item, index) => (
              <div key={index} className="flex items-start justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium break-words">{item.title}</span>
                <span className="vck-meta shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="No recent regulatory activity"
            body="Updates to your tracked regulations will show up here as they happen."
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
          <p className="vck-meta break-words">{reg.jurisdiction}</p>
        </div>
      )
    },
    {
      key: "status",
      header: t("status.compliant"),
      render: (reg) => (
        <span className="vck-tag" data-tone={statusTone(reg.status)}>
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
            <p className="vck-meta">
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
          <Empty
            title="No regulations to review"
            body="Regulations relevant to your jurisdiction will be listed here once initialised."
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
          <p className="vck-meta">{doc.framework}</p>
        </div>
      )
    },
    {
      key: "status",
      header: t("status.ready"),
      render: (doc) => (
        <span className="vck-tag" data-tone={statusTone(doc.status)}>
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
          className="vck-btn"
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
        <div className="vck-card flex flex-wrap gap-2 p-4">
          {FRAMEWORKS.map((f) => f.label).map((framework) => (
            <button
              key={framework}
              type="button"
              className="vck-btn"
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
            <Empty
              title={t("documents.noDocuments")}
              body={t("documents.noDocumentsHint")}
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
          <p className="vck-meta break-words">{log.details}</p>
          <p className="vck-meta">{t("audit.by", { user: log.createdBy })}</p>
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
          <Empty
            title={t("audit.noActivity")}
            body="Actions you take on this page, like generating reports or changing settings, will be recorded here."
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
        <div className="vck-card space-y-2 p-4">
          {jurisdictionOptions.map(({ value, label }) => (
            <label
              key={value}
              className="vck-inset flex items-center gap-2 px-3 py-2 cursor-pointer"
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
          <button type="button" className="vck-btn vck-btn-primary mt-2" onClick={() => onSave(localSettings)}>
            {t("settings.save")}
          </button>
        </div>
      </Section>

      <Section title={t("settings.automationTitle")}>
        <div className="vck-card space-y-3 p-4">
          <label className="vck-inset flex items-center justify-between gap-3 px-3 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium">{t("settings.autoSubmitTitle")}</p>
              <p className="vck-meta">{t("settings.autoSubmitDesc")}</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoSubmit}
              onChange={(e) => setLocalSettings({ ...localSettings, autoSubmit: e.target.checked })}
            />
          </label>

          <label className="vck-inset flex items-center justify-between gap-3 px-3 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium">{t("settings.emailNotificationsTitle")}</p>
              <p className="vck-meta">{t("settings.emailNotificationsDesc")}</p>
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
