import { NextResponse } from "next/server";
import { aiChatStream, aiErrorMessage, hasLovableAi } from "@/lib/lovable-ai";

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

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
