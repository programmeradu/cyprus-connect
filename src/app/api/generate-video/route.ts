import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { generateVideo } from "@/lib/generators";

export async function POST(request: Request) {
  try {
    const { prompt, aspectRatio = "16:9", durationSeconds = 8 } = await request.json();

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

    // Check AI credits allowance before processing
    const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/autumn/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        feature_id: 'ai_credits',
        required_balance: 1
      })
    });

    if (!checkResponse.ok) {
      return NextResponse.json(
        { error: "Insufficient AI credits. Please upgrade your plan or purchase more credits." },
        { status: 403 }
      );
    }

    const { allowed } = await checkResponse.json();
    if (!allowed) {
      return NextResponse.json(
        { error: "Insufficient AI credits. Please upgrade your plan or purchase more credits." },
        { status: 403 }
      );
    }

    const result = await generateVideo(prompt, aspectRatio, durationSeconds);

    // Track AI credit usage after successful generation
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/autumn/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        feature_id: 'ai_credits',
        value: 1,
        idempotency_key: `video-${Date.now()}-${Math.random()}`
      })
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Video generation error:", error);
    
    // Provide more helpful error messages
    let errorMessage = "Failed to generate video";
    if (error.message) {
      errorMessage = error.message;
    }
    
    // Handle common errors
    if (error.message?.includes("Generative Language API has not been used") || error.message?.includes("SERVICE_DISABLED")) {
      errorMessage = "Google Generative AI API is not enabled. Please enable it in the Google Cloud Console.";
    } else if (error.message?.includes("quota")) {
      errorMessage = "API quota exceeded. Please try again later.";
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Generation timed out. Try a simpler prompt.";
    } else if (error.message?.includes("invalid")) {
      errorMessage = "Invalid request. Please check your prompt and try again.";
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}