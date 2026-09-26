"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { toast } from "sonner";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { PageShell, PageHeader, Section } from "@/components/app/console/kit";
import { useWorkspaceAction } from "@/components/app/console/workspace-store";

export default function GenerateCoursePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { user } = useUser();

  const writer = useWorkspaceAction();
  const isGenerating = writer.busy;
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
    const topic = formData.topic.trim();
    if (!topic) {
      toast.error("Please enter a course topic");
      return;
    }
    // Company facts come from the shared profile; the server trusts only the session for identity.
    const companyContext = user
      ? { companyName: user.companyName, industry: user.companyIndustry, size: user.teamSize || null, goals: user.sustainabilityGoals }
      : null;
    const data = await writer.run<{ courseId: number }>("/api/learn/generate-course", {
      body: {
        topic,
        industry: formData.industry.trim() || user?.companyIndustry || "general",
        difficultyLevel: formData.difficultyLevel,
        companyContext,
        customContext: formData.customContext.trim() || null,
      },
      invalidates: ["/api/learn/courses", "/api/notifications"],
    });
    if (data?.courseId) {
      toast.success("Course created. It stays private to you until an admin publishes it.");
      router.push(`/app/learn/${data.courseId}`);
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
      {true && (

        <Section title="Course details">
          <div className="vck-card space-y-5 p-5">
            <div>
              <label className="vck-label mb-2 block">
                Course topic <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Carbon footprint reduction strategies"
                maxLength={300}
                disabled={isGenerating}
                className="w-full rounded-[0.375rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vc-rule)]"
              />
              <p className="vck-meta mt-1">What sustainability topic would you like to learn about?</p>
            </div>

            <div>
              <label className="vck-label mb-2 block">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                disabled={isGenerating}
                className="w-full rounded-[0.375rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vc-rule)]"
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
              <p className="vck-meta mt-1">The course will be tailored to your industry.</p>
            </div>

            <div>
              <label className="vck-label mb-2 block">Difficulty level</label>
              <div className="grid grid-cols-3 gap-2">
                {["beginner", "intermediate", "advanced"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficultyLevel: level })}
                    disabled={isGenerating}
                    className={`vck-btn vck-btn-primary capitalize ${
                      formData.difficultyLevel === level ? "vck-btn-primary" : ""
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="vck-label mb-2 block">Additional context (optional)</label>
              <textarea
                value={formData.customContext}
                onChange={(e) => setFormData({ ...formData, customContext: e.target.value })}
                placeholder="Any specific topics or challenges you'd like the course to address..."
                rows={4}
                maxLength={1000}
                disabled={isGenerating}
                className="w-full resize-none rounded-[0.375rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vc-rule)]"
              />
            </div>

            <div className="border-t border-[var(--vc-rule-soft)] pt-4">
              <p className="vck-label mb-2">What's included</p>
              <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                <li>AI-generated course structure with 3-4 comprehensive modules</li>
                <li>3-5 lessons per module with varied content types</li>
                <li>Interactive quizzes and practical exercises</li>
                <li>Industry-specific examples and case studies</li>
                <li>Certificate upon completion</li>
              </ul>
              <p className="vck-meta mt-2">Uses one AI credit (returned if nothing usable is made). The course is private to you until an admin publishes it.</p>
            </div>

            {writer.error && (
              <p role="alert" className="rounded-[0.375rem] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {writer.error}
              </p>
            )}

            <button
              type="button"
              onClick={generateCourse}
              disabled={!formData.topic.trim() || isGenerating}
              className="vck-btn vck-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Writing your course\u2026 this can take a minute" : "Generate course with AI"}
            </button>
          </div>
        </Section>
      )}
    </PageShell>
  );
}
