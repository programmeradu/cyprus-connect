"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkspaceResource, useWorkspaceAction } from "@/components/app/console/workspace-store";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { PageShell, PageHeader, Section, Empty } from "@/components/app/console/kit";

interface Lesson {
  id: number;
  moduleId: number;
  order: number;
  title: string;
  contentType: string;
  contentJson: unknown;
  videoUrl: string | null;
  estimatedMinutes: number;
  completion: { completedAt: string; timeSpent: number; score: number } | null;
}

interface ContentData {
  text?: string;
  videoUrl?: string;
  imageUrl?: string;
  questions?: Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string }>;
  exercises?: Array<{ title: string; description: string; tasks: string[] }>;
}

interface Module {
  id: number;
  order: number;
  lessons: Array<{ id: number; order: number; title: string }>;
}

interface CourseData {
  modules: Module[];
}

const fixImageSrcInHtml = (html: string): string => {
  if (!html) return html;
  return html.replace(/src=["'](\{.+?\})["']/g, (match, jsonStr) => {
    try {
      const cleanJson = jsonStr.replace(/\\"/g, '"');
      const parsed = JSON.parse(cleanJson);
      if (parsed.url) return `src="${parsed.url}"`;
    } catch (e) {
      console.error("Failed to parse image src JSON:", jsonStr, e);
    }
    return match;
  });
};

export default function LessonViewerPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const uid = session?.user?.id;
  // Shared records: the course page and this lesson read the same copies.
  const lessonRes = useWorkspaceResource<Lesson>(uid && lessonId ? `/api/learn/lessons/${lessonId}` : null);
  const courseRes = useWorkspaceResource<CourseData>(uid && courseId ? `/api/learn/courses/${courseId}` : null);
  const writer = useWorkspaceAction();
  const lesson = lessonRes.data ?? null;
  const error = lessonRes.error ? "This lesson could not be loaded." : null;
  const isCompleting = writer.busy;
  const [startTime] = useState(Date.now());

  // The server cleans lesson HTML; a bare string becomes a text lesson.
  const contentData = useMemo<ContentData | null>(() => {
    const raw = lesson?.contentJson;
    if (raw == null) return null;
    if (typeof raw === "string") return { text: raw };
    return typeof raw === "object" ? (raw as ContentData) : null;
  }, [lesson?.contentJson]);

  const nextLessonId = useMemo(() => {
    const data = courseRes.data;
    if (!data?.modules) return null;
    const ordered = [...data.modules]
      .sort((x, y) => x.order - y.order)
      .flatMap((m) => [...m.lessons].sort((x, y) => x.order - y.order).map((l) => l.id));
    const i = ordered.indexOf(parseInt(lessonId));
    return i !== -1 && i < ordered.length - 1 ? ordered[i + 1] : null;
  }, [courseRes.data, lessonId]);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isPending, router]);

  const completeLesson = async (score?: number) => {
    if (!uid || !lesson || lesson.completion || writer.busy) return;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const ok = await writer.run(`/api/learn/lessons/${lessonId}/complete`, {
      body: { timeSpent, score: score ?? null, passed: score !== undefined ? score >= 70 : null },
      invalidates: ["/api/learn/lessons", "/api/learn/courses", "/api/learn/certificates"],
    });
    if (ok) toast.success("Lesson completed");
  };

  const goToNextLesson = () => {
    if (nextLessonId) {
      router.push(`/app/learn/${courseId}/lesson/${nextLessonId}`);
    } else {
      router.push(`/app/learn/${courseId}`);
    }
  };

  const submitQuiz = () => {
    if (!contentData?.questions) return;
    let correct = 0;
    contentData.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / contentData.questions.length) * 100);
    setQuizScore(score);
    setShowResults(true);
    completeLesson(score);
  };

  return (
    <PageShell
      loading={isPending || lessonRes.loading}
      error={error}
      onRetry={lessonRes.reload}
      header={
        <PageHeader
          title={lesson?.title ?? "Lesson"}
          purpose={lesson ? `${lesson.contentType} \u00b7 ${lesson.estimatedMinutes} min` : undefined}
          breadcrumb={[
            { label: "Learn", href: "/app/learn" },
            { label: "Course", href: `/app/learn/${courseId}` },
            { label: lesson?.title ?? "" }
          ]}
        />
      }
    >
      {lesson && contentData && (
        <Section>
          <div className="vck-card p-5 sm:p-8">
            {lesson.contentType === "text" && contentData.text && (
              <div
                className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: fixImageSrcInHtml(contentData.text) }}
              />
            )}

            {lesson.contentType === "video" && (lesson.videoUrl || contentData.videoUrl) && (
              <div className="space-y-4">
                <div className="vck-inset overflow-hidden">
                  <video src={lesson.videoUrl || contentData.videoUrl} controls className="w-full" />
                </div>
                {contentData.text && (
                  <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: contentData.text }} />
                )}
              </div>
            )}

            {lesson.contentType === "quiz" && contentData.questions && (
              <div className="space-y-6">
                {!showResults ? (
                  <>
                    <div>
                      <h2 className="text-[1.0625rem] font-semibold">Quiz assessment</h2>
                      <p className="vck-meta mt-1">Answer all questions below to complete this lesson. You need 70% or higher to pass.</p>
                    </div>

                    {contentData.questions.map((question, qIndex) => (
                      <div key={qIndex} className="vck-inset p-4">
                        <p className="vck-label mb-2">Question {qIndex + 1} of {contentData.questions?.length ?? 0}</p>
                        <p className="mb-4 text-sm font-medium">{question.question}</p>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <button
                              key={oIndex}
                              type="button"
                              onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))}
                              className={`w-full rounded-[0.375rem] border p-3 text-left text-sm transition-colors ${
                                selectedAnswers[qIndex] === oIndex
                                  ? "border-[var(--vc-rule)] bg-[var(--vc-rail-active)]"
                                  : "border-[var(--vc-rule-soft)] hover:bg-[var(--vc-well)]"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-[var(--vc-rule-soft)] pt-4">
                      <p className="vck-meta">
                        {Object.keys(selectedAnswers).length} of {contentData.questions?.length ?? 0} questions answered
                      </p>
                      <button
                        type="button"
                        onClick={submitQuiz}
                        disabled={Object.keys(selectedAnswers).length < (contentData.questions?.length ?? 0) || isCompleting}
                        className="vck-btn vck-btn-primary"
                      >
                        {isCompleting ? "Submitting\u2026" : "Submit quiz"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="vck-inset p-6 text-center">
                      <p className="vck-num text-3xl">{quizScore}%</p>
                      <h3 className="mt-2 text-[1.0625rem] font-semibold">
                        {quizScore >= 70 ? "You passed this quiz" : "Keep learning"}
                      </h3>
                      <p className="vck-meta mt-1">
                        {quizScore >= 70
                          ? "You've passed this quiz and completed the lesson."
                          : "You need 70% to pass. Review the material and try again."}
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-3 text-[1.0625rem] font-semibold">Review your answers</h3>
                      <div className="space-y-3">
                        {contentData.questions.map((question, qIndex) => {
                          const isCorrect = selectedAnswers[qIndex] === question.correctAnswer;
                          return (
                            <div key={qIndex} className="vck-inset p-4">
                              <p className="vck-label mb-1">Question {qIndex + 1} \u00b7 {isCorrect ? "Correct" : "Incorrect"}</p>
                              <p className="mb-3 text-sm font-medium">{question.question}</p>
                              <div className="space-y-1.5">
                                {question.options.map((option, oIndex) => {
                                  const isSelected = selectedAnswers[qIndex] === oIndex;
                                  const isCorrectOption = oIndex === question.correctAnswer;
                                  return (
                                    <div
                                      key={oIndex}
                                      className={`rounded-[0.375rem] border px-3 py-2 text-sm ${
                                        isCorrectOption
                                          ? "border-[var(--vc-rule)]"
                                          : isSelected
                                            ? "border-destructive"
                                            : "border-[var(--vc-rule-soft)]"
                                      }`}
                                    >
                                      {option}
                                    </div>
                                  );
                                })}
                              </div>
                              {question.explanation && <p className="vck-meta mt-2">{question.explanation}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {lesson.contentType === "exercise" && contentData.exercises && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[1.0625rem] font-semibold">Practical exercises</h2>
                  <p className="vck-meta mt-1">Complete these hands-on exercises to apply what you've learned.</p>
                </div>
                {contentData.exercises.map((exercise, index) => (
                  <div key={index} className="vck-inset p-4">
                    <h3 className="text-sm font-semibold">{index + 1}. {exercise.title}</h3>
                    <p className="vck-meta mt-1">{exercise.description}</p>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {exercise.tasks.map((task, tIndex) => (
                        <li key={tIndex}>{task}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {!lesson.completion && lesson.contentType !== "quiz" && (
              <button type="button" onClick={() => completeLesson()} disabled={isCompleting} className="vck-btn vck-btn-primary mt-6">
                {isCompleting ? "Saving\u2026" : "Mark as complete"}
              </button>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-[var(--vc-rule-soft)] pt-5">
              <button type="button" onClick={() => router.push(`/app/learn/${courseId}`)} className="vck-btn">
                Back to course
              </button>

              {lesson.completion && nextLessonId && (
                <button type="button" onClick={goToNextLesson} className="vck-btn vck-btn-primary">
                  Next lesson
                </button>
              )}

              {lesson.completion && !nextLessonId && (
                <button type="button" onClick={() => router.push(`/app/learn/${courseId}`)} className="vck-btn vck-btn-primary">
                  Course complete
                </button>
              )}
            </div>
          </div>
        </Section>
      )}

      {lesson && !contentData && (
        <Section>
          <Empty title="This lesson has no content yet" body="Check back later once content has been generated." />
        </Section>
      )}
    </PageShell>
  );
}
