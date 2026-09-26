"use client";

import { useState, useEffect } from "react";
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
    if (ok) toast.success(!currentStatus ? "Project featured" : "Project no longer featured");
    else toast.error("The status could not be changed. Please try again.");
  };

  const updateVerificationStatus = async (projectId: number, status: string) => {
    setUpdating(projectId);
    const ok = await change(`${PATH}/${projectId}/update-status`, "PATCH", { verificationStatus: status });
    setUpdating(null);
    if (ok) toast.success(`Verification status set to ${status}`);
    else toast.error("The status could not be changed. Please try again.");
  };

  const generateBanner = async (projectId: number) => {
    setGenerating(projectId);
    const ok = await change(`${PATH}/${projectId}/generate-banner`, "POST");
    setGenerating(null);
    if (ok) toast.success("Banner created");
    else toast.error("The banner could not be created. Please try again.");
  };

  const bulkGenerateBanners = async () => {
    const data = await change<{ generated: number }>(`${PATH}/bulk-generate-banners`, "POST");
    if (data) toast.success(`Created ${data.generated} banners`);
    else toast.error("The banners could not be created. Please try again.");
  };

  const projectsWithoutBanners = projects.filter(p => !p.bannerImage).length;

  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div>
          <p className="font-medium break-words">{p.name}</p>
          <p className="vck-meta mt-0.5 break-words capitalize">{p.category.replace("_", " ")} \u00b7 {p.location}</p>
        </div>
      )
    },
    {
      key: "featured",
      header: "Featured",
      render: (p) => (
        <button
          type="button"
          onClick={() => toggleFeatured(p.id, p.isFeatured)}
          disabled={updating === p.id}
          className="vck-btn"
        >
          {p.isFeatured ? "Featured" : "Feature"}
        </button>
      )
    },
    {
      key: "verification",
      header: "Verification",
      render: (p) => (
        <select
          value={p.verificationStatus}
          onChange={(e) => updateVerificationStatus(p.id, e.target.value)}
          disabled={updating === p.id}
          className="rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] px-2 py-1.5 text-sm"
        >
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="in_review">In review</option>
          <option value="rejected">Rejected</option>
        </select>
      )
    },
    {
      key: "banner",
      header: "Banner",
      render: (p) =>
        p.bannerImage ? (
          <span className="vck-tag" data-tone="positive">Has banner</span>
        ) : (
          <button
            type="button"
            onClick={() => generateBanner(p.id)}
            disabled={generating === p.id}
            className="vck-btn"
          >
            {generating === p.id ? "Generating\u2026" : "Generate banner"}
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
          title="Marketplace admin"
          purpose="Manage project badges, verification status, and banner images."
          breadcrumb={[{ label: "Marketplace", href: "/app/marketplace" }, { label: "Admin" }]}
          actions={
            projectsWithoutBanners > 0 ? (
              <button type="button" className="vck-btn vck-btn-primary" onClick={bulkGenerateBanners} disabled={writer.busy}>
                Generate all banners ({projectsWithoutBanners})
              </button>
            ) : undefined
          }
        />
      }
    >
      <Section title="Overview">
        <MetricRow columns={4}>
          <Metric label="Total projects" value={projects.length} />
          <Metric label="Featured" value={projects.filter(p => p.isFeatured).length} />
          <Metric label="Verified" value={projects.filter(p => p.verificationStatus === "verified").length} />
          <Metric label="Without banners" value={projectsWithoutBanners} />
        </MetricRow>
      </Section>

      <Section title="Projects">
        <DataTable
          columns={columns}
          rows={projects}
          rowKey={(p) => String(p.id)}
          empty={
            <Empty
              title="No projects to manage yet"
              body="Projects will appear here once they are added to the marketplace."
            />
          }
        />
      </Section>
    </PageShell>
  );
}
