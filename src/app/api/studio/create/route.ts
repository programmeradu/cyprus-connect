/**
 * Report Visuals, one step: read the company's real records for the chosen
 * context, write the image prompt, make (or edit) the image, store it.
 * Credits are refunded if anything after the deduction fails.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { actions, emissions, mediaGenerations, user, userActions } from "@/db/schema";
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { aiChat, aiErrorMessage, aiImage, hasLovableAi } from "@/lib/lovable-ai";
import { generateImage } from "@/lib/generators";
import { uploadBase64Image } from "@/lib/supabase";
import { checkAndDeductAiCredits, refundAiCredits } from "@/lib/ai-credits";
import { STUDIO_CONTEXTS, studioBriefPrompt, studioFacts, type StudioSource } from "@/lib/studio/facts";

const log = logger("api.studio.create");

const bodySchema = z.object({
  brief: z.string().trim().min(3).max(1000),
  context: z.enum(STUDIO_CONTEXTS).default("custom"),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3"]).default("16:9"),
  /** Edit one of the caller's own images instead of making a new one. */
  sourceId: z.number().int().positive().optional(),
});

async function loadSource(userId: string): Promise<StudioSource> {
  const [company] = await db
    .select({
      companyName: user.companyName,
      companyIndustry: user.companyIndustry,
      teamSize: user.teamSize,
      countryCode: user.countryCode,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const rows = await db
    .select({
      totalCo2e: emissions.totalCo2e,
      electricity: emissions.electricity,
      gas: emissions.gas,
      transport: emissions.transport,
      periodMonth: emissions.periodMonth,
      periodYear: emissions.periodYear,
    })
    .from(emissions)
    .where(eq(emissions.userId, userId))
    .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth))
    .limit(2);

  const done = await db.select({ actionId: userActions.actionId }).from(userActions).where(eq(userActions.userId, userId));
  const doneIds = done.map((d) => d.actionId);

  const open = await db
    .select({ title: actions.title })
    .from(actions)
    .where(
      and(
        eq(actions.userId, userId),
        doneIds.length ? notInArray(actions.id, doneIds) : undefined,
      ),
    )
    .limit(3);

  return {
    company: company ?? null,
    emissions: rows,
    completedActions: doneIds.length,
    openActionTitles: open.map((o) => o.title),
  };
}

async function toStableUrl(dataUrl: string): Promise<string> {
  const hosted = await uploadBase64Image(dataUrl, `studio-${Date.now()}`);
  return hosted || dataUrl;
}

export async function POST(request: NextRequest) {
  const auth = await bindSessionUser(request);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const parsed = await readJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { brief, context, aspectRatio, sourceId } = parsed.data;

  if (!hasLovableAi()) {
    return NextResponse.json({ message: "Image making is not switched on for this workspace yet." }, { status: 503 });
  }

  let source: { url: string; prompt: string } | null = null;
  if (sourceId) {
    const [row] = await db
      .select({ url: mediaGenerations.url, prompt: mediaGenerations.prompt, type: mediaGenerations.type })
      .from(mediaGenerations)
      .where(and(eq(mediaGenerations.id, sourceId), eq(mediaGenerations.userId, userId)))
      .limit(1);
    if (!row || row.type !== "image") {
      return NextResponse.json({ message: "That image is not in your library." }, { status: 404 });
    }
    source = row;
  }

  let facts: string[] = [];
  if (!source) {
    try {
      facts = studioFacts(context, await loadSource(userId));
    } catch (error) {
      const ref = log.error("load studio facts failed", error);
      return NextResponse.json({ message: "Your company records could not be read.", ref }, { status: 500 });
    }
    if (context !== "custom" && facts.length === 0) {
      return NextResponse.json(
        { message: "There are no records for this topic yet. Add them first, or choose \"Free brief\"." },
        { status: 409 },
      );
    }
  }

  const gate = await checkAndDeductAiCredits(request, 1, "studio");
  if (!gate.ok) return NextResponse.json({ message: gate.error }, { status: gate.status });

  try {
    let url: string;
    let model: string;
    let enhancedPrompt: string;

    if (source) {
      let data = source.url;
      let mimeType = "image/png";
      if (!data.startsWith("data:")) {
        // The address comes from the caller's own stored row, never from the request.
        const res = await fetch(data);
        if (!res.ok) throw new Error("stored image unreadable");
        mimeType = res.headers.get("content-type") ?? "image/png";
        data = Buffer.from(await res.arrayBuffer()).toString("base64");
      }
      enhancedPrompt = brief;
      url = await toStableUrl(await aiImage(brief, [{ data, mimeType }]));
      model = "google/gemini-2.5-flash-image";
    } else {
      enhancedPrompt = (await aiChat({ messages: [{ role: "user", content: studioBriefPrompt(brief, facts) }] })).trim();
      if (!enhancedPrompt) throw new Error("empty prompt");
      const made = await generateImage(enhancedPrompt, aspectRatio);
      url = made.url;
      model = made.model;
    }

    const now = new Date().toISOString();
    const [row] = await db
      .insert(mediaGenerations)
      .values({
        userId,
        type: "image",
        url,
        prompt: source ? `${source.prompt} (edit: ${brief})` : brief,
        enhancedPrompt,
        model,
        modelReason: facts.length ? `Built from ${facts.length} company records` : null,
        contextType: source ? "edit" : context,
        aspectRatio,
        edited: !!source,
        editParameters: null,
        saved: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ generation: row, facts }, { status: 201 });
  } catch (error) {
    await refundAiCredits(userId, 1, "studio refund");
    const ref = log.error("studio create failed", error);
    return NextResponse.json({ message: `${aiErrorMessage(error)} Your credit was returned.`, ref }, { status: 502 });
  }
}
