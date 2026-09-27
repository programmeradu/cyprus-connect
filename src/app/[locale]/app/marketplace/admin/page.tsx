"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import {
  PageShell,
  PageHeader,
  Section,
  MetricRow,
  Metric,
  DataTable,
  Empty,
  type DataTableColumn as Column
} from "@/components/app/console/kit";
import { APP_OPEN_ACCESS } from "@/lib/open-access";

interface Project {
  id: number;
  name: string;
  category: string;
  location: string;
  isFeatured: boolean;
  verificationStatus: string;
  bannerImage: string | null;
}

const PATH = "/api/marketplace/projects";

export default function MarketplaceAdminPage() {
  const t = useTranslations("dashboard.marketplace.admin");
  const tm = useTranslations("dashboard.marketplace");
  const catLabel = (c: string) => (tm.has(`categories.${c}` as any) ? tm(`categories.${c}` as any) : c.replace(/_/g, " "));
  const statusLabel = (s: string) => (t.has(`status.${s}` as any) ? t(`status.${s}` as any) : s);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [updating, setUpdating] = useState<number | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=/app/marketplace/admin");
    }
  }, [session, isPending, router]);

  const list = useWorkspaceResource<{ projects: Project[] }>(session?.user ? PATH : null);
  const projects = list.data?.projects ?? [];
  const loading = list.loading;
  const error = list.error;
  const fetchProjects = list.reload;
  const writer = useWorkspaceAction();

  // Every change re-reads the shared project list, so the marketplace and detail pages update too.
  const change = async <T,>(path: string, method: "PATCH" | "POST", body?: unknown) =>
    writer.run<T>(path, { method, body, invalidates: [PATH] });

  const toggleFeatured = async (projectId: number, currentStatus: boolean) => {
    setUpdating(projectId);
    const ok = await change(`${PATH}/${projectId}/update-status`, "PATCH", { isFeatured: !currentStatus });
    setUpdating(null);
    if (ok) toast.success(!currentStatus ? t("featuredOn") : t("featuredOff"));
    else toast.error("The status could not be changed. Please try again.");
  };

  const updateVerificationStatus = async (projectId: number, status: string) => {
    setUpdating(projectId);
    const ok = await change(`${PATH}/${projectId}/update-status`, "PATCH", { verificationStatus: status });
    setUpdating(null);
    if (ok) toast.success(t("statusSet", { status: statusLabel(status) }));
    else toast.error("The status could not be changed. Please try again.");
  };

  const generateBanner = async (projectId: number) => {
    setGenerating(projectId);
    const ok = await change(`${PATH}/${projectId}/generate-banner`, "POST");
    setGenerating(null);
    if (ok) toast.success(tm("detail.bannerOk"));
    else toast.error(tm("detail.bannerFail"));
  };

  const bulkGenerateBanners = async () => {
    const data = await change<{ generated: number }>(`${PATH}/bulk-generate-banners`, "POST");
    if (data) toast.success(t("bulkOk", { count: data.generated }));
    else toast.error(t("bulkFail"));
  };

  const projectsWithoutBanners = projects.filter(p => !p.bannerImage).length;

  const columns: Column<Project>[] = [
    {
      key: "name",
      header: tm("colProject"),
      render: (p) => (
        <div>
          <p className="font-medium break-words">{p.name}</p>
          <p className="vck-meta mt-0.5 break-words">{catLabel(p.category)} · {p.location}</p>
        </div>
      )
    },
    {
      key: "featured",
      header: t("colFeatured"),
      render: (p) => (
        <button
          type="button"
          onClick={() => toggleFeatured(p.id, p.isFeatured)}
          disabled={updating === p.id}
          className="vck-btn"
        >
          {p.isFeatured ? t("featured") : t("feature")}
        </button>
      )
    },
    {
      key: "verification",
      header: t("colVerification"),
      render: (p) => (
        <select
          aria-label={t("colVerification")}
          value={p.verificationStatus}
          onChange={(e) => updateVerificationStatus(p.id, e.target.value)}
          disabled={updating === p.id}
          className="rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] px-2 py-1.5 text-sm"
        >
          {(["verified", "pending", "in_review", "rejected"] as const).map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      )
    },
    {
      key: "banner",
      header: t("colBanner"),
      render: (p) =>
        p.bannerImage ? (
          <span className="vck-tag" data-tone="positive">{t("hasBanner")}</span>
        ) : (
          <button
            type="button"
            onClick={() => generateBanner(p.id)}
            disabled={generating === p.id}
            className="vck-btn"
          >
            {generating === p.id ? tm("detail.generating") : tm("detail.generateBanner")}
          </button>
        )
    }
  ];

  return (
    <PageShell
      signedOut={!isPending && !session?.user}
      loading={isPending || (!!session?.user && loading)}
      error={error}
      onRetry={fetchProjects}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("purpose")}
          breadcrumb={[{ label: tm("detail.marketplace"), href: "/app/marketplace" }, { label: t("crumb") }]}
          actions={
            projectsWithoutBanners > 0 ? (
              <button type="button" className="vck-btn vck-btn-primary" onClick={bulkGenerateBanners} disabled={writer.busy}>
                {t("generateAll", { count: projectsWithoutBanners })}
              </button>
            ) : undefined
          }
        />
      }
    >
      <Section title={t("overview")}>
        <MetricRow columns={4}>
          <Metric label={t("total")} value={projects.length} />
          <Metric label={t("featured")} value={projects.filter(p => p.isFeatured).length} />
          <Metric label={t("verified")} value={projects.filter(p => p.verificationStatus === "verified").length} />
          <Metric label={t("noBanner")} value={projectsWithoutBanners} />
        </MetricRow>
      </Section>

      <Section title={t("projects")}>
        <DataTable
          columns={columns}
          rows={projects}
          rowKey={(p) => String(p.id)}
          empty={
            <Empty
              title={t("emptyTitle")}
              body={t("emptyBody")}
            />
          }
        />
      </Section>
    </PageShell>
  );
}
