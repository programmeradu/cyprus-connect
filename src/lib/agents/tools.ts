/**
 * The tool contract. An agent can only act through these tools. Each tool has
 * a typed input and a fixed risk level; the runtime checks both before it runs.
 * Agents never touch the database or outside systems directly.
 */

import { z } from "zod";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { sha256Hex } from "./hash";
import { db } from "@/db";
import {
  agentTasks,
  cbamDeclarants,
  cbamDeclarations,
  cbamImportLines,
  cbamSupplierRequests,
  cbamSuppliers,
  metricDefinitions,
  metricReadings,
  obligations,
  workspaceFacts,
} from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import type { RiskLevel } from "./policy";

export interface ToolContext {
  workspaceId: string;
  agentKey: string;
  runId: number;
  /** Set only when a person approved this exact call from the review queue. */
  approvedBy?: string;
}

export interface ToolDef<I extends z.ZodType = z.ZodType, O = unknown> {
  name: string;
  risk: RiskLevel;
  description: string;
  input: I;
  /** Plain title for the review queue when this call needs a person. */
  approvalTitle?: (input: z.infer<I>) => string;
  /** What the approver must read before deciding, e.g. the full email text. */
  approvalDetail?: (input: z.infer<I>) => string;
  run: (ctx: ToolContext, input: z.infer<I>) => Promise<O>;
}

function tool<I extends z.ZodType, O>(def: ToolDef<I, O>): ToolDef<I, O> {
  return def;
}

export const readMetrics = tool({
  name: "read_metrics",
  risk: 0,
  description: "Latest reading date and value for every metric in the workspace.",
  input: z.object({}),
  run: async (ctx) => {
    const [defs, readings] = await Promise.all([
      db.select().from(metricDefinitions).orderBy(asc(metricDefinitions.sortOrder)),
      db
        .select()
        .from(metricReadings)
        .where(eq(metricReadings.workspaceId, ctx.workspaceId))
        .orderBy(asc(metricReadings.periodStart)),
    ]);
    const latest = new Map<string, { periodStart: string; value: number; count: number }>();
    for (const r of readings) {
      const prev = latest.get(r.metricKey);
      latest.set(r.metricKey, {
        periodStart: r.periodStart,
        value: r.value,
        count: (prev?.count ?? 0) + 1,
      });
    }
    return defs.map((d) => ({
      key: d.key,
      label: d.label,
      unit: d.unit,
      latestPeriod: latest.get(d.key)?.periodStart ?? null,
      readings: latest.get(d.key)?.count ?? 0,
    }));
  },
});

export const readObligations = tool({
  name: "read_obligations",
  risk: 0,
  description: "Open obligations with due date, status and progress.",
  input: z.object({}),
  run: async (ctx) => {
    const rows = await db
      .select()
      .from(obligations)
      .where(eq(obligations.workspaceId, ctx.workspaceId))
      .orderBy(asc(obligations.dueDate));
    return rows
      .filter((o) => o.status !== "complete")
      .map((o) => ({
        id: o.id,
        title: o.title,
        framework: o.framework,
        dueDate: o.dueDate,
        status: o.status,
        progressPct: o.progressPct,
      }));
  },
});

export const createTask = tool({
  name: "create_task",
  risk: 1,
  description:
    "Put a task in the review queue. Skips it when an open task with the same title exists.",
  input: z.object({
    title: z.string().min(3).max(200),
    detail: z.string().max(2000).nullable(),
    severity: z.enum(["high", "normal", "low"]),
    kind: z.enum(["evidence", "approval", "review"]),
    dueAt: z.string().nullable(),
  }),
  run: async (ctx, input) => {
    const [existing] = await db
      .select({ id: agentTasks.id })
      .from(agentTasks)
      .where(
        and(
          eq(agentTasks.workspaceId, ctx.workspaceId),
          eq(agentTasks.status, "open"),
          eq(agentTasks.title, input.title),
        ),
      )
      .limit(1);
    if (existing) return { taskId: existing.id, created: false };
    const [row] = await db
      .insert(agentTasks)
      .values({
        workspaceId: ctx.workspaceId,
        agentKey: ctx.agentKey,
        kind: input.kind,
        title: input.title,
        detail: input.detail,
        severity: input.severity,
        status: "open",
        dueAt: input.dueAt,
      })
      .returning({ id: agentTasks.id });
    return { taskId: row.id, created: true };
  },
});

