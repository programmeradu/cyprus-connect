import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { generateImage } from "@/lib/generators";
import { checkAndDeductAiCredits } from '@/lib/ai-credits';

export async function POST(request: Request) {
  try {
    const { prompt, aspectRatio = "1:1" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Check + deduct AI credits (single source of truth: user.aiCreditsBalance)
    const creditGate = await checkAndDeductAiCredits(request, 1, 'image'), 1, 'image');
    if (!creditGate.ok) {
      return NextResponse.json({ error: creditGate.error }, { status: creditGate.status });
    }

    const result = await generateImage(prompt, aspectRatio);


    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error("Image generation error:", error);
    
    let errorMessage = "Failed to generate image";
    if (error.message) {
      errorMessage = error.message;
    }

    // Handle common errors
    if (error.message?.includes("Generative Language API has not been used") || error.message?.includes("SERVICE_DISABLED")) {
      errorMessage = "Google Generative AI API is not enabled. Please enable it in the Google Cloud Console.";
    } else if (error.message?.includes("quota")) {
      errorMessage = "API quota exceeded. Please try again later.";
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}