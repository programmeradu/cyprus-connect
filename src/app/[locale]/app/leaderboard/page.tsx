"use client";

import { ConsoleAvatar } from "@/components/app/console/ConsoleAvatar";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import { useTranslations } from "next-intl";
import { useUser } from "@/lib/user-context";
import {
  PageShell,
  PageHeader,
  Section,
  DataTable,
  Metric,
  MetricRow,
  Empty,
  DataTableColumn as Column
} from "@/components/app/console/kit";

interface LeaderboardEntry {
  userId: string;
  rank: number;
  name?: string;
  companyName?: string;
  totalCredits: number;
  actionsCompleted: number;
  recentActions?: { category: string; title: string; points: number }[];
}

export default function LeaderboardPage() {
  const t = useTranslations("dashboard.leaderboard");
  const { user } = useUser();
  const { data, error, loading: isLoading, reload: loadLeaderboard } =
    useWorkspaceResource<LeaderboardEntry[]>("/api/leaderboard?limit=50");
  const leaderboard = data ?? [];

  const currentUser = user ? leaderboard.find((entry) => entry.userId === user.id) : null;
  const topThree = leaderboard.slice(0, 3);

  const columns: Column<LeaderboardEntry>[] = [
    {
      key: "rank",
      header: t("globalRankings"),
      numeric: true,
      width: "4rem",
      render: (row) => <span className="vck-num">#{row.rank}</span>
    },
    {
      key: "name",
      header: "Company",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <ConsoleAvatar seed={row.companyName || row.name || "vuneli"} size={28} styleKey="shapes" alt="" />
          <div className="min-w-0">
          <p className="font-medium break-words">{row.companyName || row.name}</p>
          {user && row.userId === user.id && (
            <span className="vck-tag mt-1" data-tone="positive">{t("you")}</span>
          )}
          </div>
        </div>
      )
    },
    {
      key: "credits",
      header: "Credits",
      numeric: true,
      render: (row) => <span>{row.totalCredits.toLocaleString()}</span>
    },
    {
      key: "actions",
      header: "Actions",
      numeric: true,
      hideOnMobile: true,
      render: (row) => <span>{row.actionsCompleted}</span>
    }
  ];

  return (
    <PageShell
      loading={isLoading}
      error={error}
      onRetry={loadLeaderboard}
      header={<PageHeader title={t("title")} purpose={t("subtitle")} />}
    >
      {currentUser && (
        <Section title="Your standing">
          <MetricRow columns={3}>
            <Metric label="Rank" value={`#${currentUser.rank}`} note={t("globally")} />
            <Metric label="Credits" value={currentUser.totalCredits.toLocaleString()} />
            <Metric
              label="Top percentile"
              value={t("topPercent", { percent: Math.round((currentUser.rank / leaderboard.length) * 100) })}
            />
          </MetricRow>
        </Section>
      )}

      {topThree.length >= 3 && (
        <Section title="Top three">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {topThree.map((entry) => (
              <div key={entry.userId} className="vck-card p-4">
                <div className="mb-2 flex items-center gap-2.5">
                  <ConsoleAvatar seed={entry.companyName || entry.name || "vuneli"} size={32} styleKey="shapes" alt="" />
                  <p className="vck-label">#{entry.rank}</p>
                </div>
                <p className="text-sm font-medium break-words mb-1">{entry.companyName || entry.name}</p>
                <p className="vck-meta">{t("podiumCredits", { credits: entry.totalCredits })}</p>
                <p className="vck-meta">{t("podiumActions", { actions: entry.actionsCompleted })}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={t("globalRankings")}>
        <DataTable
          columns={columns}
          rows={leaderboard}
          rowKey={(row) => row.userId}
          empty={
            <Empty
              title="No companies on the leaderboard yet"
              body="Complete sustainability actions to earn green credits and appear here once other companies join."
            />
          }
        />
      </Section>
    </PageShell>
  );
}
