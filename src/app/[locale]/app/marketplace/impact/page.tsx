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

interface ImpactData {
  totalTonsOffset: number;
  totalSpent: number;
  projectsSupported: number;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
}

interface Breakdown {
  category: string;
  totalTons: number;
  totalSpent: number;
  purchaseCount: number;
}

interface Purchase {
  id: number;
  tonsPurchased: number;
  pricePaid: number;
  purchasedAt: string;
  projectName: string;
  projectCategory: string;
  projectLocation: string;
}

export default function ImpactPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=/app/marketplace/impact");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("bearer_token");

      const impactResponse = await fetch("/api/marketplace/impact", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (impactResponse.ok) {
        const impactData = await impactResponse.json();
        setImpact(impactData.impact);
        setBreakdown(impactData.breakdown);
      }

      const purchasesResponse = await fetch("/api/marketplace/purchases", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json();
        setPurchases(purchasesData.purchases);
      }
    } catch (err) {
      console.error("Error fetching impact data:", err);
      setError("Your impact data could not be loaded.");
      toast.error("Failed to load impact data");
    } finally {
      setLoading(false);
    }
  };

  const hasImpact = impact && impact.totalTonsOffset > 0;

  const breakdownColumns: Column<Breakdown>[] = [
    { key: "category", header: "Category", render: (b) => <span className="capitalize">{b.category.replace("_", " ")}</span> },
    { key: "purchases", header: "Purchases", numeric: true, render: (b) => b.purchaseCount },
    { key: "tons", header: "Tons offset", numeric: true, render: (b) => b.totalTons.toLocaleString() },
    { key: "spent", header: "Spent", numeric: true, render: (b) => `\u20ac${b.totalSpent.toLocaleString()}` }
  ];

  const purchaseColumns: Column<Purchase>[] = [
    {
      key: "project",
      header: "Project",
      render: (p) => (
        <div>
          <p className="font-medium break-words">{p.projectName}</p>
          <p className="app-meta mt-0.5 break-words">{p.projectLocation}</p>
        </div>
      )
    },
    { key: "date", header: "Date", hideOnMobile: true, render: (p) => new Date(p.purchasedAt).toLocaleDateString() },
    { key: "tons", header: "Tons", numeric: true, render: (p) => p.tonsPurchased },
    { key: "paid", header: "Paid", numeric: true, render: (p) => `\u20ac${p.pricePaid.toLocaleString()}` }
  ];

  return (
    <PageShell
      loading={isPending || loading}
      error={error}
      onRetry={fetchData}
      header={
        <PageHeader
          title="Your impact"
          purpose="Track your contribution to global carbon reduction."
          breadcrumb={[{ label: "Marketplace", href: "/app/marketplace" }, { label: "Your impact" }]}
        />
      }
    >
      {!hasImpact ? (
        <Section>
          <EmptyState
            title="Start your impact journey"
            description="You haven't purchased any carbon offsets yet. Browse the marketplace to find projects that align with your values."
            action={{ label: "Browse projects", href: "/app/marketplace" }}
          />
        </Section>
      ) : (
        <>
          <Section title="Summary">
            <MetricRow columns={3}>
              <Metric label="Tons CO\u2082 offset" value={impact!.totalTonsOffset.toLocaleString()} />
              <Metric label="Total investment" value={`\u20ac${impact!.totalSpent.toLocaleString()}`} />
              <Metric label="Projects supported" value={impact!.projectsSupported} />
            </MetricRow>
          </Section>

          <Section title="Impact by category">
            <DataTable
              columns={breakdownColumns}
              rows={breakdown}
              rowKey={(b) => b.category}
              empty={<EmptyState title="No category breakdown yet" description="Purchase offsets across categories to see a breakdown here." />}
            />
          </Section>

          <Section title="Purchase history">
            <DataTable
              columns={purchaseColumns}
              rows={purchases}
              rowKey={(p) => String(p.id)}
              empty={<EmptyState title="No purchases yet" description="Your completed offset purchases will be listed here." />}
            />
          </Section>
        </>
      )}
    </PageShell>
  );
}
