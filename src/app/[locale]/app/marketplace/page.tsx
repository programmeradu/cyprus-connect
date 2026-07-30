"use client";

import { ConsoleAvatar } from "@/components/app/console/ConsoleAvatar";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  DataTable,
  EmptyState,
  type Column
} from "@/components/app/shell";
import { APP_OPEN_ACCESS } from "@/lib/open-access";

interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  location: string;
  certification: string;
  pricePerTon: number;
  availableTons: number;
  verificationStatus: string;
  impactMetrics: any;
  isFeatured: boolean;
  sdgGoals: number[];
  bannerImage?: string;
}

const categoryIds = ["all", "forestry", "renewable_energy", "carbon_capture", "ocean_conservation"] as const;

export default function MarketplacePage() {
  const t = useTranslations("dashboard.marketplace");
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<(typeof categoryIds)[number]>("all");

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=/app/marketplace");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
    }
  }, [selectedCategory, session]);

  // Auto-generate banners in background on page visit
  useEffect(() => {
    if (session?.user) {
      triggerBackgroundGeneration();
    }
  }, [session]);

  const triggerBackgroundGeneration = async () => {
    try {
      await fetch("/api/marketplace/projects/auto-generate-banners", {
        method: "POST"
      });
    } catch (error) {
      // Silently fail - this is a background task
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/marketplace/projects?${params}`);
      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(t("toastLoadFailed"));
      toast.error(t("toastLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <ConsoleAvatar seed={p.name} size={30} styleKey="shapes" alt="" />
          <div className="min-w-0">
            <p className="font-medium break-words">{p.name}</p>
            <p className="app-meta mt-0.5 break-words">{p.location}</p>
          </div>
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      render: (p) => <span className="app-tag capitalize">{p.category.replace("_", " ")}</span>
    },
    {
      key: "certification",
      header: "Certification",
      hideOnMobile: true,
      render: (p) => p.certification
    },
    {
      key: "available",
      header: "Available",
      numeric: true,
      render: (p) => `${p.availableTons.toLocaleString()} t`
    },
    {
      key: "price",
      header: "Price / ton",
      numeric: true,
      render: (p) => `\u20ac${p.pricePerTon}`
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
          title={t("titleA") + " " + t("titleB")}
          purpose={t("subtitle")}
          actions={
            <a href="/app/marketplace/impact" className="app-btn-ghost app-btn">
              {t("yourImpact")}
            </a>
          }
        />
      }
      toolbar={
        <PageToolbar>
          <ToolbarTabs
            ariaLabel="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categoryIds.map((id) => ({ value: id, label: t(`categories.${id}` as any) }))}
          />
        </PageToolbar>
      }
    >
      <Section title="Verified carbon offset projects">
        <DataTable
          columns={columns}
          rows={projects}
          rowKey={(p) => String(p.id)}
          onRowClick={(p) => router.push(`/app/marketplace/${p.id}`)}
          empty={
            <EmptyState
              title="No projects match this filter"
              description={t("empty")}
              action={{ label: "View all categories", onClick: () => setSelectedCategory("all") }}
            />
          }
        />
      </Section>
    </PageShell>
  );
}
