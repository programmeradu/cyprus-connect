import { NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorMessage, aiImage, hasLovableAi } from "@/lib/lovable-ai";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("edit-image");

const bodySchema = z.object({
  imageUrl: z.string().trim().min(1).max(2_000_000),
  editPrompt: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request) {
  const parsed = await readJson(request, bodySchema, 4 * 1024 * 1024);
  if (!parsed.ok) return parsed.response;
  const { imageUrl, editPrompt } = parsed.data;

  if (!hasLovableAi()) {
    return NextResponse.json(
      { error: "AI is not configured on this deployment." },
      { status: 503 }
    );
  }

  try {
    let source = imageUrl;
    let mimeType = "image/png";
    if (!source.startsWith("data:")) {
      const imageResponse = await fetch(source);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: "The source image could not be read." },
          { status: 400 }
        );
      }
      mimeType = imageResponse.headers.get("content-type") ?? "image/png";
      const buffer = await imageResponse.arrayBuffer();
      source = Buffer.from(buffer).toString("base64");
    }

    const url = await aiImage(editPrompt, [{ data: source, mimeType }]);

    return NextResponse.json({ url, originalPrompt: editPrompt });
  } catch (error: any) {
    const ref = log.error("Image editing error", error);
    return NextResponse.json(
      { error: aiErrorMessage(error), ref },
      { status: 500 }
    );
  }
}
