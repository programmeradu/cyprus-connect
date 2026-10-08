import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { inboundQuestionnaires } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson, MAX_UPLOAD_BYTES } from "@/lib/validate";
import { recordActivity } from "@/lib/activity.server";
import { logger } from "@/lib/log";
import {
  loadWorkspaceMetricsForQuestionnaire,
  parseQuestionnaireRows,
  parseQuestionnaireText,
  buildQuestionnaireRecord,
  autoFillQuestions,
  STANDARD_BUYER_QUESTIONS,
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

export async function GET(request: Request) {
  const h = request ? new Headers(request.headers) : await headers();
  const s = await resolveConsoleSession(h);
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  try {
    const list = await db
      .select()
      .from(inboundQuestionnaires)
      .where(eq(inboundQuestionnaires.workspaceId, s.session.workspace.id))
      .orderBy(desc(inboundQuestionnaires.createdAt))
      .catch(() => []);

    return NextResponse.json({ questionnaires: list });
  } catch (error) {
    const ref = logger("questionnaires-get").error("Failed to load questionnaires", { error });
    return NextResponse.json({ error: "Could not load questionnaires", ref }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const h = request ? new Headers(request.headers) : await headers();
  const s = await resolveConsoleSession(h);
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  const parsed = await readJson(request, UploadSchema, MAX_UPLOAD_BYTES);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  try {
    const ctx = await loadWorkspaceMetricsForQuestionnaire(s.session.workspace.id, s.session.account.id);
    let questions: QuestionnaireQuestion[] = [];

    if (input.fileType === "csv" && input.csvText) {
      const rows = parseCsv(input.csvText);
      questions = await parseQuestionnaireRows(rows, ctx);
    } else if (input.fileType === "xlsx" && input.base64Data) {
      try {
        const base64Clean = input.base64Data.includes(",") ? input.base64Data.split(",")[1] : input.base64Data;
        const bytes = Buffer.from(base64Clean, "base64");
        const book = XLSX.read(bytes, { type: "array" });
        const sheet = book?.SheetNames?.[0] ? book.Sheets[book.SheetNames[0]] : null;
        const rows = sheet ? parseCsv(XLSX.utils.sheet_to_csv(sheet, { FS: ";" })) : [];
        questions = await parseQuestionnaireRows(rows, ctx);
      } catch (xlsxErr) {
        logger("questionnaires-post").warn("Failed to parse xlsx file, falling back to standard questions", { xlsxErr });
        questions = autoFillQuestions(
          STANDARD_BUYER_QUESTIONS.map((q) => ({ code: q.code, questionEn: q.qEn, questionEl: q.qEl, module: q.module })),
          ctx,
        );
      }
    } else if (input.fileType === "pdf" && input.base64Data) {
      try {
        const base64Clean = input.base64Data.includes(",") ? input.base64Data.split(",")[1] : input.base64Data;
        const bytes = Buffer.from(base64Clean, "base64");
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
      } catch (pdfErr) {
        logger("questionnaires-post").warn("Failed to parse pdf file, falling back to standard questions", { pdfErr });
        questions = autoFillQuestions(
          STANDARD_BUYER_QUESTIONS.map((q) => ({ code: q.code, questionEn: q.qEn, questionEl: q.qEl, module: q.module })),
          ctx,
        );
      }
    } else if (input.csvText) {
      const rows = parseCsv(input.csvText);
      questions = await parseQuestionnaireRows(rows, ctx);
    }

    if (questions.length === 0) {
      questions = autoFillQuestions(
        STANDARD_BUYER_QUESTIONS.map((q) => ({ code: q.code, questionEn: q.qEn, questionEl: q.qEl, module: q.module })),
        ctx,
      );
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

    await recordActivity(
      s.session,
      "imported questionnaire",
      `Customer questionnaire: ${input.title}`,
      `Auto-filled ${record.answeredQuestions} of ${record.totalQuestions} questions from verified records.`,
    );

    return NextResponse.json({ ok: true, questionnaire: inserted });
  } catch (error) {
    const ref = logger("questionnaires-post").error("Failed to parse questionnaire", { error });
    return NextResponse.json({ error: "Failed to process questionnaire", ref }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const h = request ? new Headers(request.headers) : await headers();
  const s = await resolveConsoleSession(h);
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

    await recordActivity(
      s.session,
      "updated question",
      `Questionnaire response: ${existing.title}`,
      `Updated question ${input.questionId}.`,
    );

    return NextResponse.json({ ok: true, questionnaire: updated });
  } catch (error) {
    const ref = logger("questionnaires-patch").error("Failed to update question", { error });
    return NextResponse.json({ error: "Failed to update question", ref }, { status: 500 });
  }
}
