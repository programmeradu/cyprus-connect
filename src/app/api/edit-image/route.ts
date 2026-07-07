import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageUrl, editPrompt } = await request.json();

    if (!imageUrl || !editPrompt) {
      return NextResponse.json(
        { error: "Image URL and edit prompt are required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    });

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Use Gemini 2.5 Flash Image for natural language editing
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Image,
              },
            },
            {
              text: editPrompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["Image"],
      },
    });

    // Extract the edited image - correct response structure
    let editedImageUrl = null;
    const parts = response.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData) {
        editedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!editedImageUrl) {
      throw new Error("No image generated from edit request");
    }

    return NextResponse.json({
      url: editedImageUrl,
      originalPrompt: editPrompt,
    });
  } catch (error: any) {
    console.error("Image editing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to edit image" },
      { status: 500 }
    );
  }
}