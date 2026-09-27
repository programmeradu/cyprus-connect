"use client";

import { useState, useEffect, use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspaceAction, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
import { Link } from "@/i18n/navigation";
import {
  PageShell,
  PageHeader,
  Section,
  Metric,
  MetricRow,
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
  totalCapacityTons: number;
  availableTons: number;
  projectStartDate: string;
  projectEndDate: string | null;
  verificationStatus: string;
  impactMetrics: any;
  isFeatured: boolean;
  sdgGoals: number[];
  bannerImage?: string | null;
}

interface Recommendation {
  id: number;
  name: string;
  category: string;
  pricePerTon: number;
  matchScore: number;
  matchReasons: string[];
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("dashboard.marketplace.detail");
  const tm = useTranslations("dashboard.marketplace");
  const nl = useLocale() === "el" ? "el-CY" : "en-GB";
  const catLabel = (c: string) => (tm.has(`categories.${c}` as any) ? tm(`categories.${c}` as any) : c.replace(/_/g, " "));
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseTons, setPurchaseTons] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=/app/marketplace");
    }
  }, [session, isPending, router]);

  const detail = useWorkspaceResource<{ project: Project }>(session?.user ? `/api/marketplace/projects/${id}` : null);
  const project = detail.data?.project ?? null;
  const loading = detail.loading;
  const error = detail.error ? t("loadFailed") : null;
  const fetchProject = detail.reload;
  const writer = useWorkspaceAction();

  // Recommendations are a computed read (POST on the server); ask once per signed-in visit.
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  useEffect(() => {
    if (!session?.user) return;
    let live = true;
    workspaceRequest<{ recommendations?: Recommendation[] }>("/api/marketplace/recommendations", { method: "POST" })
      .then((d) => live && setRecommendations((d.recommendations ?? []).slice(0, 3)))
      .catch(() => live && setRecommendations([]));
    return () => {
      live = false;
    };
  }, [session?.user]);

  const handleGenerateBanner = async () => {
    if (!project) return;
    setGeneratingBanner(true);
    const ok = await writer.run(`/api/marketplace/projects/${project.id}/generate-banner`, {
      method: "POST",
      invalidates: ["/api/marketplace/projects"]
    });
    setGeneratingBanner(false);
    if (ok) toast.success(t("bannerOk"));
    else toast.error(t("bannerFail"));
  };

  const handlePurchase = async () => {
    if (!project) return;
    setPurchasing(true);
    const res = await writer.run<{ url: string }>("/api/marketplace/purchase", {
      method: "POST",
      body: { projectId: project.id, tons: purchaseTons },
      invalidates: ["/api/marketplace"]
    });
    setPurchasing(false);
    setShowPurchaseDialog(false);
    if (!res?.url) {
      toast.error(t("checkoutFail"));
      return;
    }
    if (window.self !== window.top) {
      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: res.url } }, "*");
    } else {
      window.open(res.url, "_blank", "noopener,noreferrer");
    }
    toast.success(t("checkoutOpen"));
  };

  const totalPrice = project ? (project.pricePerTon * purchaseTons).toFixed(2) : "0.00";
  const utilizationPercent = project
    ? ((project.totalCapacityTons - project.availableTons) / project.totalCapacityTons * 100).toFixed(1)
    : "0";

  const recColumns: Column<Recommendation>[] = [
    { key: "name", header: t("project"), render: (r) => r.name },
    { key: "category", header: tm("colCategory"), hideOnMobile: true, render: (r) => <span className="vck-tag">{catLabel(r.category)}</span> },
    { key: "price", header: tm("colPrice"), numeric: true, render: (r) => `\u20ac${r.pricePerTon}` }
  ];

  return (
    <PageShell
      signedOut={!isPending && !session?.user}
      loading={isPending || (!!session?.user && loading)}
      error={error}
      onRetry={fetchProject}
      header={
        <PageHeader
          title={project?.name ?? t("project")}
          purpose={project?.description}
          breadcrumb={[{ label: t("marketplace"), href: "/app/marketplace" }, { label: project?.name ?? "" }]}
          actions={
            <button type="button" className="vck-btn vck-btn-primary" onClick={() => setShowPurchaseDialog(true)} disabled={!project}>
              {t("purchase")}
            </button>
          }
        />
      }
    >
      {project && (
        <>
          <Section title={t("overview")}>
            <MetricRow columns={4}>
              <Metric label={t("pricePerTon")} value={`\u20ac${project.pricePerTon}`} />
              <Metric label={t("available")} value={project.availableTons.toLocaleString(nl)} unit={t("tonsUnit")} />
              <Metric label={t("utilised")} value={`${utilizationPercent}%`} note={t("tonsTotal", { total: project.totalCapacityTons.toLocaleString(nl) })} />
              <Metric label={t("verification")} value={project.verificationStatus} note={project.certification} />
            </MetricRow>
          </Section>

          <Section title={t("impact")}>
            {Object.keys(project.impactMetrics ?? {}).length === 0 ? (
              <Empty title={t("noImpactTitle")} body={t("noImpactBody")} />
            ) : (
              <div className="vck-card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
                {Object.entries(project.impactMetrics).map(([key, value]) => (
                  <div key={key}>
                    <p className="vck-num text-lg font-semibold">
                      {typeof value === "number" ? value.toLocaleString(nl) : String(value ?? "")}
                    </p>
                    <p className="vck-meta capitalize">{key.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {project.sdgGoals && project.sdgGoals.length > 0 && (
            <Section title={t("sdg")}>
              <div className="flex flex-wrap gap-1.5">
                {project.sdgGoals.map((goal) => (
                  <span key={goal} className="vck-tag vck-num">
                    SDG {goal}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {!project.bannerImage && (
            <Section title={t("banner")} description={t("bannerDesc")}>
              <button type="button" className="vck-btn" onClick={handleGenerateBanner} disabled={generatingBanner}>
                {generatingBanner ? t("generating") : t("generateBanner")}
              </button>
            </Section>
          )}

          <Section title={t("recommended")}>
            <DataTable
              columns={recColumns}
              rows={recommendations}
              rowKey={(r) => String(r.id)}
              onRowClick={(r) => router.push(`/app/marketplace/${r.id}`)}
              empty={
                <Empty
                  title={t("noRecTitle")}
                  body={t("noRecBody")}
                />
              }
            />
          </Section>
        </>
      )}

      {showPurchaseDialog && project && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--foreground)_60%,transparent)] p-4"
          onClick={() => setShowPurchaseDialog(false)}
        >
          <div className="vck-overlay w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[1.0625rem] font-semibold leading-snug">{t("dialogTitle")}</h3>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="purchase-tons" className="vck-label mb-1.5 block">{t("tonsInput")}</label>
                <input
                  id="purchase-tons"
                  type="number"
                  min="1"
                  max={project.availableTons}
                  value={purchaseTons}
                  onChange={(e) => setPurchaseTons(Math.min(Math.max(1, project.availableTons), Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="vck-inset space-y-2 p-3.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("priceRow")}</span>
                  <span className="vck-num font-medium">\u20ac{project.pricePerTon}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("quantity")}</span>
                  <span className="vck-num font-medium">{t("quantityValue", { count: purchaseTons.toLocaleString(nl) })}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--vc-rule-soft)] pt-2">
                  <span className="text-sm font-semibold">{t("total")}</span>
                  <span className="vck-num text-lg">\u20ac{totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="vck-btn flex-1"
                onClick={() => setShowPurchaseDialog(false)}
                disabled={purchasing}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="vck-btn vck-btn-primary flex-1"
                onClick={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? t("processing") : t("pay")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
