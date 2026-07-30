"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
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

interface Lesson {
  id: number;
  moduleId: number;
  order: number;
  title: string;
  contentType: string;
  estimatedMinutes: number;
  isCompleted?: boolean;
}

interface Module {
  id: number;
  courseId: number;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  industry: string;
  difficultyLevel: string;
  estimatedHours: number;
  thumbnailUrl: string | null;
  isEnrolled: boolean;
  progress: number;
  enrolledAt: string | null;
  modules: Module[];
}

export default function CourseDetailsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.id && courseId) {
      loadCourseDetails();
    }
  }, [session?.user?.id, courseId]);

  const loadCourseDetails = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/learn/courses/${courseId}?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        setError("This course could not be loaded.");
        toast.error("Failed to load course details");
      }
    } catch (err) {
      console.error("Failed to load course details:", err);
      setError("This course could not be loaded.");
      toast.error("Failed to load course details");
    } finally {
      setIsLoading(false);
    }
  };

  const startLesson = (lessonId: number) => {
    router.push(`/app/learn/${courseId}/lesson/${lessonId}`);
  };

  const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  const completedCount = course?.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0) ?? 0;
  const progressPercentage = course?.progress || 0;
  const totalMinutes = course?.modules.reduce((acc, m) => acc + m.lessons.reduce((a, l) => a + (l.estimatedMinutes || 0), 0), 0) ?? 0;
  const totalHours = Math.ceil(totalMinutes / 60);

  const allLessons = course?.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))
  ) ?? [];

  const lessonColumns: Column<Lesson & { moduleTitle: string }>[] = [
    {
      key: "title",
      header: "Lesson",
      render: (l) => (
        <div>
          <p className="font-medium break-words">{l.title}</p>
          <p className="app-meta mt-0.5 break-words">{l.moduleTitle}</p>
        </div>
      )
    },
    { key: "type", header: "Type", hideOnMobile: true, render: (l) => <span className="app-tag capitalize">{l.contentType}</span> },
    { key: "minutes", header: "Minutes", numeric: true, render: (l) => l.estimatedMinutes },
    { key: "status", header: "Status", numeric: true, render: (l) => (l.isCompleted ? "Done" : "\u2013") }
  ];

  return (
    <PageShell
      signedOut={!isPending && !session?.user}
      loading={isPending || (!!session?.user && isLoading)}
      error={error}
      onRetry={loadCourseDetails}
      header={
        <PageHeader
          title={course?.title ?? "Course"}
          purpose={course?.description}
          breadcrumb={[{ label: "Learn", href: "/app/learn" }, { label: course?.title ?? "" }]}
          actions={
            course?.isEnrolled && progressPercentage < 100 ? (
              <button
                type="button"
                className="app-btn"
                onClick={() => {
                  for (const m of course.modules) {
                    for (const l of m.lessons) {
                      if (!l.isCompleted) {
                        startLesson(l.id);
                        return;
                      }
                    }
                  }
                }}
              >
                Continue learning
              </button>
            ) : undefined
          }
        />
      }
    >
      {course && (
        <>
          <Section title="Overview">
            <MetricRow columns={4}>
              <Metric label="Modules" value={course.modules.length} />
              <Metric label="Lessons" value={totalLessons} />
              <Metric label="Completed" value={completedCount} />
              <Metric label="Total time" value={`${totalHours}h`} />
            </MetricRow>
            {course.isEnrolled && (
              <p className="app-meta mt-3">{Math.round(progressPercentage)}% complete \u00b7 {completedCount} / {totalLessons} lessons</p>
            )}
          </Section>

          <Section title="Curriculum">
            <DataTable
              columns={lessonColumns}
              rows={allLessons}
              rowKey={(l) => String(l.id)}
              onRowClick={(l) => startLesson(l.id)}
              empty={<EmptyState title="No lessons yet" description="This course does not have any published lessons yet." />}
            />
          </Section>
        </>
      )}
    </PageShell>
  );
}
