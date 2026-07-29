"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app/AppHeader";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Search, Filter, X, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import NextImage from "next/image";
import { APP_OPEN_ACCESS } from "@/lib/open-access";

// Custom Premium Icons
const CustomBookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <path d="M4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4" stroke="url(#bookGrad)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 4h12v12H6z" fill="currentColor" fillOpacity="0.1"/>
    <path d="M9 8h6M9 11h6M9 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 4c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2" stroke="url(#bookGrad)" strokeWidth="1.5"/>
    <circle cx="17" cy="6" r="2" fill="currentColor" fillOpacity="0.3"/>
  </svg>
);

const CustomProgressIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fillOpacity="0.05" fill="currentColor"/>
    <path d="M12 2a10 10 0 0 1 8.66 5" stroke="url(#progressGrad)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 8l2-2M19 8l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CustomAwardIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="awardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="9" r="6" stroke="url(#awardGrad)" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
    <path d="M8.5 13l-2 8 5.5-3 5.5 3-2-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="9" r="3" fill="currentColor" fillOpacity="0.3"/>
    <path d="M12 7l.5 1.5L14 9l-1.5.5L12 11l-.5-1.5L10 9l1.5-.5z" fill="currentColor"/>
  </svg>
);

const CustomGraduationIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <path d="M2 9l10-5 10 5-10 5L2 9z" stroke="url(#gradGrad)" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
    <path d="M6 10.5v4c0 1 2 2.5 6 2.5s6-1.5 6-2.5v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M22 9v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="22" cy="17" r="1" fill="currentColor"/>
  </svg>
);

const CustomPlayIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05"/>
    <path d="M10 8l6 4-6 4z" fill="url(#playGrad)"/>
    <circle cx="12" cy="12" r="10" stroke="url(#playGrad)" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.3"/>
  </svg>
);

const CustomSparklesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <path d="M12 2l1.5 4L18 7.5l-4.5 1.5L12 13l-1.5-4.5L6 7.5l4.5-1.5z" fill="url(#sparkGrad)"/>
    <path d="M19 12l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="currentColor" opacity="0.6"/>
    <path d="M7 16l.5 1.5L9 18l-1.5.5L7 20l-.5-1.5L5 18l1.5-.5z" fill="currentColor" opacity="0.4"/>
  </svg>
);

const CustomAIGenerateIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    {/* Central neural node */}
    <circle cx="12" cy="12" r="3" fill="url(#aiGrad)" />
    {/* Orbiting nodes */}
    <circle cx="12" cy="5" r="1.5" fill="currentColor" opacity="0.8" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" opacity="0.8" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" opacity="0.8" />
    <circle cx="5" cy="12" r="1.5" fill="currentColor" opacity="0.8" />
    {/* Connecting lines */}
    <path d="M12 8.5V9M12 15v.5M14.5 12H15M9 12h-.5" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
    {/* Energy pulses */}
    <path d="M12 5L13 8M19 12L16 13M12 19L11 16M5 12L8 11" stroke="currentColor" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
    {/* Outer ring */}
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.3" />
  </svg>
);

const CustomClockIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
    <path d="M12 6v6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CustomModuleIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
    <rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
    <rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
    <rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
  </svg>
);

const CustomLessonIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6l8 6-8 6z" fill="currentColor" opacity="0.8"/>
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const CustomCheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#checkGrad)" opacity="0.2"/>
    <path d="M7 12l3 3 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="url(#checkGrad)" strokeWidth="1.5"/>
  </svg>
);

interface Course {
  id: number;
  title: string;
  description: string;
  industry: string;
  difficultyLevel: string;
  estimatedHours: number;
  isPublished: boolean;
  thumbnailUrl: string | null;
  moduleCount: number;
  lessonCount: number;
  isEnrolled?: boolean;
  progress?: number;
}

