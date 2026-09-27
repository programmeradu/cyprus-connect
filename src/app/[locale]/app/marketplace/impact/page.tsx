"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
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
  category: string | null;
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
  const t = useTranslations("dashboard.marketplace.impact");
  const tm = useTranslations("dashboard.marketplace");
  const nl = useLocale() === "el" ? "el-CY" : "en-GB";
  const catLabel = (c: string | null) => (c && tm.has(`categories.${c}` as any) ? tm(`categories.${c}` as any) : (c ?? "—").replace(/_/g, " "));
  const eur = (n: number) => Number(n).toLocaleString(nl, { style: "currency", currency: "EUR" });
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
  const error = impactRes.error || purchasesRes.error ? t("loadFailed") : null;
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
    { key: "category", header: tm("colCategory"), render: (b) => catLabel(b.category) },
    { key: "purchases", header: t("colPurchases"), numeric: true, render: (b) => Number(b.purchaseCount).toLocaleString(nl) },
    { key: "tons", header: t("colTons"), numeric: true, render: (b) => Number(b.totalTons).toLocaleString(nl) },
    { key: "spent", header: t("colSpent"), numeric: true, render: (b) => eur(b.totalSpent) }
  ];

  const purchaseColumns: Column<Purchase>[] = [
    {
      key: "project",
      header: tm("colProject"),
      render: (p) => (
        <div>
          <p className="font-medium break-words">{p.projectName}</p>
          <p className="vck-meta mt-0.5 break-words">{p.projectLocation}</p>
        </div>
      )
    },
    { key: "date", header: t("colDate"), hideOnMobile: true, render: (p) => new Date(p.purchasedAt).toLocaleDateString(nl) },
    { key: "tons", header: t("colTonsShort"), numeric: true, render: (p) => Number(p.tonsPurchased).toLocaleString(nl) },
    { key: "paid", header: t("colPaid"), numeric: true, render: (p) => eur(p.pricePaid) }
  ];

  return (
    <PageShell
      signedOut={!isPending && !session?.user}
      loading={isPending || (!!session?.user && loading)}
      error={error}
      onRetry={fetchData}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("purpose")}
          breadcrumb={[{ label: tm("detail.marketplace"), href: "/app/marketplace" }, { label: t("title") }]}
        />
      }
    >
      {!hasImpact ? (
        <Section>
          <Empty
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={{ label: t("browse"), href: "/app/marketplace" }}
          />
        </Section>
      ) : (
        <>
          <Section title={t("summary")}>
            <MetricRow columns={3}>
              <Metric label={t("tonsOffset")} value={Number(impact!.totalTonsOffset).toLocaleString(nl)} />
              <Metric label={t("investment")} value={eur(impact!.totalSpent)} />
              <Metric label={t("supported")} value={impact!.projectsSupported} />
            </MetricRow>
          </Section>

          <Section title={t("byCategory")}>
            <DataTable
              columns={breakdownColumns}
              rows={breakdown}
              rowKey={(b) => b.category ?? "none"}
              empty={<Empty title={t("noBreakdownTitle")} body={t("noBreakdownBody")} />}
            />
          </Section>

          <Section title={t("history")}>
            <DataTable
              columns={purchaseColumns}
              rows={purchases}
              rowKey={(p) => String(p.id)}
              empty={<Empty title={t("noPurchasesTitle")} body={t("noPurchasesBody")} />}
            />
          </Section>
        </>
      )}
    </PageShell>
  );
}
