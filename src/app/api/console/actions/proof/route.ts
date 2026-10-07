/**
 * Proof for an Action plan project: an invoice PDF.
 *
 * POST multipart { file, projectId }. Code reads the PDF's text and must find
 * the supplier named on the project, a date after the project started, and the
 * item. A file that fails is refused and not stored.
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { actionEvidence, actionProjects, documents } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { readUpload } from "@/lib/validate";
import { logger } from "@/lib/log";
import { recordActivity } from "@/lib/activity.server";
import { CATALOG, isProjectType } from "@/lib/actions/catalog";
import { readProofText } from "@/lib/actions/verify";

export const dynamic = "force-dynamic";
const log = logger("api.console.actions.proof");

async function pdfText(bytes: Uint8Array): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    return (text ?? "").trim();
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const up = await readUpload(request, "file", ["pdf"]);
  if (!up.ok) return up.response;
  const projectId = Number(up.form.get("projectId"));
  if (!Number.isInteger(projectId) || projectId <= 0) return NextResponse.json({ error: "Choose a project first." }, { status: 400 });

  try {
    const ws = s.session.workspace;
    const [project] = await db.select().from(actionProjects).where(and(eq(actionProjects.id, projectId), eq(actionProjects.workspaceId, ws.id))).limit(1);
    if (!project || !isProjectType(project.type)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (project.stage === "confirmed") return NextResponse.json({ error: "This project is already confirmed." }, { status: 409 });
    const supplier = project.inputs?.supplierName ?? null;
    if (!supplier) return NextResponse.json({ error: "Add the supplier's name to the project first, so Vuneli knows whose invoice to look for.", code: "NO_SUPPLIER" }, { status: 400 });

    const text = await pdfText(up.bytes);
    const read = readProofText(text, CATALOG[project.type], supplier, project.startedOn);
    if (!read.ok) {
      // Answered with 200 so the page can name what was missing; nothing is stored.
      return NextResponse.json({ ok: false, missing: read.missing });
    }

    const now = new Date().toISOString();
    const [doc] = await db
      .insert(documents)
      .values({
        userId: ws.ownerUserId ?? s.session.account.id,
        fileName: up.file.name.slice(0, 200),
        fileType: "pdf",
        fileSize: up.bytes.length,
        fileUrl: `data:application/pdf;base64,${Buffer.from(up.bytes).toString("base64")}`,
        uploadSource: "action_proof",
        processingStatus: "completed",
        parsedData: JSON.stringify({ projectId, quotes: read.quotes }),
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: documents.id });
    await db.insert(actionEvidence).values({
      projectId,
      workspaceId: ws.id,
      kind: "invoice",
      documentId: doc.id,
      fileName: up.file.name.slice(0, 200),
      quotes: read.quotes,
      createdBy: s.session.account.id,
    });
    await recordActivity(s.session, "added proof", `Action plan: ${project.type} project`, `Invoice read: ${read.quotes.supplier} · ${read.quotes.date} · “${read.quotes.item}”`);
    return NextResponse.json({ ok: true, quotes: read.quotes });
  } catch (e) {
    const ref = log.error("proof failed", e);
    return NextResponse.json({ error: "The file could not be checked.", ref }, { status: 500 });
  }
}
