import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { inboundQuestionnaires } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import {
  loadWorkspaceMetricsForQuestionnaire,
  parseQuestionnaireRows,
  parseQuestionnaireText,
  buildQuestionnaireRecord,
  type QuestionnaireQuestion,
} from "@/lib/questionnaires/questionnaire.server";
import { parseCsv } from "@/lib/documents/intake";
import * as XLSX from "xlsx";

const UploadSchema = z.object({
  title: z.string().min(1).max(200),
  fileName: z.string().min(1).max(200),
  fileType: z.enum(["xlsx", "csv", "pdf"]),
  csvText: z.string().optional(),
  base64Data: z.string().optional(),
  requesterName: z.string().max(200).optional(),
});

const UpdateQuestionSchema = z.object({
  questionnaireId: z.number().int().positive(),
  questionId: z.string().min(1),
  answerEn: z.string(),
  answerEl: z.string(),
  isVerified: z.boolean().optional(),
});

export async function GET() {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  try {
    const list = await db
      .select()
      .from(inboundQuestionnaires)
      .where(eq(inboundQuestionnaires.workspaceId, s.session.workspace.id))
      .orderBy(desc(inboundQuestionnaires.createdAt));

    return NextResponse.json({ questionnaires: list });
  } catch (error) {
    const ref = logger("questionnaires-get").error("Failed to load questionnaires", { error });
    return NextResponse.json({ error: "Could not load questionnaires", ref }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  const parsed = await readJson(request, UploadSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  try {
    const ctx = await loadWorkspaceMetricsForQuestionnaire(s.session.workspace.id, s.session.account.id);
    let questions: QuestionnaireQuestion[] = [];

    if (input.fileType === "csv" && input.csvText) {
      const rows = parseCsv(input.csvText);
      questions = await parseQuestionnaireRows(rows, ctx);
    } else if (input.fileType === "xlsx" && input.base64Data) {
      const bytes = Buffer.from(input.base64Data, "base64");
      const book = XLSX.read(bytes, { type: "array" });
      const sheet = book.Sheets[book.SheetNames[0]];
      const rows = sheet ? parseCsv(XLSX.utils.sheet_to_csv(sheet, { FS: ";" })) : [];
      questions = await parseQuestionnaireRows(rows, ctx);
    } else if (input.fileType === "pdf" && input.base64Data) {
      const bytes = Buffer.from(input.base64Data, "base64");
      const { extractText, getDocumentProxy } = await import("unpdf");
      let text = "";
      try {
        const pdf = await getDocumentProxy(new Uint8Array(bytes));
        const res = await extractText(pdf, { mergePages: true });
        text = (res?.text ?? "").trim();
      } catch {
        text = "";
      }
      questions = await parseQuestionnaireText(text, ctx);
    } else if (input.csvText) {
      const rows = parseCsv(input.csvText);
      questions = await parseQuestionnaireRows(rows, ctx);
    }

    const record = await buildQuestionnaireRecord({
      workspaceId: s.session.workspace.id,
      title: input.title,
      source: "upload",
      fileName: input.fileName,
      fileType: input.fileType,
      requesterName: input.requesterName ?? undefined,
      questions,
    });

    const [inserted] = await db.insert(inboundQuestionnaires).values(record).returning();

    const { activityEvents } = await import("@/db/schema");
    await db.insert(activityEvents).values({
      workspaceId: s.session.workspace.id,
      actorType: "human",
      actorName: s.session.account.name || "You",
      verb: "imported",
      object: `Customer questionnaire: ${input.title}`,
      detail: `Auto-filled ${record.answeredQuestions} of ${record.totalQuestions} questions from verified records.`,
    });

    return NextResponse.json({ ok: true, questionnaire: inserted });
  } catch (error) {
    const ref = logger("questionnaires-post").error("Failed to parse questionnaire", { error });
    return NextResponse.json({ error: "Failed to process questionnaire", ref }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  const parsed = await readJson(request, UpdateQuestionSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  try {
    const [existing] = await db
      .select()
      .from(inboundQuestionnaires)
      .where(
        and(
          eq(inboundQuestionnaires.id, input.questionnaireId),
          eq(inboundQuestionnaires.workspaceId, s.session.workspace.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
    }

    const updatedQuestions = existing.questions.map((q) => {
      if (q.id === input.questionId) {
        return {
          ...q,
          answerEn: input.answerEn,
          answerEl: input.answerEl,
          needsInput: false,
          confidence: "high" as const,
          isVerified: input.isVerified !== undefined ? input.isVerified : q.isVerified,
        };
      }
      return q;
    });

    const answered = updatedQuestions.filter((q) => !q.needsInput && q.confidence !== "none").length;
    const verified = updatedQuestions.filter((q) => q.isVerified).length;

    const [updated] = await db
      .update(inboundQuestionnaires)
      .set({
        questions: updatedQuestions,
        answeredQuestions: answered,
        verifiedQuestions: verified,
        updatedAt: new Date(),
      })
      .where(eq(inboundQuestionnaires.id, existing.id))
      .returning();

    const { activityEvents } = await import("@/db/schema");
    await db.insert(activityEvents).values({
      workspaceId: s.session.workspace.id,
      actorType: "human",
      actorName: s.session.account.name || "You",
      verb: "updated",
      object: `Questionnaire response: ${existing.title}`,
      detail: `Updated question ${input.questionId}.`,
    });

    return NextResponse.json({ ok: true, questionnaire: updated });
  } catch (error) {
    const ref = logger("questionnaires-patch").error("Failed to update question", { error });
    return NextResponse.json({ error: "Failed to update question", ref }, { status: 500 });
  }
}

