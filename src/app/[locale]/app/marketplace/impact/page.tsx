"use client";

import { useEffect } from "react";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
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
  const signedIn = !!session?.user;
  const impactRes = useWorkspaceResource<{ impact: ImpactData | null; breakdown: Breakdown[] }>(
    signedIn ? "/api/marketplace/impact" : null,
  );
  const purchasesRes = useWorkspaceResource<{ purchases: Purchase[] }>(
    signedIn ? "/api/marketplace/purchases" : null,
  );
  const impact = impactRes.data?.impact ?? null;
  const breakdown = impactRes.data?.breakdown ?? [];
  const purchases = purchasesRes.data?.purchases ?? [];
  const loading = impactRes.loading || purchasesRes.loading;
  const error = impactRes.error || purchasesRes.error ? "Your impact data could not be loaded." : null;
  const fetchData = () => {
    impactRes.reload();
    purchasesRes.reload();
  };

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=/app/marketplace/impact");
    }
  }, [session, isPending, router]);

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
          <p className="vck-meta mt-0.5 break-words">{p.projectLocation}</p>
        </div>
      )
    },
    { key: "date", header: "Date", hideOnMobile: true, render: (p) => new Date(p.purchasedAt).toLocaleDateString() },
    { key: "tons", header: "Tons", numeric: true, render: (p) => p.tonsPurchased },
    { key: "paid", header: "Paid", numeric: true, render: (p) => `\u20ac${p.pricePaid.toLocaleString()}` }
  ];

  return (
    <PageShell
      signedOut={!isPending && !session?.user}
      loading={isPending || (!!session?.user && loading)}
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
          <Empty
            title="Start your impact journey"
            body="You haven't purchased any carbon offsets yet. Browse the marketplace to find projects that align with your values."
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
              empty={<Empty title="No category breakdown yet" body="Purchase offsets across categories to see a breakdown here." />}
            />
          </Section>

          <Section title="Purchase history">
            <DataTable
              columns={purchaseColumns}
              rows={purchases}
              rowKey={(p) => String(p.id)}
              empty={<Empty title="No purchases yet" body="Your completed offset purchases will be listed here." />}
            />
          </Section>
        </>
      )}
    </PageShell>
  );
}