export default function LearnPage() {
  const t = useTranslations("dashboard.learn");
  const tc = useTranslations("common");
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadCourses();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedIndustry, selectedDifficulty, courses]);

  const loadCourses = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/learn/courses?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        setFilteredCourses(data);
      } else {
        toast.error(t("toast.loadFailed"));
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error(t("toast.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedIndustry !== "all") {
      filtered = filtered.filter((course) => course.industry === selectedIndustry);
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((course) => course.difficultyLevel === selectedDifficulty);
    }

    setFilteredCourses(filtered);
  };

  const triggerAutoGeneration = async () => {
    if (!session?.user?.id) return;

    setIsAutoGenerating(true);
    try {
      const token = localStorage.getItem("bearer_token");
      
      // Get latest dashboard metrics for context
      const metricsResponse = await fetch(`/api/dashboard/metrics?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let emissionsData = null;
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        emissionsData = metricsData.latest_emissions;
      }

      // Show progress message since this can take a while
      toast.info(t("toast.generatingInfo"), {
        duration: 10000
      });

      const response = await fetch('/api/learn/auto-generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user.id,
          recommendations: [],
          insights: [],
          complianceGaps: [],
          emissionsData,
          trigger: 'manual'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: t("toast.generateFail") }));
        toast.error(error.error || t("toast.generateFail"));
        return;
      }

      const data = await response.json();
      
      if (data.coursesGenerated > 0) {
        toast.success(t("toast.generatedN", { count: data.coursesGenerated, plural: data.coursesGenerated > 1 ? "s" : "" }));
      } else {
        toast.info(data.message || t("toast.noNewNeeded"));
      }
      
      await loadCourses(); // Reload courses
    } catch (error) {
      console.error('Auto-generation failed:', error);
      toast.error(t("toast.generateFail"));
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const enrollInCourse = async (courseId: number) => {
    if (!session?.user?.id) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/learn/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
 "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId: session.user.id })
      });

      if (response.ok) {
        toast.success(t("toast.enrolledOk"));
        
        // Update local state to reflect enrollment immediately
        setCourses(prevCourses =>
          prevCourses.map(c =>
            c.id === courseId ? { ...c, isEnrolled: true, progress: 0 } : c
          )
        );
        
        // Navigate to course page
        router.push(`/app/learn/${courseId}`);
      } else {
        const data = await response.json();
        if (data.code === 'ALREADY_ENROLLED') {
          toast.info(t("toast.alreadyEnrolled"));
          router.push(`/app/learn/${courseId}`);
        } else {
          toast.error(data.error || t("toast.enrollFail"));
        }
      }
    } catch (error) {
      console.error("Failed to enroll:", error);
      toast.error(t("toast.enrollFail"));
    }
  };

  const getDifficultyColor = (level: string) => {
    if (!level) return "text-muted-foreground bg-muted";
    
    switch (level.toLowerCase()) {
      case "beginner":
        return "text-green-500 bg-green-500/10";
      case "intermediate":
        return "text-yellow-500 bg-yellow-500/10";
      case "advanced":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const industries = Array.from(new Set(courses.map((c) => c.industry).filter(Boolean)));
  const enrolledCourses = filteredCourses.filter((c) => c.isEnrolled);
  const availableCourses = filteredCourses.filter((c) => !c.isEnrolled);
  
  const hasActiveFilters = searchQuery || selectedIndustry !== "all" || selectedDifficulty !== "all";

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <AppHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* AI Feature Banner */}
      {courses.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card p-6 mb-6 border-2 border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t("aiCenter")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("aiCenterBody")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold mb-1">{t("dataDrivenTitle")}</p>
                  <p className="text-muted-foreground">{t("dataDrivenBody")}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold mb-1">{t("personalizedTitle")}</p>
                  <p className="text-muted-foreground">{t("personalizedBody")}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold mb-1">{t("richTitle")}</p>
                  <p className="text-muted-foreground">{t("richBody")}</p>
                </div>
              </div>
              <button
                onClick={triggerAutoGeneration}
                disabled={isAutoGenerating}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isAutoGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("generatingCourses")}
                  </>
                ) : (
                  <>
                    <CustomAIGenerateIcon className="w-4 h-4" />
                    {t("generateFirst")}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CustomBookIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.filter(c => c.isEnrolled).length}</p>
              <p className="text-xs text-muted-foreground">{t("enrolledCourses")}</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CustomProgressIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {courses.filter(c => c.isEnrolled).length > 0
                  ? Math.round(
                      courses.filter(c => c.isEnrolled).reduce((acc, c) => acc + (c.progress || 0), 0) /
                        courses.filter(c => c.isEnrolled).length
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">{t("avgProgress")}</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CustomAwardIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {courses.filter(c => c.isEnrolled && c.progress === 100).length}
              </p>
              <p className="text-xs text-muted-foreground">{t("completedStat")}</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CustomGraduationIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-xs text-muted-foreground">{t("totalCourses")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Search & Filters - Right Aligned */}
      <div className="flex justify-end items-center gap-2 mb-6">
        {/* Smart Generate Button */}
        <button
          onClick={triggerAutoGeneration}
          disabled={isAutoGenerating}
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            isAutoGenerating
              ? "bg-primary text-primary-foreground opacity-70"
              : "app-card hover:bg-primary hover:text-primary-foreground"
          }`}
          title="Smart Generate Courses"
        >
          {isAutoGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CustomAIGenerateIcon className="w-4 h-4" />
          )}
        </button>

        {/* Search Button */}
        <div className="relative">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              showSearch || searchQuery
                ? "bg-primary text-primary-foreground"
                : "app-card hover:bg-muted/50"
            }`}
          >
            <Search className="w-4 h-4" />
            {searchQuery && <span className="hidden sm:inline">{t("searching")}</span>}
          </button>
          
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="absolute right-0 top-full mt-2 w-72 app-overlay z-50"
              >
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("searchPh")}
                      autoFocus
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? "bg-primary text-primary-foreground"
                : "app-card hover:bg-muted/50"
            }`}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && <span className="hidden sm:inline">{t("active")}</span>}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="absolute right-0 top-full mt-2 w-72 app-overlay p-4 z-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">{tc("filters")}</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedIndustry("all");
                        setSelectedDifficulty("all");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tc("clearAll")}
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-2">{t("industryFilter")}</label>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="all">{t("allIndustries")}</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2">{t("difficulty")}</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="all">{t("allLevels")}</option>
                      <option value="beginner">{t("beginner")}</option>
                      <option value="intermediate">{t("intermediate")}</option>
                      <option value="advanced">{t("advanced")}</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Courses Display - Premium Free-flowing Grid */}
      <div className="space-y-8">
        {/* Continue Learning Section */}
        {enrolledCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CustomPlayIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{t("continueLearning")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {enrolledCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={true}
                  onEnroll={enrollInCourse}
                  onViewCourse={() => router.push(`/app/learn/${course.id}`)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Courses Section */}
        {availableCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CustomSparklesIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">
                {enrolledCourses.length > 0 ? t("exploreMore") : t("available")}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={false}
                  onEnroll={enrollInCourse}
                  onViewCourse={() => router.push(`/app/learn/${course.id}`)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="surface-card p-12 text-center">
            <CustomBookIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground mb-4">{t("noCourses")}</p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedIndustry("all");
                  setSelectedDifficulty("all");
                }}
                className="text-sm text-primary hover:underline"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

interface CourseCardProps {
  course: Course;
  isEnrolled: boolean;
  onEnroll: (courseId: number) => void;
  onViewCourse: () => void;
  index?: number;
}

function CourseCard({ course, isEnrolled, onEnroll, onViewCourse, index = 0 }: CourseCardProps) {
  const t = useTranslations("dashboard.learn");
  const getDifficultyColor = (level: string) => {
    if (!level) return "text-muted-foreground bg-muted";
    
    switch (level.toLowerCase()) {
      case "beginner":
        return "text-green-500 bg-green-500/10";
      case "intermediate":
        return "text-yellow-500 bg-yellow-500/10";
      case "advanced":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  // Parse thumbnailUrl if it's a JSON string
  const getThumbnailUrl = () => {
    if (!course.thumbnailUrl) return null;
    
    // If it's already a valid URL, return it
    if (course.thumbnailUrl.startsWith('http://') || course.thumbnailUrl.startsWith('https://')) {
      return course.thumbnailUrl;
    }
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(course.thumbnailUrl);
      if (parsed.url) {
        return parsed.url;
      }
    } catch (error) {
      console.error('Failed to parse thumbnailUrl:', course.thumbnailUrl);
    }
    
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="surface-card overflow-hidden group cursor-pointer"
      onClick={onViewCourse}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-primary/10 flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <CustomGraduationIcon className="w-16 h-16 text-primary opacity-50" />
        )}
        {isEnrolled && course.progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 backdrop-blur-sm p-2">
            <div className="flex items-center justify-between text-xs text-primary-foreground mb-1">
              <span>{t("progress")}</span>
              <span>{course.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-background/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm break-words flex-1">{course.title}</h3>
          {course.progress === 100 && (
            <CustomCheckIcon className="w-5 h-5 text-primary flex-shrink-0" />
          )}
        </div>

        <p className="text-xs text-muted-foreground break-words mb-3">
          {course.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`text-[10px] px-2 py-1 rounded-full font-medium capitalize ${getDifficultyColor(
              course.difficultyLevel
            )}`}
          >
            {course.difficultyLevel && ["beginner","intermediate","advanced"].includes(course.difficultyLevel.toLowerCase()) ? t(course.difficultyLevel.toLowerCase() as any) : course.difficultyLevel}
          </span>
          {course.industry && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium capitalize">
              {course.industry}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <CustomClockIcon className="w-3 h-3" />
            <span>{t("hours", { value: course.estimatedHours })}</span>
          </div>
          <div className="flex items-center gap-1">
            <CustomModuleIcon className="w-3 h-3" />
            <span>{t("modules", { count: course.moduleCount })}</span>
          </div>
          <div className="flex items-center gap-1">
            <CustomLessonIcon className="w-3 h-3" />
            <span>{t("lessons", { count: course.lessonCount })}</span>
          </div>
        </div>

        {!isEnrolled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnroll(course.id);
            }}
            className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors"
          >
            {t("enrollNow")}
          </button>
        )}

        {isEnrolled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewCourse();
            }}
            className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors"
          >
            {course.progress === 100 ? t("reviewCourse") : t("continueCourse")}
          </button>
        )}
      </div>
    </motion.div>
  );
}