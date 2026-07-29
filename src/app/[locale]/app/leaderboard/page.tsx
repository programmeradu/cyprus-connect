"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app/AppHeader";
import { Badge } from "@/components/app/Badge";
import { TrophyIcon, LeafIcon, BoltIcon, FireIcon, WaterIcon } from "@/components/icons/CustomIcons";
import { useUser } from "@/lib/user-context";

export default function LeaderboardPage() {
  const t = useTranslations("dashboard.leaderboard");
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard?limit=50");
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
        
        // Find current user's rank
        if (user) {
          const userEntry = data.find((entry: any) => entry.userId === user.id);
          if (userEntry) {
            setUserRank(userEntry.rank);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'energy':
        return <BoltIcon className="w-3 h-3" />;
      case 'waste':
        return <FireIcon className="w-3 h-3" />;
      case 'water':
        return <WaterIcon className="w-3 h-3" />;
      default:
        return <LeafIcon className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <>
        <AppHeader
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const currentUser = user ? leaderboard.find((entry: any) => entry.userId === user.id) : null;

  return (
    <>
      <AppHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Your Rank Card */}
      {currentUser && (
        <motion.div
          className="surface-card p-5 mb-6 border-2 border-primary/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-lg font-semibold tabular-nums" style={{ fontFamily: 'var(--editorial-display)' }}>
                {String(currentUser.rank).padStart(2, '0')}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold">{currentUser.companyName || currentUser.name}</h3>
                  <Badge variant="primary" size="sm">{t("you")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("rankLine", { rank: currentUser.rank, credits: currentUser.totalCredits, actions: currentUser.actionsCompleted })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary mb-1">
                <span className="text-sm font-bold">{t("topPercent", { percent: Math.round((currentUser.rank / leaderboard.length) * 100) })}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{t("globally")}</p>
            </div>
          </div>
          
          {/* Recent Actions */}
          {currentUser.recentActions && currentUser.recentActions.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <p className="eyebrow mb-2">{t("recentActions")}</p>
              <div className="flex gap-2 flex-wrap">
                {currentUser.recentActions.map((action: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-lg text-xs"
                  >
                    {getCategoryIcon(action.category)}
                    <span className="text-foreground/80 min-w-0 break-words">{action.title}</span>
                    <span className="text-primary font-medium">+{action.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[topThree[1], topThree[0], topThree[2]].map((entry, idx) => {
            const position = idx === 1 ? 1 : idx === 0 ? 2 : 3;
            return (
              <motion.div
                key={entry.userId}
                className={`surface-card p-4 text-center ${position === 1 ? "mt-0" : "mt-6"}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className={`w-12 h-12 mx-auto rounded-md flex items-center justify-center mb-2 border ${
                  position === 1 ? "bg-primary/15 border-primary/40 text-primary" :
                  position === 2 ? "bg-muted border-foreground/20 text-foreground" :
 "bg-muted/60 border-foreground/15 text-foreground/70"
                }`}>
                  <span className="text-lg font-semibold tabular-nums" style={{ fontFamily: 'var(--editorial-display)' }}>{String(position).padStart(2, '0')}</span>
                </div>
                <p className="text-xs font-bold mb-1 break-words">{entry.companyName || entry.name}</p>
                <p className="text-[10px] text-muted-foreground mb-1">{t("podiumCredits", { credits: entry.totalCredits })}</p>
                <p className="text-[10px] text-primary font-medium">{t("podiumActions", { actions: entry.actionsCompleted })}</p>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <motion.div
        className="surface-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-bold mb-4">{t("globalRankings")}</h2>
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {t("empty")}
              </p>
            </div>
          ) : (
            leaderboard.map((entry, idx) => {
              const isCurrentUser = user && entry.userId === user.id;
              return (
                <motion.div
                  key={entry.userId}
                  className={`rounded-lg transition-all-smooth ${
                    isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/30 hover:bg-muted/50"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 text-sm font-bold text-muted-foreground">#{entry.rank}</div>
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-xs font-semibold tabular-nums border ${
                      isCurrentUser ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-foreground/10 text-muted-foreground"
                    }`} style={{ fontFamily: 'var(--editorial-display)' }}>
                      {String(entry.rank).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium min-w-0 break-words">{entry.companyName || entry.name}</p>
                        {isCurrentUser && <Badge variant="primary" size="sm">{t("you")}</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {t("creditsActions", { credits: entry.totalCredits, actions: entry.actionsCompleted })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Recent Actions for expanded view */}
                  {entry.recentActions && entry.recentActions.length > 0 && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="flex gap-1.5 flex-wrap">
                        {entry.recentActions.map((action: any, actionIdx: number) => (
                          <div
                            key={actionIdx}
                            className="flex items-center gap-1 px-2 py-0.5 bg-background/50 rounded text-[10px]"
                          >
                            {getCategoryIcon(action.category)}
                            <span className="text-foreground/70 min-w-0 break-words">{action.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </>
  );
}