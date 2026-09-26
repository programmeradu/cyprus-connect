"use client";

import { ConsoleAvatar } from "@/components/app/console/ConsoleAvatar";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  DataTable,
  Empty,
  type DataTableColumn as Column
} from "@/components/app/console/kit";
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
  const [selectedCategory, setSelectedCategory] = useState<(typeof categoryIds)[number]>("all");

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=/app/marketplace");
    }
  }, [session, isPending, router]);

  // One shared copy per category; admin and detail pages invalidate it when they change a project.
  const listPath = session?.user
    ? `/api/marketplace/projects${selectedCategory !== "all" ? `?category=${selectedCategory}` : ""}`
    : null;
  const list = useWorkspaceResource<{ projects: Project[] }>(listPath);
  const projects = list.data?.projects ?? [];
  const loading = list.loading;
  const error = list.error ? t("toastLoadFailed") : null;
  const fetchProjects = list.reload;

  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <ConsoleAvatar seed={p.name} size={30} styleKey="shapes" alt="" />
          <div className="min-w-0">
            <p className="font-medium break-words">{p.name}</p>
            <p className="vck-meta mt-0.5 break-words">{p.location}</p>
          </div>
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      render: (p) => <span className="vck-tag capitalize">{p.category.replace("_", " ")}</span>
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
            <a href="/app/marketplace/impact" className="vck-btn">
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
            <Empty
              title="No projects match this filter"
              body={t("empty")}
              action={{ label: "View all categories", onClick: () => setSelectedCategory("all") }}
            />
          }
        />
      </Section>
    </PageShell>
  );
}
