"use client";

import { useEffect } from "react";
import { useWorkspaceResource, useWorkspaceAction } from "@/components/app/console/workspace-store";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
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
  const t = useTranslations("dashboard.learnPages.course");
  const locale = useLocale();

  // Shared record: the library, this page and each lesson read the same copy.
  const courseRes = useWorkspaceResource<Course>(session?.user?.id && courseId ? `/api/learn/courses/${courseId}` : null);
  const course = courseRes.data ?? null;
  const error = courseRes.error ? t("loadError") : null;
  const writer = useWorkspaceAction();

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (writer.error) toast.error(writer.error);
  }, [writer.error]);

  const firstOpenLesson = () => {
    for (const m of course?.modules ?? []) for (const l of m.lessons) if (!l.isCompleted) return l.id;
    return course?.modules[0]?.lessons[0]?.id ?? null;
  };

  /** One click: enrol (idempotent on the server) and open the first lesson. */
  const startCourse = async () => {
    const ok = await writer.run(`/api/learn/courses/${courseId}/enroll`, { invalidates: ["/api/learn/courses"] });
    if (!ok) return;
    const first = firstOpenLesson();
    if (first) startLesson(first);
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
      header: t("colLesson"),
      render: (l) => (
        <div>
          <p className="font-medium break-words">{l.title}</p>
          <p className="vck-meta mt-0.5 break-words">{l.moduleTitle}</p>
        </div>
      )
    },
    { key: "type", header: t("colType"), hideOnMobile: true, render: (l) => <span className="vck-tag capitalize">{l.contentType}</span> },
    { key: "minutes", header: t("colMinutes"), numeric: true, render: (l) => l.estimatedMinutes },
    { key: "status", header: t("colStatus"), numeric: true, render: (l) => (l.isCompleted ? t("done") : "\u2013") }
  ];

  return (
    <PageShell
      signedOut={!isPending && !session?.user}
      loading={isPending || courseRes.loading}
      error={error}
      onRetry={courseRes.reload}
      header={
        <PageHeader
          title={course?.title ?? t("fallbackTitle")}
          purpose={course?.description}
          breadcrumb={[{ label: t("crumbLearn"), href: "/app/learn" }, { label: course?.title ?? "" }]}
          actions={
            !course || totalLessons === 0 ? undefined : !course.isEnrolled ? (
              <button type="button" className="vck-btn vck-btn-primary" disabled={writer.busy} onClick={startCourse}>
                {writer.busy ? t("starting") : t("start")}
              </button>
            ) : progressPercentage < 100 ? (
              <button
                type="button"
                className="vck-btn vck-btn-primary"
                onClick={() => {
                  const next = firstOpenLesson();
                  if (next) startLesson(next);
                }}
              >
                {t("continue")}
              </button>
            ) : undefined
          }
        />
      }
    >
      {course && (
        <>
          <Section title={t("overview")}>
            <MetricRow columns={4}>
              <Metric label={t("modules")} value={course.modules.length} />
              <Metric label={t("lessons")} value={totalLessons} />
              <Metric label={t("completed")} value={completedCount} />
              <Metric label={t("totalTime")} value={t("hoursShort", { count: totalHours })} />
            </MetricRow>
            {course.isEnrolled && (
              <p className="vck-meta mt-3">{t("progress", { percent: Math.round(progressPercentage), done: completedCount, total: totalLessons })}</p>
            )}
          </Section>

          {locale === "el" && <p className="vck-meta">{t("aiNote")}</p>}

          <Section title={t("curriculum")}>
            <DataTable
              columns={lessonColumns}
              rows={allLessons}
              rowKey={(l) => String(l.id)}
              onRowClick={(l) => startLesson(l.id)}
              empty={<Empty title={t("noLessons")} body={t("noLessonsBody")} />}
            />
          </Section>
        </>
      )}
    </PageShell>
  );
}
