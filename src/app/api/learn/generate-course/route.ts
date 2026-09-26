import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAndDeductAiCredits, refundAiCredits } from "@/lib/ai-credits";
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { aiErrorMessage, hasLovableAi } from "@/lib/lovable-ai";
import { CourseGenerationError, generateCourse } from "@/lib/learn/course-generator.server";

const log = logger("api.learn.generate-course");

const postSchema = z.object({
  topic: z.string().trim().min(1).max(300),
  industry: z.string().trim().min(1).max(200),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]),
  userId: z.string().trim().min(1).max(200).optional(),
  companyContext: z.record(z.string(), z.unknown()).nullable().optional(),
  customContext: z.string().trim().max(1000).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = await readJson(request, postSchema);
  if (!parsed.ok) return parsed.response;
  const { userId: claimed, ...input } = parsed.data;
  const auth = await bindSessionUser(request, claimed);
  if (!auth.ok) return auth.response;

  if (!hasLovableAi()) {
    return NextResponse.json(
      { error: "AI is not set up", message: "Course creation needs the AI service, which is not set up on this site yet." },
      { status: 503 },
    );
  }

  const gate = await checkAndDeductAiCredits(request, 1, "course");
  if (!gate.ok) return NextResponse.json({ error: gate.error, message: gate.error }, { status: gate.status });

  try {
    const result = await generateCourse({ userId: auth.userId, ...input });
    return NextResponse.json(result);
  } catch (error) {
    // Nothing usable was made, so the credit goes back.
    await refundAiCredits(auth.userId, 1, "course_failed").catch(() => {});
    if (error instanceof CourseGenerationError) {
      const ref = log.error("course answer rejected", error);
      return NextResponse.json(
        { error: "generation_failed", message: "The AI did not return a usable course. Your credit was returned; please try again.", ref },
        { status: 502 },
      );
    }
    const ref = log.error("course generation failed", error);
    return NextResponse.json({ error: "generation_failed", message: `${aiErrorMessage(error)} Your credit was returned.`, ref }, { status: 500 });
  }
}
