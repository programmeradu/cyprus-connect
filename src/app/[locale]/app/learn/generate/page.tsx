"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { PageShell, PageHeader, Section } from "@/components/app/console/kit";
import { useWorkspaceAction } from "@/components/app/console/workspace-store";

export default function GenerateCoursePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { user } = useUser();
  const t = useTranslations("dashboard.learnPages.generate");
  const tl = useTranslations("dashboard.learn");

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
      toast.error(t("needTopic"));
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
      toast.success(t("created"));
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
          title={t("title")}
          purpose={t("purpose")}
          breadcrumb={[
            { label: t("crumbLearn"), href: "/app/learn" },
            { label: t("crumbGenerate") }
          ]}
        />
      }
    >
        <Section title={t("details")}>
          <div className="vck-card space-y-5 p-5">
            <div>
              <label className="vck-label mb-2 block">
                {t("topic")} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder={t("topicPh")}
                maxLength={300}
                disabled={isGenerating}
                className="w-full rounded-[0.375rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vc-rule)]"
              />
              <p className="vck-meta mt-1">{t("topicHint")}</p>
            </div>

            <div>
              <label className="vck-label mb-2 block">{t("industry")}</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                disabled={isGenerating}
                className="w-full rounded-[0.375rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vc-rule)]"
              >
                <option value="">{t("industries.general")}</option>
                <option value="manufacturing">{t("industries.manufacturing")}</option>
                <option value="retail">{t("industries.retail")}</option>
                <option value="technology">{t("industries.technology")}</option>
                <option value="hospitality">{t("industries.hospitality")}</option>
                <option value="healthcare">{t("industries.healthcare")}</option>
                <option value="construction">{t("industries.construction")}</option>
                <option value="agriculture">{t("industries.agriculture")}</option>
                <option value="finance">{t("industries.finance")}</option>
              </select>
              <p className="vck-meta mt-1">{t("industryHint")}</p>
            </div>

            <div>
              <label className="vck-label mb-2 block">{t("level")}</label>
              <div className="grid grid-cols-3 gap-2">
                {["beginner", "intermediate", "advanced"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficultyLevel: level })}
                    disabled={isGenerating}
                    className={`vck-btn vck-btn-primary ${
                      formData.difficultyLevel === level ? "vck-btn-primary" : ""
                    }`}
                  >
                    {tl(level as "beginner" | "intermediate" | "advanced")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="vck-label mb-2 block">{t("context")}</label>
              <textarea
                value={formData.customContext}
                onChange={(e) => setFormData({ ...formData, customContext: e.target.value })}
                placeholder={t("contextPh")}
                rows={4}
                maxLength={1000}
                disabled={isGenerating}
                className="w-full resize-none rounded-[0.375rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vc-rule)]"
              />
            </div>

            <div className="border-t border-[var(--vc-rule-soft)] pt-4">
              <p className="vck-label mb-2">{t("included")}</p>
              <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                <li>{t("inc1")}</li>
                <li>{t("inc2")}</li>
                <li>{t("inc3")}</li>
                <li>{t("inc4")}</li>
                <li>{t("inc5")}</li>
              </ul>
              <p className="vck-meta mt-2">{t("cost")}</p>
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
              {isGenerating ? t("making") : t("make")}
            </button>
          </div>
        </Section>
    </PageShell>
  );
}
