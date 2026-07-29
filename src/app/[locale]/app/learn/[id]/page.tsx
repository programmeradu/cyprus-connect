"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/app/AppHeader";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import {
  BookOpen,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  FileText,
  Video,
  ClipboardCheck,
  Award,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import NextImage from "next/image";
import { APP_OPEN_ACCESS } from "@/lib/open-access";

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
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

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
        setCourse(data);
        
        // Expand first module by default
        if (data.modules && data.modules.length > 0) {
          setExpandedModules(new Set([data.modules[0].id]));
        }
      } else {
        toast.error("Failed to load course details");
        router.push("/app/learn");
      }
    } catch (error) {
      console.error("Failed to load course details:", error);
      toast.error("Failed to load course details");
    } finally {
      setIsLoading(false);
    }
  };

  // Parse thumbnailUrl if it's a JSON string
  const getThumbnailUrl = () => {
    if (!course?.thumbnailUrl) return null;
    
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

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const startLesson = (lessonId: number) => {
    router.push(`/app/learn/${courseId}/lesson/${lessonId}`);
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "quiz":
        return <ClipboardCheck className="w-4 h-4" />;
      case "text":
        return <FileText className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
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

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user || !course) {
    return null;
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = course.modules.reduce((acc, m) => 
    acc + m.lessons.filter(l => l.isCompleted).length, 0
  );
  const progressPercentage = course.progress || 0;
  
  // Calculate total hours from all lessons
  const totalMinutes = course.modules.reduce((acc, module) => {
    return acc + module.lessons.reduce((lessonAcc, lesson) => {
      return lessonAcc + (lesson.estimatedMinutes || 0);
    }, 0);
  }, 0);
  const totalHours = Math.ceil(totalMinutes / 60);

  const thumbnailUrl = getThumbnailUrl();

  return (
    <>
      <AppHeader title="Course Details" subtitle={course.title} />

      <div className="space-y-4">
        <button
          onClick={() => router.push("/app/learn")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Courses
        </button>

        {/* Course Title Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="text-sm text-muted-foreground">{course.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content - Course Overview */}
          <div className="lg:col-span-2 space-y-4">
            {/* Course Info */}
            <div className="surface-card p-4">
              {/* Course Thumbnail */}
              {thumbnailUrl && (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                  <img
                    src={thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getDifficultyColor(
                    course.difficultyLevel
                  )}`}
                >
                  {course.difficultyLevel}
                </span>
                {course.industry && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium capitalize">
                    {course.industry}
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {totalHours}h total
                </span>
              </div>

              {/* Progress Bar */}
              {course.isEnrolled && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium">Your Progress</span>
                    <span className="text-muted-foreground">
                      {completedCount} / {totalLessons} lessons completed
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {Math.round(progressPercentage)}% complete
                  </p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-primary">{course.modules.length}</p>
                  <p className="text-xs text-muted-foreground">Modules</p>
                </div>
                <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-primary">{totalLessons}</p>
                  <p className="text-xs text-muted-foreground">Lessons</p>
                </div>
                <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-primary">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </div>

            {/* Course Curriculum */}
            <div className="surface-card p-4">
              <h2 className="text-base font-bold mb-3">Course Curriculum</h2>

              <div className="space-y-2">
                {course.modules.map((module, moduleIndex) => (
                  <div
                    key={module.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {moduleIndex + 1}
                          </span>
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="font-semibold text-xs">{module.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {module.lessons.length} lessons • {module.estimatedMinutes} min
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedModules.has(module.id) ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </button>

                    {/* Module Lessons */}
                    <AnimatePresence>
                      {expandedModules.has(module.id) && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-1.5 space-y-1">
                            {module.lessons.map((lesson, lessonIndex) => {
                              const isCompleted = lesson.isCompleted || false;
                              const isLocked = false;

                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => !isLocked && startLesson(lesson.id)}
                                  disabled={isLocked}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-colors ${
                                    isLocked
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:bg-muted/50"
                                  } ${isCompleted ? "bg-primary/5" : ""}`}
                                >
                                  <div className="flex-shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-primary" />
                                    ) : isLocked ? (
                                      <Lock className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {getContentTypeIcon(lesson.contentType)}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="text-xs font-medium">{lesson.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {lesson.estimatedMinutes} min
                                    </p>
                                  </div>
                                  {!isLocked && !isCompleted && (
                                    <Play className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Additional Info */}
          <div className="space-y-4">
            {/* Certificate Card */}
            {progressPercentage === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="surface-card p-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-1.5">Course Completed!</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Congratulations on completing this course
                </p>
                <button
                  onClick={() => router.push(`/app/learn/certificate/${courseId}`)}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors"
                >
                  Get Certificate
                </button>
              </motion.div>
            )}

            {/* What You'll Learn */}
            <div className="surface-card p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                What You'll Learn
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Practical sustainability strategies for SMEs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Industry-specific implementation guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Actionable steps to reduce environmental impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Compliance and reporting best practices</span>
                </li>
              </ul>
            </div>

            {/* Continue Button */}
            {course.isEnrolled && progressPercentage < 100 && (
              <button
                onClick={() => {
                  // Find first incomplete lesson
                  for (const courseModule of course.modules) {
                    for (const lesson of courseModule.lessons) {
                      if (!lesson.isCompleted) {
                        startLesson(lesson.id);
                        return;
                      }
                    }
                  }
                }}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Continue Learning
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}