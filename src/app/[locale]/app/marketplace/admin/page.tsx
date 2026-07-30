"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PageShell,
  PageHeader,
  Section,
  MetricRow,
  Metric,
  DataTable,
  EmptyState,
  type Column
} from "@/components/app/shell";
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

export default function MarketplaceAdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=/app/marketplace/admin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/marketplace/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Projects could not be loaded.");
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (projectId: number, currentStatus: boolean) => {
    try {
      setUpdating(projectId);
      const response = await fetch(`/api/marketplace/projects/${projectId}/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");

      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, isFeatured: !currentStatus } : p
      ));

      toast.success(`Project ${!currentStatus ? "featured" : "unfeatured"} successfully`);
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const updateVerificationStatus = async (projectId: number, status: string) => {
    try {
      setUpdating(projectId);
      const response = await fetch(`/api/marketplace/projects/${projectId}/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: status })
      });

      if (!response.ok) throw new Error("Failed to update status");

      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, verificationStatus: status } : p
      ));

      toast.success(`Verification status updated to ${status}`);
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const generateBanner = async (projectId: number) => {
    try {
      setGenerating(projectId);
      toast.info("Generating banner image...");

      const response = await fetch(`/api/marketplace/projects/${projectId}/generate-banner`, {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to generate banner");

      const data = await response.json();

      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, bannerImage: data.bannerImage } : p
      ));

      toast.success("Banner generated successfully!");
    } catch (error) {
      console.error("Error generating banner:", error);
      toast.error("Failed to generate banner");
    } finally {
      setGenerating(null);
    }
  };

  const bulkGenerateBanners = async () => {
    try {
      toast.info("Generating banners for all projects...");

      const response = await fetch("/api/marketplace/projects/bulk-generate-banners", {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to generate banners");

      const data = await response.json();

      toast.success(`Generated ${data.generated} banners successfully!`);
      fetchProjects();
    } catch (error) {
      console.error("Error generating banners:", error);
      toast.error("Failed to generate banners");
    }
  };

  const projectsWithoutBanners = projects.filter(p => !p.bannerImage).length;

  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div>
          <p className="font-medium break-words">{p.name}</p>
          <p className="app-meta mt-0.5 break-words capitalize">{p.category.replace("_", " ")} \u00b7 {p.location}</p>
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
          className="app-btn-ghost app-btn"
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
          className="rounded-[0.375rem] border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-2 py-1.5 text-sm"
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
          <span className="app-tag" data-tone="positive">Has banner</span>
        ) : (
          <button
            type="button"
            onClick={() => generateBanner(p.id)}
            disabled={generating === p.id}
            className="app-btn-ghost app-btn"
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
              <button type="button" className="app-btn" onClick={bulkGenerateBanners}>
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
            <EmptyState
              title="No projects to manage yet"
              description="Projects will appear here once they are added to the marketplace."
            />
          }
        />
      </Section>
    </PageShell>
  );
}
