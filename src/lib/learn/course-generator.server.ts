/**
 * The one way a course is generated. Used by POST /api/learn/generate-course.
 *
 * - Calls the AI directly (no HTTP call to our own API), asks for JSON and
 *   validates it; a bad or missing answer is an error, never a canned course.
 * - Lesson HTML is sanitised before it is stored.
 * - The course is private to its creator (it may carry company context);
 *   only an admin can publish it to the shared library.
 * - Only the creator is notified.
 */

import { z } from "zod";
import { db } from "@/db";
import { courses, courseModules, lessons, notifications } from "@/db/schema";
import { aiChat, CHAT_MODEL_PRO } from "@/lib/lovable-ai";
import { generateImage } from "@/lib/generators";
import { logger } from "@/lib/log";
import { sanitizeLessonContent, sanitizeLessonHtml } from "./sanitize-lesson";

const log = logger("learn.course-generator");

/** Images are slow and costly; a cover plus the first few reading lessons is enough. */
const MAX_LESSON_IMAGES = 3;

const quizQuestion = z.object({
  question: z.string().min(1).max(600),
  options: z.array(z.string().min(1).max(300)).min(2).max(6),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().max(1200).optional().default(""),
}).refine((q) => q.correctAnswer < q.options.length, "correctAnswer out of range");

const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  contentType: z.enum(["text", "quiz", "exercise"]),
  estimatedMinutes: z.number().int().min(1).max(240).catch(15),
  content: z.object({
    text: z.string().max(40_000).optional(),
    questions: z.array(quizQuestion).max(12).optional(),
    exercises: z.array(z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).default(""),
      tasks: z.array(z.string().min(1).max(600)).max(12).default([]),
    })).max(6).optional(),
  }).passthrough(),
  needsImage: z.boolean().optional(),
  imagePrompt: z.string().max(600).optional(),
});

export const courseStructureSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(2000),
  estimatedHours: z.number().min(0.5).max(40).catch(4),
  modules: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1200).default(""),
    estimatedMinutes: z.number().int().min(1).max(1200).catch(60),
    lessons: z.array(lessonSchema).min(1).max(8),
  })).min(1).max(6),
});

export type CourseStructure = z.infer<typeof courseStructureSchema>;

export interface GenerateCourseInput {
  userId: string;
  topic: string;
  industry: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  companyContext?: Record<string, unknown> | null;
  customContext?: string | null;
}

export class CourseGenerationError extends Error {}

function prompt(input: GenerateCourseInput): string {
  const { topic, industry, difficultyLevel, companyContext, customContext } = input;
  return `You write practical sustainability courses for small and medium companies in Cyprus and the EU.

Topic: ${topic}
Industry: ${industry}
Level: ${difficultyLevel}
${companyContext ? `Company (use to tailor examples, do not repeat verbatim): ${JSON.stringify(companyContext)}` : ""}
${customContext ? `What the learner asked for: ${customContext}` : ""}

Rules:
- 3 to 4 modules, 3 to 5 lessons each; mix "text", "quiz" and "exercise" lessons.
- Text lessons: 500 to 1200 words of HTML using only h2, h3, p, ul, ol, li, strong, em, table. No scripts, styles or images.
- Do not invent statistics, prices, grant amounts, deadlines or named case studies. When a number matters, explain how the learner can find or measure it. You may name real EU/Cyprus rules (e.g. CSRD, CBAM, EU ETS) only in general terms.
- Label examples as examples.
- Quizzes: 4 to 6 questions, options array, correctAnswer is the 0-based index, short explanation.
- Exercises: tasks the learner can do in their own company this month.
- For up to 3 text lessons, set needsImage true and a short imagePrompt describing a calm, concrete illustration (no text in the image).

Return one JSON object:
{"title": "", "description": "", "estimatedHours": 4, "modules": [{"title": "", "description": "", "estimatedMinutes": 60, "lessons": [{"title": "", "contentType": "text", "estimatedMinutes": 20, "content": {"text": "<h2>…</h2><p>…</p>"}, "needsImage": false, "imagePrompt": ""}, {"title": "", "contentType": "quiz", "estimatedMinutes": 10, "content": {"questions": [{"question": "", "options": ["", "", "", ""], "correctAnswer": 0, "explanation": ""}]}}, {"title": "", "contentType": "exercise", "estimatedMinutes": 30, "content": {"exercises": [{"title": "", "description": "", "tasks": [""]}]}}]}]}`;
}

