"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { PageShell, PageHeader, Section, EmptyState } from "@/components/app/shell";

interface Lesson {
  id: number;
  moduleId: number;
  order: number;
  title: string;
  contentType: string;
  contentJson: string;
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

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [nextLessonId, setNextLessonId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [startTime] = useState(Date.now());

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.id && lessonId && courseId) {
      loadLesson();
      loadCourseStructure();
    }
  }, [session?.user?.id, lessonId, courseId]);

  const loadCourseStructure = async () => {
    if (!session?.user?.id) return;
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/learn/courses/${courseId}?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data: CourseData = await response.json();
        const allLessons: Array<{ id: number; moduleOrder: number; lessonOrder: number }> = [];
        data.modules.forEach((module) => {
          module.lessons.forEach((lesson) => {
            allLessons.push({ id: lesson.id, moduleOrder: module.order, lessonOrder: lesson.order });
          });
        });
        allLessons.sort((a, b) => (a.moduleOrder !== b.moduleOrder ? a.moduleOrder - b.moduleOrder : a.lessonOrder - b.lessonOrder));
        const currentIndex = allLessons.findIndex((l) => l.id === parseInt(lessonId));
        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
          setNextLessonId(allLessons[currentIndex + 1].id);
        }
      }
    } catch (error) {
      console.error("Failed to load course structure:", error);
    }
  };

  const loadLesson = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/learn/lessons/${lessonId}?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLesson(data);

        if (data.contentJson) {
          try {
            let parsed = typeof data.contentJson === "string" ? JSON.parse(data.contentJson) : data.contentJson;
            if (typeof parsed === "string") parsed = { text: parsed };
            setContentData(parsed);
          } catch (e) {
            console.error("Failed to parse content JSON:", e);
            const contentStr = typeof data.contentJson === "string" ? data.contentJson : JSON.stringify(data.contentJson);
            setContentData({ text: contentStr });
          }
        }
      } else {
        setError("This lesson could not be loaded.");
        toast.error("Failed to load lesson");
      }
    } catch (err) {
      console.error("Failed to load lesson:", err);
      setError("This lesson could not be loaded.");
      toast.error("Failed to load lesson");
    } finally {
      setIsLoading(false);
    }
  };

  const completeLesson = async (score?: number) => {
    if (!session?.user?.id || !lesson || lesson.completion) return;

    setIsCompleting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const token = localStorage.getItem("bearer_token");

      const response = await fetch(`/api/learn/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, timeSpent, score: score ?? null, passed: score !== undefined ? score >= 70 : null })
      });

      if (response.ok) {
        toast.success("Lesson completed!");
        await loadLesson();
      } else {
        const data = await response.json();
        if (data.code === "ALREADY_COMPLETED") {
          toast.info("You've already completed this lesson");
        } else {
          toast.error(data.error || "Failed to complete lesson");
        }
      }
    } catch (error) {
      console.error("Failed to complete lesson:", error);
      toast.error("Failed to complete lesson");
    } finally {
      setIsCompleting(false);
    }
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
      loading={isPending || isLoading}
      error={error}
      onRetry={loadLesson}
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
          <div className="app-card p-5 sm:p-8">
            {lesson.contentType === "text" && contentData.text && (
              <div
                className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: fixImageSrcInHtml(contentData.text) }}
              />
            )}

            {lesson.contentType === "video" && (lesson.videoUrl || contentData.videoUrl) && (
              <div className="space-y-4">
                <div className="app-card-inset overflow-hidden">
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
                      <p className="app-meta mt-1">Answer all questions below to complete this lesson. You need 70% or higher to pass.</p>
                    </div>

                    {contentData.questions.map((question, qIndex) => (
                      <div key={qIndex} className="app-card-inset p-4">
                        <p className="app-label mb-2">Question {qIndex + 1} of {contentData.questions?.length ?? 0}</p>
                        <p className="mb-4 text-sm font-medium">{question.question}</p>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <button
                              key={oIndex}
                              type="button"
                              onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))}
                              className={`w-full rounded-[0.375rem] border p-3 text-left text-sm transition-colors ${
                                selectedAnswers[qIndex] === oIndex
                                  ? "border-[var(--app-rule-strong)] bg-[var(--app-surface-3)]"
                                  : "border-[var(--app-rule)] hover:bg-[var(--app-surface-2)]"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-[var(--app-rule)] pt-4">
                      <p className="app-meta">
                        {Object.keys(selectedAnswers).length} of {contentData.questions?.length ?? 0} questions answered
                      </p>
                      <button
                        type="button"
                        onClick={submitQuiz}
                        disabled={Object.keys(selectedAnswers).length < (contentData.questions?.length ?? 0) || isCompleting}
                        className="app-btn"
                      >
                        {isCompleting ? "Submitting\u2026" : "Submit quiz"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="app-card-inset p-6 text-center">
                      <p className="app-metric text-3xl">{quizScore}%</p>
                      <h3 className="mt-2 text-[1.0625rem] font-semibold">
                        {quizScore >= 70 ? "You passed this quiz" : "Keep learning"}
                      </h3>
                      <p className="app-meta mt-1">
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
                            <div key={qIndex} className="app-card-inset p-4">
                              <p className="app-label mb-1">Question {qIndex + 1} \u00b7 {isCorrect ? "Correct" : "Incorrect"}</p>
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
                                          ? "border-[var(--app-rule-strong)]"
                                          : isSelected
                                            ? "border-destructive"
                                            : "border-[var(--app-rule)]"
                                      }`}
                                    >
                                      {option}
                                    </div>
                                  );
                                })}
                              </div>
                              {question.explanation && <p className="app-meta mt-2">{question.explanation}</p>}
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
                  <p className="app-meta mt-1">Complete these hands-on exercises to apply what you've learned.</p>
                </div>
                {contentData.exercises.map((exercise, index) => (
                  <div key={index} className="app-card-inset p-4">
                    <h3 className="text-sm font-semibold">{index + 1}. {exercise.title}</h3>
                    <p className="app-meta mt-1">{exercise.description}</p>
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
              <button type="button" onClick={() => completeLesson()} disabled={isCompleting} className="app-btn mt-6">
                {isCompleting ? "Saving\u2026" : "Mark as complete"}
              </button>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-[var(--app-rule)] pt-5">
              <button type="button" onClick={() => router.push(`/app/learn/${courseId}`)} className="app-btn-ghost app-btn">
                Back to course
              </button>

              {lesson.completion && nextLessonId && (
                <button type="button" onClick={goToNextLesson} className="app-btn">
                  Next lesson
                </button>
              )}

              {lesson.completion && !nextLessonId && (
                <button type="button" onClick={() => router.push(`/app/learn/${courseId}`)} className="app-btn">
                  Course complete
                </button>
              )}
            </div>
          </div>
        </Section>
      )}

      {lesson && !contentData && (
        <Section>
          <EmptyState title="This lesson has no content yet" description="Check back later once content has been generated." />
        </Section>
      )}
    </PageShell>
  );
}
