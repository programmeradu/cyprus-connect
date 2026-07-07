"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/app/AppHeader";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Search, Filter, X, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import NextImage from "next/image";

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
      router.push("/auth");
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
        toast.error("Failed to load courses");
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error("Failed to load courses");
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
      toast.info("Generating courses... This may take 2-3 minutes. Please wait.", {
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
        const error = await response.json().catch(() => ({ error: 'Failed to generate courses' }));
        toast.error(error.error || 'Failed to generate courses');
        return;
      }

      const data = await response.json();
      
      if (data.coursesGenerated > 0) {
        toast.success(`Successfully generated ${data.coursesGenerated} new course${data.coursesGenerated > 1 ? 's' : ''}!`);
      } else {
        toast.info(data.message || "No new courses needed at this time");
      }
      
      await loadCourses(); // Reload courses
    } catch (error) {
      console.error('Auto-generation failed:', error);
      toast.error('Failed to generate courses. Please try again.');
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
        toast.success("Successfully enrolled!");
        
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
          toast.info("You're already enrolled in this course");
          router.push(`/app/learn/${courseId}`);
        } else {
          toast.error(data.error || "Failed to enroll");
        }
      }
    } catch (error) {
      console.error("Failed to enroll:", error);
      toast.error("Failed to enroll in course");
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
        title="Learning Center"
        subtitle="AI-powered sustainability courses tailored for your business"
      />

      {/* AI Feature Banner */}
      {courses.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-xl p-6 mb-6 border-2 border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI-Powered Learning Center
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your learning center intelligently generates courses based on your company's emissions data, 
                insights, and recommendations. Courses are automatically created when gaps are detected 
                or when new sustainability challenges emerge.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold mb-1">📊 Data-Driven</p>
                  <p className="text-muted-foreground">Analyzes your emissions and metrics</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold mb-1">🎯 Personalized</p>
                  <p className="text-muted-foreground">Tailored to your industry & goals</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold mb-1">🖼️ Rich Content</p>
                  <p className="text-muted-foreground">Includes AI-generated videos & images</p>
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
                    Generating Courses...
                  </>
                ) : (
                  <>
                    <CustomAIGenerateIcon className="w-4 h-4" />
                    Generate My First Courses
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-strong rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CustomBookIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.filter(c => c.isEnrolled).length}</p>
              <p className="text-xs text-muted-foreground">Enrolled Courses</p>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-4">
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
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CustomAwardIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {courses.filter(c => c.isEnrolled && c.progress === 100).length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CustomGraduationIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-xs text-muted-foreground">Total Courses</p>
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
              : "glass-strong hover:bg-primary hover:text-primary-foreground"
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
                : "glass-strong hover:bg-muted/50"
            }`}
          >
            <Search className="w-4 h-4" />
            {searchQuery && <span className="hidden sm:inline">Searching...</span>}
          </button>
          
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="absolute right-0 top-full mt-2 w-72 glass-strong rounded-lg shadow-premium z-50"
              >
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search courses..."
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
                : "glass-strong hover:bg-muted/50"
            }`}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && <span className="hidden sm:inline">Active</span>}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="absolute right-0 top-full mt-2 w-72 glass-strong rounded-lg shadow-premium p-4 z-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedIndustry("all");
                        setSelectedDifficulty("all");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-2">Industry</label>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="all">All Industries</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-2">Difficulty</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
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
              <h2 className="text-lg font-bold">Continue Learning</h2>
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
                {enrolledCourses.length > 0 ? "Explore More Courses" : "Available Courses"}
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
          <div className="glass-strong rounded-xl p-12 text-center">
            <CustomBookIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground mb-4">No courses found</p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedIndustry("all");
                  setSelectedDifficulty("all");
                }}
                className="text-sm text-primary hover:underline"
              >
                Clear filters
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
      className="glass-strong rounded-xl overflow-hidden group cursor-pointer"
      onClick={onViewCourse}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
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
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
            <div className="flex items-center justify-between text-xs text-white mb-1">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
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
          <h3 className="font-bold text-sm line-clamp-2 flex-1">{course.title}</h3>
          {course.progress === 100 && (
            <CustomCheckIcon className="w-5 h-5 text-primary flex-shrink-0" />
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {course.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`text-[10px] px-2 py-1 rounded-full font-medium capitalize ${getDifficultyColor(
              course.difficultyLevel
            )}`}
          >
            {course.difficultyLevel}
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
            <span>{course.estimatedHours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <CustomModuleIcon className="w-3 h-3" />
            <span>{course.moduleCount} modules</span>
          </div>
          <div className="flex items-center gap-1">
            <CustomLessonIcon className="w-3 h-3" />
            <span>{course.lessonCount} lessons</span>
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
            Enroll Now
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
            {course.progress === 100 ? "Review Course" : "Continue Learning"}
          </button>
        )}
      </div>
    </motion.div>
  );
}