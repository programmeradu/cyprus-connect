"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/app/AppHeader";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  Play,
  FileText,
  Video,
  ClipboardCheck
} from "lucide-react";
import { toast } from "sonner";

interface Lesson {
  id: number;
  moduleId: number;
  order: number;
  title: string;
  contentType: string;
  contentJson: string;
  videoUrl: string | null;
  estimatedMinutes: number;
  completion: {
    completedAt: string;
    timeSpent: number;
    score: number;
  } | null;
}

interface ContentData {
  text?: string;
  videoUrl?: string;
  imageUrl?: string;
  questions?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  exercises?: Array<{
    title: string;
    description: string;
    tasks: string[];
  }>;
}

interface Module {
  id: number;
  order: number;
  lessons: Array<{
    id: number;
    order: number;
    title: string;
  }>;
}

interface CourseData {
  modules: Module[];
}

// Helper function to fix malformed image src attributes in HTML content
const fixImageSrcInHtml = (html: string): string => {
  if (!html) return html;
  
  // Match src attributes that contain JSON objects
  // Use non-greedy matching to capture the entire JSON object from { to }
  return html.replace(/src=["'](\{.+?\})["']/g, (match, jsonStr) => {
    try {
      // The JSON may have escaped quotes like {\"url\":\"...\"}
      // Unescape them to get valid JSON
      const cleanJson = jsonStr.replace(/\\"/g, '"');
      const parsed = JSON.parse(cleanJson);
      
      if (parsed.url) {
        return `src="${parsed.url}"`;
      }
    } catch (e) {
      console.error('Failed to parse image src JSON:', jsonStr, e);
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
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [nextLessonId, setNextLessonId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth");
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
      const response = await fetch(
        `/api/learn/courses/${courseId}?userId=${session.user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCourseData(data);
        
        // Find next lesson
        const allLessons: Array<{ id: number; moduleOrder: number; lessonOrder: number }> = [];
        data.modules.forEach((module: Module) => {
          module.lessons.forEach((lesson: any) => {
            allLessons.push({
              id: lesson.id,
              moduleOrder: module.order,
              lessonOrder: lesson.order
            });
          });
        });
        
        // Sort by module order, then lesson order
        allLessons.sort((a, b) => {
          if (a.moduleOrder !== b.moduleOrder) {
            return a.moduleOrder - b.moduleOrder;
          }
          return a.lessonOrder - b.lessonOrder;
        });
        
        // Find current lesson index and get next
        const currentIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
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
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(
        `/api/learn/lessons/${lessonId}?userId=${session.user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLesson(data);
        
        if (data.contentJson) {
          try {
            // Try to parse as JSON first
            let parsed = typeof data.contentJson === 'string' 
              ? JSON.parse(data.contentJson) 
              : data.contentJson;
            
            // Ensure it's a proper ContentData object
            if (typeof parsed === 'string') {
              // If still a string after parsing, wrap it
              parsed = { text: parsed };
            }
            
            setContentData(parsed);
          } catch (e) {
            console.error("Failed to parse content JSON:", e);
            // If parsing fails, treat as plain text
            const contentStr = typeof data.contentJson === 'string' 
              ? data.contentJson 
              : JSON.stringify(data.contentJson);
            setContentData({ text: contentStr });
          }
        }
      } else {
        toast.error("Failed to load lesson");
        router.push(`/app/learn/${courseId}`);
      }
    } catch (error) {
      console.error("Failed to load lesson:", error);
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
        headers: {
          Authorization: `Bearer ${token}`,
 "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: session.user.id,
          timeSpent,
          score: score ?? null,
          passed: score !== undefined ? score >= 70 : null
        })
      });

      if (response.ok) {
        toast.success("Lesson completed!");
        
        // Reload lesson to get completion data
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
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / contentData.questions.length) * 100);
    setQuizScore(score);
    setShowResults(true);
    
    completeLesson(score);
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case "video":
        return <Video className="w-5 h-5" />;
      case "quiz":
        return <ClipboardCheck className="w-5 h-5" />;
      case "text":
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user || !lesson || !contentData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => router.push(`/app/learn/${courseId}`)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all mb-8 group px-3 py-1.5 rounded-lg hover:bg-muted/50 w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Course
        </button>

        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border">
            {getContentIcon(lesson.contentType)}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-primary">
                {lesson.contentType}
              </span>
              {lesson.completion && (
                <span className="eyebrow text-chart-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{lesson.estimatedMinutes} min read</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {lesson.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="surface-card p-8 md:p-12  relative overflow-hidden">
          {/* Decorative background gradient */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          {/* Text Content */}
          {lesson.contentType === "text" && contentData.text && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div 
                className="prose prose-lg max-w-none dark:prose-invert
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                  prose-h1:text-5xl prose-h1:mt-20 prose-h1:mb-12 prose-h1:leading-tight prose-h1:font-extrabold
                  prose-h2:text-4xl prose-h2:mt-24 prose-h2:mb-12 prose-h2:pb-8 prose-h2:border-b-4 prose-h2:border-primary/30 prose-h2:font-extrabold
                  prose-h3:text-3xl prose-h3:mt-20 prose-h3:mb-10 prose-h3:font-extrabold
                  prose-h4:text-2xl prose-h4:mt-16 prose-h4:mb-8 prose-h4:font-bold
                  prose-p:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-12 prose-p:mt-0 prose-p:font-normal
                  prose-strong:text-foreground prose-strong:font-extrabold
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-semibold prose-a:transition-all
                  prose-ul:my-12 prose-ul:space-y-6 prose-ul:pl-10
                  prose-ol:my-12 prose-ol:space-y-6 prose-ol:pl-10
                  prose-li:text-muted-foreground prose-li:leading-relaxed prose-li:mb-5 prose-li:text-xl prose-li:font-normal
                  prose-li>p:mb-3 prose-li>p:mt-3 prose-li>p:font-normal
                  [&_ol>li::marker]:font-extrabold [&_ol>li::marker]:text-primary [&_ol>li::marker]:text-[1.15em]
                  prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border-4 prose-img:border-border prose-img:my-20 prose-img:w-full
                  prose-blockquote:border-l-8 prose-blockquote:border-l-primary prose-blockquote:bg-muted/60 prose-blockquote:py-10 prose-blockquote:px-12 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:my-16 prose-blockquote:text-foreground prose-blockquote:text-xl prose-blockquote:font-medium
                  prose-code:text-primary prose-code:bg-muted/50 prose-code:px-3 prose-code:py-2 prose-code:rounded-lg prose-code:text-base prose-code:font-mono prose-code:font-semibold
                  prose-pre:bg-muted prose-pre:border-2 prose-pre:border-border prose-pre:rounded-2xl prose-pre:p-10 prose-pre:my-16
                  [&>*:first-child]:mt-0
                  [&>*:last-child]:mb-0
                  [&>h1+p]:mt-10
                  [&>h2+p]:mt-8
                  [&>h3+p]:mt-6
                  [&>p+p]:mt-10
                  [&>ul+p]:mt-10
                  [&>p+ul]:mt-8
                  [&>ol+p]:mt-10
                  [&>p+ol]:mt-8
                  [&>p+h2]:mt-20
                  [&>p+h3]:mt-16
                  [&>ul+h2]:mt-20
                  [&>ul+h3]:mt-16"
                dangerouslySetInnerHTML={{ __html: fixImageSrcInHtml(contentData.text) }} 
              />
            </motion.div>
          )}

          {/* Video Content */}
          {lesson.contentType === "video" && (lesson.videoUrl || contentData.videoUrl) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="relative aspect-video bg-black/90 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <video
                  src={lesson.videoUrl || contentData.videoUrl}
                  controls
                  className="w-full h-full"
                />
              </div>
              {contentData.text && (
                <div className="prose prose-lg max-w-none dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground">
                  <div dangerouslySetInnerHTML={{ __html: contentData.text }} />
                </div>
              )}
            </motion.div>
          )}

          {/* Quiz Content */}
          {lesson.contentType === "quiz" && contentData.questions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {!showResults ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Quiz Assessment</h2>
                    <p className="text-sm text-muted-foreground">
                      Answer all questions below to complete this lesson. You need 70% or higher to pass.
                    </p>
                  </div>

                  {contentData.questions.map((question, qIndex) => (
                    <div key={qIndex} className="p-6 bg-muted/30 rounded-xl border border-border">
                      <p className="font-bold text-base mb-4 text-foreground">
                        Question {qIndex + 1} of {contentData.questions?.length ?? 0}
                      </p>
                      <p className="text-base mb-4 text-foreground leading-relaxed">
                        {question.question}
                      </p>
                      <div className="space-y-3">
                        {question.options.map((option, oIndex) => (
                          <button
                            key={oIndex}
                            onClick={() =>
                              setSelectedAnswers(prev => ({ ...prev, [qIndex]: oIndex }))
                            }
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all text-sm ${
                              selectedAnswers[qIndex] === oIndex
                                ? "border-primary bg-primary/10 shadow-lg"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                selectedAnswers[qIndex] === oIndex
                                  ? "border-primary bg-primary"
                                  : "border-border"
                              }`}>
                                {selectedAnswers[qIndex] === oIndex && (
                                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                )}
                              </div>
                              <span className="flex-1">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                    <div className="text-sm">
                      <span className="font-semibold">{Object.keys(selectedAnswers).length}</span>
                      <span className="text-muted-foreground"> of {contentData.questions?.length ?? 0} questions answered</span>
                    </div>
                    <button
                      onClick={submitQuiz}
                      disabled={
                        Object.keys(selectedAnswers).length < (contentData.questions?.length ?? 0) ||
                        isCompleting
                      }
                      className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Submit Quiz
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Results Summary */}
                  <div className={`text-center p-8 rounded-2xl border-2 ${
                    quizScore >= 70 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-yellow-500/10 border-yellow-500/30"
                  }`}>
                    <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      quizScore >= 70
                        ? "bg-green-500/20"
                        : "bg-yellow-500/20"
                    }`}>
                      <span className={`text-3xl font-black ${
                        quizScore >= 70
                          ? "text-green-500"
                          : "text-yellow-500"
                      }`}>
                        {quizScore}%
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      {quizScore >= 70 ? "Congratulations! 🎉" : "Keep Learning! 📚"}
                    </h3>
                    <p className="text-base text-muted-foreground">
                      {quizScore >= 70 
                        ? "You've passed this quiz and completed the lesson!" 
                        : `You need 70% to pass. Review the material and try again.`}
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-8 text-sm">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {contentData.questions.filter((q, i) => selectedAnswers[i] === q.correctAnswer).length}
                        </p>
                        <p className="text-muted-foreground">Correct</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-muted-foreground">
                          {contentData.questions.length - contentData.questions.filter((q, i) => selectedAnswers[i] === q.correctAnswer).length}
                        </p>
                        <p className="text-muted-foreground">Incorrect</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-4">Review Your Answers</h3>
                    <div className="space-y-4">
                      {contentData.questions.map((question, qIndex) => {
                        const isCorrect = selectedAnswers[qIndex] === question.correctAnswer;
                        return (
                          <div
                            key={qIndex}
                            className={`p-6 rounded-xl border-2 ${
                              isCorrect 
                                ? "border-green-500/30 bg-green-500/5" 
                                : "border-red-500/30 bg-red-500/5"
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isCorrect
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-red-500/20 text-red-500"
                              }`}>
                                {isCorrect ? "✓" : "✗"}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm text-muted-foreground mb-1">
                                  Question {qIndex + 1}
                                </p>
                                <p className="font-semibold text-base text-foreground">
                                  {question.question}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {question.options.map((option, oIndex) => {
                                const isSelected = selectedAnswers[qIndex] === oIndex;
                                const isCorrectOption = oIndex === question.correctAnswer;
                                
                                return (
                                  <div
                                    key={oIndex}
                                    className={`p-3 rounded-lg border text-sm ${
                                      isCorrectOption
                                        ? "border-green-500 bg-green-500/10"
                                        : isSelected
                                        ? "border-red-500 bg-red-500/10"
                                        : "border-border bg-muted/20"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{option}</span>
                                      {isCorrectOption && (
                                        <span className="text-xs text-green-500 font-bold px-2 py-1 bg-green-500/20 rounded">
                                          ✓ CORRECT
                                        </span>
                                      )}
                                      {isSelected && !isCorrectOption && (
                                        <span className="text-xs text-red-500 font-bold px-2 py-1 bg-red-500/20 rounded">
                                          ✗ YOUR ANSWER
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {question.explanation && (
                              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-2">
                                  <span>💡</span> EXPLANATION
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Exercise Content */}
          {lesson.contentType === "exercise" && contentData.exercises && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Practical Exercises</h2>
                <p className="text-sm text-muted-foreground">
                  Complete these hands-on exercises to apply what you've learned.
                </p>
              </div>

              {contentData.exercises.map((exercise, index) => (
                <div key={index} className="p-6 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{exercise.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {exercise.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-14 space-y-3">
                    <p className="text-sm font-semibold text-foreground mb-2">Tasks to Complete:</p>
                    {exercise.tasks.map((task, tIndex) => (
                      <div key={tIndex} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Complete Lesson Button */}
          {!lesson.completion && lesson.contentType !== "quiz" && !isCompleting && (
            <button
              onClick={() => completeLesson()}
              disabled={isCompleting}
              className="w-full mt-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Complete
            </button>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-border/50 relative">
            <button
              onClick={() => router.push(`/app/learn/${courseId}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-all text-sm font-medium group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Course
            </button>
            
            {lesson.completion && nextLessonId && (
              <button
                onClick={goToNextLesson}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all text-sm font-medium shadow-lg shadow-primary/20 group"
              >
                Next Lesson
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
            
            {lesson.completion && !nextLessonId && (
              <button
                onClick={() => router.push(`/app/learn/${courseId}`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all text-sm font-medium shadow-lg shadow-primary/20 group"
              >
                <CheckCircle2 className="w-4 h-4" />
                Course Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}