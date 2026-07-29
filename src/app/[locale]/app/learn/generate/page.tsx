"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { toast } from "sonner";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { PageShell, PageHeader, Section, AiUnavailable } from "@/components/app/shell";

export default function GenerateCoursePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { user } = useUser();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [aiError, setAiError] = useState(false);
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
    setAiError(false);
    setGenerationStep("Analyzing your request...");

    try {
      const token = localStorage.getItem("bearer_token");

      const companyContext = user
        ? {
            companyName: user.companyName,
            industry: user.companyIndustry,
            size: user.teamSize || "SME",
            goals: user.sustainabilityGoals
          }
        : null;

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
        setAiError(true);
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to generate course");
      }
    } catch (error: any) {
      console.error("Course generation error:", error);
      setAiError(true);
      toast.error("Failed to generate course");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  if (!isPending && !session?.user) {
    return null;
  }

  return (
    <PageShell
      loading={isPending}
      header={
        <PageHeader
          title="AI course generator"
          purpose="Generate a personalised sustainability course tailored to your business."
          breadcrumb={[
            { label: "Learn", href: "/app/learn" },
            { label: "Generate" }
          ]}
        />
      }
    >
      {aiError ? (
        <AiUnavailable feature="generate a lesson" onRetry={generateCourse} />
      ) : (
        <Section title="Course details">
          <div className="app-card space-y-5 p-5">
            <div>
              <label className="app-label mb-2 block">
                Course topic <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Carbon footprint reduction strategies"
                disabled={isGenerating}
                className="w-full rounded-[0.375rem] border border-[var(--app-rule)] bg-[var(--app-surface-1)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-rule-strong)]"
              />
              <p className="app-meta mt-1">What sustainability topic would you like to learn about?</p>
            </div>

            <div>
              <label className="app-label mb-2 block">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                disabled={isGenerating}
                className="w-full rounded-[0.375rem] border border-[var(--app-rule)] bg-[var(--app-surface-1)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-rule-strong)]"
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
              <p className="app-meta mt-1">The course will be tailored to your industry.</p>
            </div>

            <div>
              <label className="app-label mb-2 block">Difficulty level</label>
              <div className="grid grid-cols-3 gap-2">
                {["beginner", "intermediate", "advanced"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficultyLevel: level })}
                    disabled={isGenerating}
                    className={`app-btn capitalize ${
                      formData.difficultyLevel === level ? "" : "app-btn-ghost"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="app-label mb-2 block">Additional context (optional)</label>
              <textarea
                value={formData.customContext}
                onChange={(e) => setFormData({ ...formData, customContext: e.target.value })}
                placeholder="Any specific topics or challenges you'd like the course to address..."
                rows={4}
                disabled={isGenerating}
                className="w-full resize-none rounded-[0.375rem] border border-[var(--app-rule)] bg-[var(--app-surface-1)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-rule-strong)]"
              />
            </div>

            <div className="border-t border-[var(--app-rule)] pt-4">
              <p className="app-label mb-2">What's included</p>
              <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                <li>AI-generated course structure with 3-4 comprehensive modules</li>
                <li>3-5 lessons per module with varied content types</li>
                <li>Interactive quizzes and practical exercises</li>
                <li>Industry-specific examples and case studies</li>
                <li>Certificate upon completion</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={generateCourse}
              disabled={!formData.topic || isGenerating}
              className="app-btn w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? generationStep || "Generating…" : "Generate course with AI"}
            </button>
          </div>
        </Section>
      )}
    </PageShell>
  );
}
