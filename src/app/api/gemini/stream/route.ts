import { NextResponse } from "next/server";
import { z } from "zod";
import { aiChatStream, aiErrorMessage, hasLovableAi } from "@/lib/lovable-ai";
import { checkRateLimit, createRateLimitHeaders, getRequestIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

// Public (marketing assistant), so input is bounded and callers are rate-limited.
const StreamInput = z.object({
  prompt: z.string().trim().min(1).max(4000),
  context: z.string().max(8000).optional(),
});

export async function POST(req: Request) {
  try {
    const limit = checkRateLimit(`ai-stream:${getRequestIdentifier(req)}`, RATE_LIMITS.AI_GENERATION);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429, headers: createRateLimitHeaders(limit) }
      );
    }
    const parsed = StreamInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { prompt, context } = parsed.data;

    if (!hasLovableAi()) {
      return NextResponse.json(
        { error: "AI is not configured on this deployment." },
        { status: 503 }
      );
    }

    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const text of aiChatStream({
            messages: [{ role: "user", content: fullPrompt }],
          })) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: aiErrorMessage(error) })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI stream error:", error);
    return NextResponse.json(
      { error: aiErrorMessage(error) },
      { status: 500 }
    );
  }
}
