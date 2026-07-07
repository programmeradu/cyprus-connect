import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const client = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    });

    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await client.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [{ text: fullPrompt }],
              },
            ],
          });

          for await (const chunk of result) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
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
    console.error("Gemini stream error:", error);
    return NextResponse.json(
      { error: error.message || "Stream failed" },
      { status: 500 }
    );
  }
}