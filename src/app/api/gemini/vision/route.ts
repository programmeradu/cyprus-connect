import { NextResponse } from "next/server";
import { aiErrorMessage, aiImage, hasLovableAi } from "@/lib/lovable-ai";

export async function POST(req: Request) {
  try {
    const { imageUrl, prompt } = await req.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Both imageUrl and prompt are required" },
        { status: 400 }
      );
    }

    if (!hasLovableAi()) {
      return NextResponse.json(
        { error: "AI is not configured on this deployment." },
        { status: 503 }
      );
    }

    // The reference image holds the style. The instruction says so plainly,
    // because the model reads the reference and the text as one request.
    const generatedImage = await aiImage(
      `Use the attached image only as a style and brand reference. Keep its palette, mark and mood. Then make this image: ${prompt}. Square framing.`,
      [{ data: imageUrl, mimeType: "image/png" }]
    );

    return NextResponse.json({ generatedImage, success: true });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: aiErrorMessage(error) },
      { status: 500 }
    );
  }
}
