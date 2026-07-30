import { NextResponse } from "next/server";
import { aiEmbed, aiErrorMessage, EMBEDDING_MODEL, hasLovableAi } from "@/lib/lovable-ai";

export async function POST(req: Request) {
  try {
    const { content, contents, taskType, outputDimensionality } = await req.json();

    if (!content && !contents) {
      return NextResponse.json(
        { error: "Content or contents array is required" },
        { status: 400 }
      );
    }

    if (!hasLovableAi()) {
      return NextResponse.json(
        { error: "AI is not configured on this deployment." },
        { status: 503 }
      );
    }

    const input: string[] = Array.isArray(contents)
      ? contents.map((c: unknown) => String(c))
      : [String(content)];

    // The gateway embedding model tops out at 1536 dimensions. A larger ask
    // is reduced instead of refused, so callers keep working.
    const dimensions =
      typeof outputDimensionality === "number"
        ? Math.min(outputDimensionality, 1536)
        : undefined;

    const vectors = await aiEmbed(input, dimensions);

    // Keep the response shape the existing callers read.
    return NextResponse.json({
      embeddings: vectors.map((values) => ({ values })),
      model: EMBEDDING_MODEL,
      taskType: taskType || "RETRIEVAL_DOCUMENT",
      dimensions: vectors[0]?.length ?? dimensions ?? 1536,
    });
  } catch (error: any) {
    console.error("Embedding error:", error);
    return NextResponse.json(
      { error: aiErrorMessage(error) },
      { status: 500 }
    );
  }
}
