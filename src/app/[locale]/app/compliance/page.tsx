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
} from "@/components/app/console/kit";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { isQaClient } from "@/lib/qa-bypass";
import { DEFAULT_JURISDICTIONS, type AuditLog, type ComplianceDocument, type Regulation, type Settings } from "@/components/app/compliance/types";
import { OverviewTab } from "@/components/app/compliance/OverviewTab";
import { EuFeedPanel } from "@/components/app/console/EuFeedPanel";
import { RegulationsTab } from "@/components/app/compliance/RegulationsTab";
import { DocumentsTab } from "@/components/app/compliance/DocumentsTab";
import { AuditTab } from "@/components/app/compliance/AuditTab";
import { SettingsTab } from "@/components/app/compliance/SettingsTab";

type TabType = "overview" | "regulations" | "documents" | "audit" | "settings";

export default function CompliancePage() {
  const t = useTranslations("dashboard.compliance");
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [settings, setSettings] = useState<Settings>({
    jurisdictions: DEFAULT_JURISDICTIONS,
    autoSubmit: false,
    emailNotifications: true
  });
  const [generating, setGenerating] = useState(false);
  const writer = useWorkspaceAction();
  // Preview QA mode: the server accepts the synthetic test identity.
  const [qa, setQa] = useState(false);
  useEffect(() => setQa(isQaClient()), []);
  const signedIn = Boolean(session?.user) || qa;

  useEffect(() => {
    if (!isPending && !session?.user && !isQaClient()) {
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
    if (signedIn && !ready) void initializeCompliance();
  }, [signedIn, ready, initializeCompliance]);

  const data = useWorkspaceResource<{
    score?: number | null;
    regulations?: Regulation[];
    documents?: ComplianceDocument[];
    settings?: Partial<Settings> | null;
  }>(ready ? "/api/compliance/data" : null);
  const logs = useWorkspaceResource<{ logs?: AuditLog[] }>(ready ? "/api/compliance/audit-logs" : null);

  const regulations = data.data?.regulations ?? [];
  const documents = data.data?.documents ?? [];
  const auditLogs = logs.data?.logs ?? [];
  const loading = !ready && !initError ? true : data.loading;
  const pageError = initError ?? (data.error ? t("toasts.fetchFailed") : null);

  useEffect(() => {
    const saved = data.data?.settings;
    if (!saved) return;
    setSettings({
      jurisdictions: saved.jurisdictions?.length ? saved.jurisdictions : DEFAULT_JURISDICTIONS,
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
      signedOut={!qa && !isPending && !signedIn}
      loading={(!qa && isPending) || (signedIn && loading)}
      error={pageError}
      onRetry={initError ? initializeCompliance : data.reload}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
        />
      }
      toolbar={
        <PageToolbar>
          <ToolbarTabs options={tabs} value={activeTab} onChange={setActiveTab} ariaLabel={t("tabs.overview")} />
        </PageToolbar>
      }
    >
      {activeTab === "overview" && (
        <OverviewTab
          documents={documents}
          onGenerate={handleGenerateReport}
          generating={generating}
          onOpenDocuments={() => setActiveTab("documents")}
        />
      )}
      {(activeTab === "overview" || activeTab === "regulations") && <EuFeedPanel source="eurlex" />}
      {activeTab === "regulations" && <RegulationsTab regulations={regulations} />}
      {activeTab === "documents" && (
        <DocumentsTab documents={documents} onGenerate={handleGenerateReport} generating={generating} />
      )}
      {activeTab === "audit" && <AuditTab logs={auditLogs} />}
      {activeTab === "settings" && <SettingsTab settings={settings} onSave={handleSaveSettings} />}
    </PageShell>
  );
}

