"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import {
  PageShell,
  PageHeader,
  Section,
  Metric,
  MetricRow,
  DataTable,
  EmptyState,
  type Column
} from "@/components/app/shell";

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
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseTons, setPurchaseTons] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=/app/marketplace");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProject();
      fetchRecommendations();
    }
  }, [id, session]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/marketplace/projects/${id}`);
      if (!response.ok) throw new Error("Failed to fetch project");

      const data = await response.json();
      setProject(data.project);
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("This project could not be loaded.");
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/marketplace/recommendations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const handleGenerateBanner = async () => {
    if (!project) return;

    try {
      setGeneratingBanner(true);
      toast.info("Generating banner image...");

      const response = await fetch(`/api/marketplace/projects/${project.id}/generate-banner`, {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to generate banner");

      const data = await response.json();

      setProject(prev => prev ? { ...prev, bannerImage: data.bannerImage } : null);
      toast.success("Banner generated successfully!");
    } catch (error: any) {
      console.error("Banner generation error:", error);
      toast.error("Failed to generate banner");
    } finally {
      setGeneratingBanner(false);
    }
  };

  const handlePurchase = async () => {
    if (!project) return;

    try {
      setPurchasing(true);
      const token = localStorage.getItem("bearer_token");

      const response = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId: project.id,
          tons: purchaseTons
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create purchase");
      }

      const { url } = await response.json();

      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      toast.success("Redirecting to checkout...");
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Failed to start purchase");
    } finally {
      setPurchasing(false);
      setShowPurchaseDialog(false);
    }
  };

  const totalPrice = project ? (project.pricePerTon * purchaseTons).toFixed(2) : "0.00";
  const utilizationPercent = project
    ? ((project.totalCapacityTons - project.availableTons) / project.totalCapacityTons * 100).toFixed(1)
    : "0";

  const recColumns: Column<Recommendation>[] = [
    { key: "name", header: "Project", render: (r) => r.name },
    { key: "category", header: "Category", hideOnMobile: true, render: (r) => <span className="app-tag capitalize">{r.category.replace("_", " ")}</span> },
    { key: "price", header: "Price / ton", numeric: true, render: (r) => `\u20ac${r.pricePerTon}` }
  ];

  return (
    <PageShell
      loading={isPending || loading}
      error={error}
      onRetry={fetchProject}
      header={
        <PageHeader
          title={project?.name ?? "Project"}
          purpose={project?.description}
          breadcrumb={[{ label: "Marketplace", href: "/app/marketplace" }, { label: project?.name ?? "" }]}
          actions={
            <button type="button" className="app-btn" onClick={() => setShowPurchaseDialog(true)} disabled={!project}>
              Purchase offsets
            </button>
          }
        />
      }
    >
      {project && (
        <>
          <Section title="Overview">
            <MetricRow columns={4}>
              <Metric label="Price per ton CO\u2082" value={`\u20ac${project.pricePerTon}`} />
              <Metric label="Available capacity" value={project.availableTons.toLocaleString()} unit="tons" />
              <Metric label="Capacity utilised" value={`${utilizationPercent}%`} note={`${project.totalCapacityTons.toLocaleString()} tons total`} />
              <Metric label="Verification" value={project.verificationStatus} note={project.certification} />
            </MetricRow>
          </Section>

          <Section title="Impact metrics">
            {Object.keys(project.impactMetrics ?? {}).length === 0 ? (
              <EmptyState title="No impact metrics recorded yet" description="This project has not published measured impact data." />
            ) : (
              <div className="app-card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
                {Object.entries(project.impactMetrics).map(([key, value]) => (
                  <div key={key}>
                    <p className="app-num text-lg font-semibold">
                      {typeof value === "number" ? value.toLocaleString() : String(value ?? "")}
                    </p>
                    <p className="app-meta capitalize">{key.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {project.sdgGoals && project.sdgGoals.length > 0 && (
            <Section title="UN Sustainable Development Goals">
              <div className="flex flex-wrap gap-1.5">
                {project.sdgGoals.map((goal) => (
                  <span key={goal} className="app-tag app-num">
                    SDG {goal}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {!project.bannerImage && (
            <Section title="Banner image" description="Generate a banner image for this listing.">
              <button type="button" className="app-btn-ghost app-btn" onClick={handleGenerateBanner} disabled={generatingBanner}>
                {generatingBanner ? "Generating\u2026" : "Generate banner"}
              </button>
            </Section>
          )}

          <Section title="Recommended for you">
            <DataTable
              columns={recColumns}
              rows={recommendations}
              rowKey={(r) => String(r.id)}
              onRowClick={(r) => router.push(`/app/marketplace/${r.id}`)}
              empty={
                <EmptyState
                  title="No recommendations yet"
                  description="Purchase or browse a few projects so Vuneli can tailor recommendations to your goals."
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
          <div className="app-overlay w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[1.0625rem] font-semibold leading-snug">Purchase carbon offsets</h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="app-label mb-1.5 block">Number of tons</label>
                <input
                  type="number"
                  min="1"
                  max={project.availableTons}
                  value={purchaseTons}
                  onChange={(e) => setPurchaseTons(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-[0.375rem] border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="app-card-inset space-y-2 p-3.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per ton</span>
                  <span className="app-num font-medium">\u20ac{project.pricePerTon}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="app-num font-medium">{purchaseTons} tons CO\u2082</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--app-rule)] pt-2">
                  <span className="text-sm font-semibold">Total amount</span>
                  <span className="app-metric text-lg">\u20ac{totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="app-btn-ghost app-btn flex-1"
                onClick={() => setShowPurchaseDialog(false)}
                disabled={purchasing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-btn flex-1"
                onClick={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? "Processing\u2026" : "Proceed to payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
