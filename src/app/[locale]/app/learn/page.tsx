"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  MetricRow,
  Metric,
  DataTable,
  EmptyState,
  type Column
} from "@/components/app/shell";

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
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

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

  const loadCourses = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/learn/courses?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        setError(t("toast.loadFailed"));
        toast.error(t("toast.loadFailed"));
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError(t("toast.loadFailed"));
      toast.error(t("toast.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAutoGeneration = async () => {
    if (!session?.user?.id) return;

    setIsAutoGenerating(true);
    try {
      const token = localStorage.getItem("bearer_token");

      const metricsResponse = await fetch(`/api/dashboard/metrics?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let emissionsData = null;
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        emissionsData = metricsData.latest_emissions;
      }

      toast.info(t("toast.generatingInfo"), { duration: 10000 });

      const response = await fetch("/api/learn/auto-generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: session.user.id,
          recommendations: [],
          insights: [],
          complianceGaps: [],
          emissionsData,
          trigger: "manual"
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: t("toast.generateFail") }));
        toast.error(err.error || t("toast.generateFail"));
        return;
      }

      const data = await response.json();

      if (data.coursesGenerated > 0) {
        toast.success(t("toast.generatedN", { count: data.coursesGenerated, plural: data.coursesGenerated > 1 ? "s" : "" }));
      } else {
        toast.info(data.message || t("toast.noNewNeeded"));
      }

      await loadCourses();
    } catch (error) {
      console.error("Auto-generation failed:", error);
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
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isEnrolled: true, progress: 0 } : c));
        router.push(`/app/learn/${courseId}`);
      } else {
        const data = await response.json();
        if (data.code === "ALREADY_ENROLLED") {
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

  let filteredCourses = courses;
  if (searchQuery) {
    filteredCourses = filteredCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (selectedDifficulty !== "all") {
    filteredCourses = filteredCourses.filter((c) => c.difficultyLevel === selectedDifficulty);
  }

  const hasActiveFilters = Boolean(searchQuery) || selectedDifficulty !== "all";
  const enrolledCourses = courses.filter((c) => c.isEnrolled);
  const avgProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / enrolledCourses.length)
    : 0;

  const columns: Column<Course>[] = [
    {
      key: "title",
      header: "Course",
      render: (c) => (
        <div>
          <p className="font-medium break-words">{c.title}</p>
          <p className="app-meta mt-0.5 break-words">{c.description}</p>
        </div>
      )
    },
    {
      key: "difficulty",
      header: "Difficulty",
      hideOnMobile: true,
      render: (c) => <span className="app-tag capitalize">{c.difficultyLevel}</span>
    },
    {
      key: "lessons",
      header: "Lessons",
      numeric: true,
      hideOnMobile: true,
      render: (c) => c.lessonCount
    },
    {
      key: "hours",
      header: "Hours",
      numeric: true,
      render: (c) => c.estimatedHours
    },
    {
      key: "progress",
      header: "Progress",
      numeric: true,
      render: (c) => (c.isEnrolled ? `${c.progress ?? 0}%` : "\u2013")
    },
    {
      key: "action",
      header: "",
      render: (c) => (
        <button
          type="button"
          className="app-btn-ghost app-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (c.isEnrolled) {
              router.push(`/app/learn/${c.id}`);
            } else {
              enrollInCourse(c.id);
            }
          }}
        >
          {c.isEnrolled ? t("continueCourse") : t("enrollNow")}
        </button>
      )
    }
  ];

  return (
    <PageShell
      loading={isPending || isLoading}
      error={error}
      onRetry={loadCourses}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          actions={
            <button type="button" className="app-btn" onClick={triggerAutoGeneration} disabled={isAutoGenerating}>
              {isAutoGenerating ? t("generatingCourses") : t("generateFirst")}
            </button>
          }
        />
      }
      toolbar={
        <PageToolbar
          meta={
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPh")}
              className="rounded-[0.375rem] border border-[var(--app-rule)] bg-[var(--app-surface-1)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          }
        >
          <ToolbarTabs
            ariaLabel={t("difficulty")}
            value={selectedDifficulty}
            onChange={setSelectedDifficulty}
            options={[
              { value: "all", label: t("allLevels") },
              { value: "beginner", label: t("beginner") },
              { value: "intermediate", label: t("intermediate") },
              { value: "advanced", label: t("advanced") }
            ]}
          />
        </PageToolbar>
      }
    >
      <Section title="Your progress">
        <MetricRow columns={4}>
          <Metric label={t("enrolledCourses")} value={enrolledCourses.length} />
          <Metric label={t("avgProgress")} value={`${avgProgress}%`} />
          <Metric label={t("completedStat")} value={courses.filter(c => c.isEnrolled && c.progress === 100).length} />
          <Metric label={t("totalCourses")} value={courses.length} />
        </MetricRow>
      </Section>

      <Section title="Courses">
        <DataTable
          columns={columns}
          rows={filteredCourses}
          rowKey={(c) => String(c.id)}
          onRowClick={(c) => router.push(`/app/learn/${c.id}`)}
          empty={
            <EmptyState
              title={t("noCourses")}
              description="Generate a course tailored to your industry, or adjust your filters to see more results."
              action={
                hasActiveFilters
                  ? { label: t("clearFilters"), onClick: () => { setSearchQuery(""); setSelectedDifficulty("all"); } }
                  : { label: t("generateFirst"), onClick: triggerAutoGeneration }
              }
            />
          }
        />
      </Section>
    </PageShell>
  );
}