/** Parses and validates the model's answer. Exported for tests. */
export function parseCourseStructure(raw: string): CourseStructure {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new CourseGenerationError("The AI answer was not valid JSON.");
  }
  const parsed = courseStructureSchema.safeParse(json);
  if (!parsed.success) {
    throw new CourseGenerationError(`The AI answer did not match the course format: ${parsed.error.issues[0]?.message ?? "invalid"}`);
  }
  return parsed.data;
}

async function tryImage(promptText: string, aspect: string): Promise<string | null> {
  try {
    const result = await generateImage(promptText, aspect);
    return result.url && /^(https:|data:image\/)/.test(result.url) ? result.url : null;
  } catch (error) {
    log.warn("image generation failed", { error: String(error) });
    return null;
  }
}

export async function generateCourse(input: GenerateCourseInput): Promise<{ courseId: number; title: string }> {
  const answer = await aiChat({
    model: CHAT_MODEL_PRO,
    json: true,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt(input) }],
  });
  const structure = parseCourseStructure(answer);
  const now = () => new Date().toISOString();

  const thumbnailUrl = await tryImage(
    `Calm wide editorial illustration for a course titled "${structure.title}", ${input.industry} company in the Mediterranean, concrete everyday scene, no text`,
    "21:9",
  );

  const [course] = await db.insert(courses).values({
    title: structure.title,
    description: structure.description,
    industry: input.industry,
    difficultyLevel: input.difficultyLevel,
    estimatedHours: structure.estimatedHours,
    isPublished: false,
    thumbnailUrl,
    createdBy: input.userId,
    createdAt: now(),
    updatedAt: now(),
  }).returning({ id: courses.id });

  let imagesLeft = MAX_LESSON_IMAGES;
  for (const [mi, mod] of structure.modules.entries()) {
    const [moduleRow] = await db.insert(courseModules).values({
      courseId: course.id,
      order: mi + 1,
      title: mod.title,
      description: mod.description,
      estimatedMinutes: mod.estimatedMinutes,
      createdAt: now(),
    }).returning({ id: courseModules.id });

    for (const [li, lesson] of mod.lessons.entries()) {
      const content: Record<string, unknown> = sanitizeLessonContent({ ...lesson.content });
      if (lesson.contentType === "text" && lesson.needsImage && lesson.imagePrompt && imagesLeft > 0) {
        imagesLeft--;
        const url = await tryImage(lesson.imagePrompt, "16:9");
        if (url) content.imageUrl = url;
      }
      await db.insert(lessons).values({
        moduleId: moduleRow.id,
        order: li + 1,
        title: sanitizeLessonHtml(lesson.title).replace(/<[^>]*>/g, ""),
        contentType: lesson.contentType,
        contentJson: JSON.stringify(content),
        estimatedMinutes: lesson.estimatedMinutes,
        createdAt: now(),
      });
    }
  }

  try {
    await db.insert(notifications).values({
      userId: input.userId,
      type: "system_alert",
      title: "Your course is ready",
      message: `"${structure.title}" is ready in Learn.`,
      link: `/app/learn/${course.id}`,
      metadata: JSON.stringify({ courseId: course.id }),
      isRead: false,
      createdAt: now(),
    });
  } catch (error) {
    log.warn("notification failed", { error: String(error) });
  }

  return { courseId: course.id, title: structure.title };
}
