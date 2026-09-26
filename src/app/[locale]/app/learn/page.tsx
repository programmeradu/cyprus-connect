"use client";

import { useState, useEffect } from "react";
import { useWorkspaceResource, useWorkspaceAction } from "@/components/app/console/workspace-store";
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
  Empty,
  type DataTableColumn as Column
} from "@/components/app/console/kit";

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

  // Shared record: the course page and lessons refresh this list after each change.
  const coursesRes = useWorkspaceResource<Course[]>(session?.user?.id ? "/api/learn/courses" : null);
  const courses = coursesRes.data ?? [];
  const error = coursesRes.error ? t("toast.loadFailed") : null;
  const writer = useWorkspaceAction();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (writer.error) toast.error(writer.error);
  }, [writer.error]);

  const goGenerate = () => router.push("/app/learn/generate");

  /** Enrolling twice is fine on the server, so this is always one click. */
  const enrollInCourse = async (courseId: number) => {
    const ok = await writer.run(`/api/learn/courses/${courseId}/enroll`, { invalidates: ["/api/learn/courses"] });
    if (ok) router.push(`/app/learn/${courseId}`);
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
          <p className="vck-meta mt-0.5 break-words">{c.description}</p>
        </div>
      )
    },
    {
      key: "difficulty",
      header: "Difficulty",
      hideOnMobile: true,
      render: (c) => <span className="vck-tag capitalize">{c.difficultyLevel}</span>
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
          className="vck-btn"
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
      signedOut={!isPending && !session?.user}
      loading={isPending || coursesRes.loading}
      error={error}
      onRetry={coursesRes.reload}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          actions={
            <button type="button" className="vck-btn vck-btn-primary" onClick={goGenerate}>
              {t("generateFirst")}
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
              className="rounded-[0.375rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
            <Empty
              title={t("noCourses")}
              body="Generate a course tailored to your industry, or adjust your filters to see more results."
              action={
                hasActiveFilters
                  ? { label: t("clearFilters"), onClick: () => { setSearchQuery(""); setSelectedDifficulty("all"); } }
                  : { label: t("generateFirst"), onClick: goGenerate }
              }
            />
          }
        />
      </Section>
    </PageShell>
  );
}
