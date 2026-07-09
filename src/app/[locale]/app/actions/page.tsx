"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app/AppHeader";
import { ActionCard } from "@/components/app/ActionCard";
import { Badge } from "@/components/app/Badge";
import { BulbIcon, BoltIcon, FireIcon, WaterIcon, LeafIcon, RecycleIcon, TargetIcon } from "@/components/icons/CustomIcons";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";

// Custom AI Generate Icon
const AIGenerateIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <motion.circle
      cx="12"
      cy="12"
      r="3"
      fill="currentColor"
      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.path
      d="M12 2L13.5 6.5L18 8L13.5 9.5L12 14L10.5 9.5L6 8L10.5 6.5L12 2Z"
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
    <motion.circle
      cx="19"
      cy="6"
      r="1.5"
      fill="currentColor"
      opacity="0.6"
      animate={{ y: [-1, 1, -1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.circle
      cx="5"
      cy="18"
      r="1"
      fill="currentColor"
      opacity="0.6"
      animate={{ y: [1, -1, 1] }}
      transition={{ duration: 1.8, repeat: Infinity }}
    />
  </svg>
);

// Mini Trend Chart Component
const MiniTrendChart = ({ data, color = "primary" }: { data: number[], color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 40" className="w-full h-10 mt-2" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <motion.polyline
        points={`0,100 ${points} 100,100`}
        fill={`url(#gradient-${color})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.polyline
        points={points}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
};

export default function ActionsPage() {
  const t = useTranslations("dashboard.actions");
  const { user, refetchUser } = useUser();
  const [filter, setFilter] = useState("all");
  const [dbActions, setDbActions] = useState<any[]>([]);
  const [completedActionIds, setCompletedActionIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmissions, setUserEmissions] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load actions and completed status on mount
  useEffect(() => {
    loadActions();
    if (user) {
      loadCompletedActions();
      loadUserEmissions();
    }
  }, [user]);

  // Reload actions when filter changes
  useEffect(() => {
    loadActions();
  }, [filter]);

  const loadActions = async () => {
    try {
      setIsLoading(true);
      // Pass userId to get both global and user-specific actions
      const url = filter === "all" 
        ? `/api/actions${user ? `?userId=${user.id}` : ""}`
        : `/api/actions?category=${filter}${user ? `&userId=${user.id}` : ""}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const actions = await response.json();
        const mappedActions = actions.map((action: any) => ({
          ...action,
          icon: getIconByName(action.iconName || "leaf"),
          isAI: action.isCustom && action.userId // Mark as AI if it's custom and has userId
        }));
        setDbActions(mappedActions);
      }
    } catch (error) {
      console.error("Failed to load actions:", error);
      toast.error(t("toast.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompletedActions = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/actions/user/${user.id}`);
      if (response.ok) {
        const completed = await response.json();
        const ids = completed.map((c: any) => c.actionId);
        setCompletedActionIds(ids);
      }
    } catch (error) {
      console.error("Failed to load completed actions:", error);
    }
  };

  const loadUserEmissions = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/emissions?userId=${user.id}&latest=true`);
      if (response.ok) {
        const emissions = await response.json();
        setUserEmissions(emissions);
      }
    } catch (error) {
      console.error("Failed to load emissions:", error);
    }
  };

  const generateAIActions = async () => {
    if (!user) {
      toast.error(t("toast.onboardFirst"));
      return;
    }

    setIsGenerating(true);
    
    try {
      // Check if user has substantial data to analyze
      if (!userEmissions) {
        toast.info(t("toast.needProfile"));
        setIsGenerating(false);
        return;
      }

      // Calculate completion rate
      const completionRate = totalActions > 0 ? (completedActionIds.length / totalActions) * 100 : 0;
      
      // If user has completed most actions, don't generate more
      if (completionRate > 80) {
        toast.success(t("toast.excellent"));
        setIsGenerating(false);
        return;
      }

      // Get list of existing action titles to avoid duplicates
      const existingTitles = dbActions.map(a => a.title.toLowerCase());

      // Prepare comprehensive user data for AI analysis
      const analysisData = {
        user: {
          id: user.id,
          name: user.name,
          companyName: user.companyName,
          industry: user.companyIndustry,
          teamSize: user.teamSize,
        },
        emissions: userEmissions,
        completedActionsCount: completedActionIds.length,
        totalCredits: user.totalCredits,
        availableActionsCount: availableCount,
        existingActionTitles: existingTitles
      };

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an expert sustainability advisor. Analyze the following company data and determine if personalized recommendations are needed.

Company Profile:
- Name: ${analysisData.user.companyName || 'Not specified'}
- Industry: ${analysisData.user.industry || 'Not specified'}
- Team Size: ${analysisData.user.teamSize || 'Not specified'}

Current Progress:
- Actions Completed: ${analysisData.completedActionsCount}
- Available Actions Remaining: ${analysisData.availableActionsCount}
- Total Credits Earned: ${analysisData.totalCredits}

Emissions Data:
${JSON.stringify(userEmissions, null, 2)}

Existing Actions (DO NOT DUPLICATE):
${existingTitles.join(', ')}

IMPORTANT RULES:
1. If emissions are already low/excellent and user has completed many actions, return an empty array []
2. Only recommend actions that DON'T already exist in the existing actions list
3. Focus on HIGH-IMPACT opportunities based on their emissions data
4. If no meaningful recommendations are possible, return []

Analyze the data and either:
- Return [] if everything is good or no new recommendations are needed
- Return 3-5 NEW, high-impact recommendations (not duplicates) if there are real opportunities

Return ONLY valid JSON (no markdown, no explanations):
[]
OR
[
  {
    "title": "Unique action title (max 60 chars, DIFFERENT from existing)",
    "description": "Detailed description (max 200 chars)",
    "impact": "medium|high",
    "category": "energy|waste|water|operations",
    "points": 100-500,
    "iconName": "bolt|fire|water|leaf|recycle|target|bulb",
    "estimatedSavings": "e.g., 500 kg CO2/year"
  }
]`,
          context: analysisData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const result = await response.json();
      
      // Parse the AI response
      let generatedActions = [];
      try {
        // Extract JSON from response
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedActions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        toast.error(t("toast.parseFailed"));
        return;
      }

      // If AI returned empty array, show appropriate message
      if (generatedActions.length === 0) {
        toast.success(t("toast.topShape"));
        setIsGenerating(false);
        return;
      }

      // Double-check for duplicates on client side
      const uniqueActions = generatedActions.filter((action: any) => {
        const titleLower = action.title.toLowerCase();
        return !existingTitles.some(existing => 
          titleLower.includes(existing) || existing.includes(titleLower)
        );
      });

      if (uniqueActions.length === 0) {
        toast.info(t("toast.allExist"));
        setIsGenerating(false);
        return;
      }

      // Save AI-generated actions to database
      const savedActions = [];
      for (const action of uniqueActions) {
        try {
          const saveResponse = await fetch('/api/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              title: action.title,
              description: action.description,
              category: action.category,
              impact: action.impact,
              difficulty: action.impact, // Use impact as difficulty
              points: action.points,
              iconName: action.iconName
            })
          });

          if (saveResponse.ok) {
            const savedAction = await saveResponse.json();
            savedActions.push(savedAction);
          }
        } catch (error) {
          console.error('Failed to save AI action:', error);
        }
      }

      if (savedActions.length > 0) {
        toast.success(t("toast.savedN", { count: savedActions.length }));
        // Reload actions to show the new AI-generated ones
        await loadActions();
      } else {
        toast.error(t("toast.saveFailed"));
      }
      
    } catch (error) {
      console.error("Failed to generate AI actions:", error);
      toast.error(t("toast.generateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const getIconByName = (name: string) => {
    const iconMap: any = {
      bolt: <BoltIcon className="w-4 h-4" />,
      fire: <FireIcon className="w-4 h-4" />,
      water: <WaterIcon className="w-4 h-4" />,
      leaf: <LeafIcon className="w-4 h-4" />,
      recycle: <RecycleIcon className="w-4 h-4" />,
      target: <TargetIcon className="w-4 h-4" />,
      bulb: <BulbIcon className="w-4 h-4" />
    };
    return iconMap[name] || <LeafIcon className="w-4 h-4" />;
  };

  // Calculate stats
  const totalActions = dbActions.length;
  const completedCount = completedActionIds.length;
  const availableCount = totalActions - completedCount;
  const aiActionsCount = dbActions.filter(a => a.isAI).length;

  // Mock trend data for stats cards
  const completedTrend = [2, 3, 4, 5, 7, completedCount];
  const availableTrend = [15, 14, 13, 12, 11, availableCount];
  const creditsTrend = [50, 120, 180, 250, 340, user?.totalCredits || 0];

  const handleCompleteAction = async (actionId: number, points: number) => {
    if (!user) {
      toast.error(t("toast.onboardFirst"));
      return;
    }

    if (completedActionIds.includes(actionId)) {
      toast.info(t("toast.already"));
      return;
    }

    try {
      const response = await fetch("/api/actions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          actionId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || t("toast.completeFailed"));
        return;
      }

      const result = await response.json();
      
      setCompletedActionIds([...completedActionIds, actionId]);
      
      await refetchUser();
      
      toast.success(t("toast.creditsEarned", { points }));
    } catch (error) {
      console.error("Failed to complete action:", error);
      toast.error(t("toast.generic"));
    }
  };

  if (isLoading && dbActions.length === 0) {
    return (
      <>
        <AppHeader
          title={t("title")}
          subtitle={t("subtitleLoad")}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  // Separate AI-generated and regular actions
  const aiActions = dbActions.filter(a => a.isAI);
  const regularActions = dbActions.filter(a => !a.isAI);

  return (
    <>
      <AppHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Stats Cards with Trend Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <motion.div 
          className="surface-card p-4 border border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">{t("completed")}</p>
          <p className="text-3xl font-bold mb-1">{completedCount}</p>
          <MiniTrendChart data={completedTrend} />
        </motion.div>
        <motion.div 
          className="surface-card p-4 border border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">{t("available")}</p>
          <p className="text-3xl font-bold mb-1">{availableCount}</p>
          <MiniTrendChart data={availableTrend} />
        </motion.div>
        <motion.div 
          className="surface-card p-4 border border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">{t("creditsEarned")}</p>
          <p className="text-3xl font-bold mb-1">{user?.totalCredits || 0}</p>
          <MiniTrendChart data={creditsTrend} />
        </motion.div>
      </div>

      {/* AI Generate Button + Filters - Combined on same line */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={generateAIActions}
          disabled={isGenerating || !user}
          className="glass-strong rounded-lg px-3 py-1.5 border border-primary/30 hover:border-primary/60 transition-all-smooth group disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <AIGenerateIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap">
            {isGenerating ? t("generating") : t("aiGenerate")}
          </span>
          {aiActionsCount > 0 && (
            <Badge className="ml-1 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
              {aiActionsCount}
            </Badge>
          )}
        </button>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {["all", "energy", "waste", "water", "operations"].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all-smooth ${
                filter === category
                  ? "bg-transparent text-foreground border border-primary shadow-md shadow-primary/10"
                  : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50 hover:border-border"
              }`}
            >
              {t(`filters.${category}` as any)}
            </button>
          ))}
        </div>
      </div>

      {/* AI Generated Actions Section */}
      {aiActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AIGenerateIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{t("aiSection")}</h2>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {t("aiBadge")}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiActions.map((action) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* AI Badge Indicator */}
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-card rounded-[4px] px-2 py-1 border border-primary/30 flex items-center gap-1">
                    <AIGenerateIcon className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-medium text-primary">AI</span>
                  </div>
                </div>
                <ActionCard
                  title={action.title}
                  description={action.description}
                  impact={action.impact}
                  icon={action.icon}
                  difficulty={action.difficulty}
                  points={action.points}
                  completed={completedActionIds.includes(action.id)}
                  onComplete={() => handleCompleteAction(action.id, action.points)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Regular Actions Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : regularActions.length === 0 && aiActions.length === 0 ? (
        <div className="text-center py-16">
          <LeafIcon className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : regularActions.length > 0 ? (
        <>
          {aiActions.length > 0 && (
            <h2 className="text-lg font-bold mb-4">{t("standardSection")}</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularActions.map((action) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ActionCard
                  title={action.title}
                  description={action.description}
                  impact={action.impact}
                  icon={action.icon}
                  difficulty={action.difficulty}
                  points={action.points}
                  completed={completedActionIds.includes(action.id)}
                  onComplete={() => handleCompleteAction(action.id, action.points)}
                />
              </motion.div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}