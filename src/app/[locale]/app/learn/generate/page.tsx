"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/app/AppHeader";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import {
  Sparkles,
  Loader2,
  BookOpen,
  Wand2,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { APP_OPEN_ACCESS } from "@/lib/open-access";

export default function GenerateCoursePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { user } = useUser();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [formData, setFormData] = useState({
    topic: "",
    industry: user?.companyIndustry || "",
    difficultyLevel: "beginner",
    customContext: ""
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isPending, router]);

  const generateCourse = async () => {
    if (!session?.user?.id || !formData.topic) {
      toast.error("Please enter a course topic");
      return;
    }

    setIsGenerating(true);
    setGenerationStep("Analyzing your request...");

    try {
      const token = localStorage.getItem("bearer_token");

      // Build company context
      const companyContext = user ? {
        companyName: user.companyName,
        industry: user.companyIndustry,
        size: user.teamSize || "SME",
        goals: user.sustainabilityGoals
      } : null;

      setGenerationStep("Generating course structure with AI...");

      const response = await fetch("/api/learn/generate-course", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
 "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic: formData.topic,
          industry: formData.industry || user?.companyIndustry || "general",
          difficultyLevel: formData.difficultyLevel,
          userId: session.user.id,
          companyContext,
          customContext: formData.customContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Course generated successfully!");
        router.push(`/app/learn/${data.courseId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate course");
      }
    } catch (error: any) {
      console.error("Course generation error:", error);
      toast.error("Failed to generate course");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  if (isPending) {
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
      <div className="mb-6">
        <button
          onClick={() => router.push("/app/learn")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learning Center
        </button>

        <AppHeader
          title="AI Course Generator"
          subtitle="Generate personalized sustainability courses tailored to your business"
        />
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="surface-card p-8">
          {!isGenerating ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Topic Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Course Topic <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Carbon Footprint Reduction Strategies"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  What sustainability topic would you like to learn about?
                </p>
              </div>

              {/* Industry Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">General</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="technology">Technology</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="construction">Construction</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="finance">Finance</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Course will be tailored to your industry
                </p>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {["beginner", "intermediate", "advanced"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, difficultyLevel: level })}
                      className={`py-3 px-4 rounded-lg border transition-all capitalize ${
                        formData.difficultyLevel === level
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Context */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={formData.customContext}
                  onChange={(e) => setFormData({ ...formData, customContext: e.target.value })}
                  placeholder="Any specific topics or challenges you'd like the course to address..."
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* What's Included */}
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  What's Included
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>AI-generated course structure with 3-4 comprehensive modules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>3-5 lessons per module with varied content types</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Interactive quizzes and practical exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Industry-specific examples and case studies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Certificate upon completion</span>
                  </li>
                </ul>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateCourse}
                disabled={!formData.topic}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Wand2 className="w-5 h-5" />
                Generate Course with AI
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-bold mb-2">Generating Your Course...</h3>
              <p className="text-sm text-muted-foreground mb-6">{generationStep}</p>
              <div className="max-w-md mx-auto">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 30, ease: "linear" }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                This may take a few moments...
              </p>
            </motion.div>
          )}
        </div>

        {/* Tips */}
        {!isGenerating && (
          <div className="mt-6 surface-card p-6">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Tips for Better Results
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>• Be specific about the topic you want to learn</li>
              <li>• Select your industry for tailored content and examples</li>
              <li>• Add context about your specific challenges or goals</li>
              <li>• Choose the right difficulty level for your team</li>
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