export const recordFact = tool({
  name: "record_fact",
  risk: 1,
  description:
    "Store a fact other agents can use. Closes the previous value of the same key.",
  input: z.object({
    key: z.string().min(1).max(120),
    value: z.string().max(2000),
    unit: z.string().max(40).nullable(),
    sourceKind: z.enum(["derived", "document", "connector", "human"]),
    sourceHash: z.string().min(8).max(128),
  }),
  run: async (ctx, input) => {
    const now = new Date();
    await db
      .update(workspaceFacts)
      .set({ validTo: now })
      .where(
        and(
          eq(workspaceFacts.workspaceId, ctx.workspaceId),
          eq(workspaceFacts.key, input.key),
          isNull(workspaceFacts.validTo),
        ),
      );
    const [row] = await db
      .insert(workspaceFacts)
      .values({
        workspaceId: ctx.workspaceId,
        key: input.key,
        value: input.value,
        unit: input.unit,
        sourceKind: input.sourceKind,
        sourceHash: input.sourceHash,
        agentKey: ctx.agentKey,
        runId: ctx.runId,
        validFrom: now,
      })
      .returning({ id: workspaceFacts.id });
    return { factId: row.id };
  },
});

export const readCbamImports = tool({
  name: "read_cbam_imports",
  risk: 0,
  description: "Customs import lines of CBAM goods for one calendar year.",
  input: z.object({ year: z.number().int().min(2026).max(2100) }),
  run: async (ctx, input) =>
    db
      .select()
      .from(cbamImportLines)
      .where(and(eq(cbamImportLines.workspaceId, ctx.workspaceId), eq(cbamImportLines.year, input.year)))
      .orderBy(asc(cbamImportLines.id)),
});

export const saveCbamDraft = tool({
  name: "save_cbam_draft",
  risk: 1,
  description:
    "Store the annual CBAM declaration draft. A signed declaration stays signed only while its content is unchanged.",
  input: z.object({
    year: z.number().int().min(2026).max(2100),
    status: z.enum(["needs_data", "below_threshold", "awaiting_signature"]),
    draft: z.string().min(2).max(2_000_000),
    draftHash: z.string().length(64),
  }),
  run: async (ctx, input) => {
    if ((await sha256Hex(input.draft)) !== input.draftHash) throw new Error("Draft hash does not match its content.");
    const [prev] = await db
      .select()
      .from(cbamDeclarations)
      .where(and(eq(cbamDeclarations.workspaceId, ctx.workspaceId), eq(cbamDeclarations.year, input.year)))
      .limit(1);
    const stillSigned = prev?.status === "signed" && prev.signedHash === input.draftHash;
    const status = stillSigned ? "signed" : input.status;
    await db
      .insert(cbamDeclarations)
      .values({
        workspaceId: ctx.workspaceId,
        year: input.year,
        status,
        draft: input.draft,
        draftHash: input.draftHash,
        runId: ctx.runId,
      })
      .onConflictDoUpdate({
        target: [cbamDeclarations.workspaceId, cbamDeclarations.year],
        set: { status, draft: input.draft, draftHash: input.draftHash, runId: ctx.runId, updatedAt: new Date() },
      });
    return { status, changed: prev?.draftHash !== input.draftHash, signatureVoided: prev?.status === "signed" && !stillSigned };
  },
});

export const signCbamDeclaration = tool({
  name: "sign_cbam_declaration",
  risk: 3,
  description:
    "Record the declarant's signature on the annual CBAM declaration. Only runs after a person approves it, and only if the draft has not changed since.",
  input: z.object({
    year: z.number().int().min(2026).max(2100),
    draftHash: z.string().length(64),
    embeddedT: z.number().min(0),
    lines: z.number().int().min(0),
  }),
  approvalTitle: (i) => `Sign the ${i.year} CBAM declaration`,
  run: async (ctx, input) => {
    if (!ctx.approvedBy) throw new Error("A signature needs a person's approval.");
    const [decl] = await db
      .select()
      .from(cbamDeclarations)
      .where(and(eq(cbamDeclarations.workspaceId, ctx.workspaceId), eq(cbamDeclarations.year, input.year)))
      .limit(1);
    if (!decl) throw new Error(`There is no ${input.year} declaration to sign.`);
    if (decl.status === "signed" && decl.signedHash === input.draftHash) {
      return { signed: true, alreadySigned: true, signedBy: decl.signedBy };
    }
    if (decl.draftHash !== input.draftHash) {
      throw new Error("The declaration changed after this approval was requested. The agent will ask again for the new version.");
    }
    if (decl.status !== "awaiting_signature") {
      throw new Error(`The declaration is not ready to sign (status: ${decl.status.replace(/_/g, " ")}).`);
    }
    const signedAt = new Date();
    await db
      .update(cbamDeclarations)
      .set({ status: "signed", signedBy: ctx.approvedBy, signedAt, signedHash: input.draftHash, updatedAt: signedAt })
      .where(eq(cbamDeclarations.id, decl.id));
    return { signed: true, alreadySigned: false, signedBy: ctx.approvedBy, signedAt: signedAt.toISOString() };
  },
});

