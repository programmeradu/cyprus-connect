import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { parseValue, readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("marketplace.update-status");

const Id = z.coerce.number().int().positive();
const Body = z
  .object({
    isFeatured: z.boolean().optional(),
    verificationStatus: z.enum(["pending", "verified", "rejected"]).optional(),
  })
  .strict()
  .refine((b) => b.isFeatured !== undefined || b.verificationStatus !== undefined, {
    message: "Send isFeatured or verificationStatus.",
  });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const id = parseValue((await params).id, Id);
  if (!id.ok) return id.response;
  const body = await readJson(request, Body);
  if (!body.ok) return body.response;

  try {
    const updated = await db
      .update(offsetProjects)
      .set({ ...body.data, updatedAt: new Date().toISOString() })
      .where(eq(offsetProjects.id, id.data))
      .returning({ id: offsetProjects.id });
    if (updated.length === 0) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    log.info("project status changed", { projectId: id.data, by: admin.userId, change: body.data });
    return NextResponse.json({ success: true, message: "Project status updated successfully" });
  } catch (error) {
    const ref = log.error("update failed", error, { projectId: id.data });
    return NextResponse.json({ error: "Failed to update project status", ref }, { status: 500 });
  }
}
