import { NextResponse } from "next/server";
import { aiErrorMessage, aiImage, hasLovableAi } from "@/lib/lovable-ai";

export async function POST(request: Request) {
  try {
    const { imageUrl, editPrompt } = await request.json();

    if (!imageUrl || !editPrompt) {
      return NextResponse.json(
        { error: "Image URL and edit prompt are required" },
        { status: 400 }
      );
    }

    if (!hasLovableAi()) {
      return NextResponse.json(
        { error: "AI is not configured on this deployment." },
        { status: 503 }
      );
    }

    // A remote address must be read into bytes first. A data URL is already
    // the bytes, so it passes straight through.
    let source = imageUrl as string;
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
    console.error("Image editing error:", error);
    return NextResponse.json(
      { error: aiErrorMessage(error) },
      { status: 500 }
    );
  }
}