export const readCbamSuppliers = tool({
  name: "read_cbam_suppliers",
  risk: 0,
  description: "Supplier contacts, the declarant profile, recent supplier requests and open email approvals for one year.",
  input: z.object({ year: z.number().int().min(2026).max(2100) }),
  run: async (ctx, input) => {
    const [contacts, [declarant], sent, open] = await Promise.all([
      db.select().from(cbamSuppliers).where(eq(cbamSuppliers.workspaceId, ctx.workspaceId)),
      db.select().from(cbamDeclarants).where(eq(cbamDeclarants.workspaceId, ctx.workspaceId)).limit(1),
      db
        .select({ supplierName: cbamSupplierRequests.supplierName, sentAt: cbamSupplierRequests.sentAt })
        .from(cbamSupplierRequests)
        .where(and(eq(cbamSupplierRequests.workspaceId, ctx.workspaceId), eq(cbamSupplierRequests.year, input.year)))
        .orderBy(desc(cbamSupplierRequests.sentAt)),
      db
        .select({ id: agentTasks.id, pendingInput: agentTasks.pendingInput, pendingInputHash: agentTasks.pendingInputHash })
        .from(agentTasks)
        .where(
          and(
            eq(agentTasks.workspaceId, ctx.workspaceId),
            eq(agentTasks.status, "open"),
            eq(agentTasks.pendingTool, "send_supplier_request"),
          ),
        ),
    ]);
    const lastSent: Record<string, string> = {};
    for (const s of sent) if (!lastSent[s.supplierName]) lastSent[s.supplierName] = s.sentAt.toISOString();
    const openRequests = open.flatMap((t) => {
      try {
        const p = JSON.parse(t.pendingInput ?? "{}") as { year?: number; supplierName?: string };
        return p.year === input.year && p.supplierName
          ? [{ taskId: t.id, supplierName: p.supplierName, inputHash: t.pendingInputHash ?? "" }]
          : [];
      } catch {
        return [];
      }
    });
    return {
      contacts: contacts.map((c) => ({ supplierName: c.supplierName, email: c.email, contactName: c.contactName })),
      importerName: declarant?.legalName ?? null,
      replyTo: declarant?.replyToEmail ?? null,
      lastSent,
      openRequests,
    };
  },
});

export const withdrawApprovalRequest = tool({
  name: "withdraw_approval_request",
  risk: 1,
  description: "Withdraw this agent's own open approval request because the facts behind it changed.",
  input: z.object({ taskId: z.number().int().positive(), reason: z.string().min(3).max(300) }),
  run: async (ctx, input) => {
    const rows = await db
      .update(agentTasks)
      .set({ status: "withdrawn", result: `Withdrawn by the agent: ${input.reason}` })
      .where(
        and(
          eq(agentTasks.id, input.taskId),
          eq(agentTasks.workspaceId, ctx.workspaceId),
          eq(agentTasks.agentKey, ctx.agentKey),
          eq(agentTasks.status, "open"),
          eq(agentTasks.kind, "approval"),
        ),
      )
      .returning({ id: agentTasks.id });
    return { withdrawn: rows.length === 1 };
  },
});

export const sendSupplierRequest = tool({
  name: "send_supplier_request",
  risk: 2,
  description:
    "Email a CBAM supplier and ask for installation data and actual embedded emissions. The approver sees the full email; only that exact text is sent.",
  input: z.object({
    year: z.number().int().min(2026).max(2100),
    supplierName: z.string().min(1).max(200),
    to: z.string().email().max(254),
    replyTo: z.string().email().max(254).nullable(),
    subject: z.string().min(3).max(200),
    body: z.string().min(20).max(20_000),
  }),
  approvalTitle: (i) => `Email ${i.supplierName} for ${i.year} CBAM data`,
  approvalDetail: (i) => `To: ${i.to}${i.replyTo ? ` (replies to ${i.replyTo})` : ""}\nSubject: ${i.subject}\n\n${i.body}`,
  run: async (ctx, input) => {
    if (!ctx.approvedBy) throw new Error("An outward email needs a person's approval.");
    const sent = await sendEmail({ to: input.to, subject: input.subject, text: input.body, replyTo: input.replyTo });
    const [row] = await db
      .insert(cbamSupplierRequests)
      .values({
        workspaceId: ctx.workspaceId,
        year: input.year,
        supplierName: input.supplierName,
        email: input.to,
        subject: input.subject,
        bodyHash: await sha256Hex(input.body),
        provider: sent.provider,
        providerId: sent.id,
        approvedBy: ctx.approvedBy,
        runId: ctx.runId,
      })
      .returning({ id: cbamSupplierRequests.id, sentAt: cbamSupplierRequests.sentAt });
    return { sent: true, to: input.to, provider: sent.provider, requestId: row.id, sentAt: row.sentAt.toISOString() };
  },
});

export const TOOLS = {
  read_metrics: readMetrics,
  read_obligations: readObligations,
  create_task: createTask,
  record_fact: recordFact,
  read_cbam_imports: readCbamImports,
  save_cbam_draft: saveCbamDraft,
  sign_cbam_declaration: signCbamDeclaration,
  read_cbam_suppliers: readCbamSuppliers,
  withdraw_approval_request: withdrawApprovalRequest,
  send_supplier_request: sendSupplierRequest,
} as const;

export type ToolName = keyof typeof TOOLS;
