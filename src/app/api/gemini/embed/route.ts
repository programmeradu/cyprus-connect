import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { content, contents, taskType, outputDimensionality } = await req.json();

    if (!content && !contents) {
      return NextResponse.json(
        { error: "Content or contents array is required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const client = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    });

    const requestParams: any = {
      model: "gemini-embedding-001",
      contents: contents || content,
    };

    // Add optional parameters if provided
    if (taskType) {
      requestParams.taskType = taskType;
    }
    if (outputDimensionality) {
      requestParams.outputDimensionality = outputDimensionality;
    }

    const response = await client.models.embedContent(requestParams);

    // Return embeddings with metadata
    return NextResponse.json({
      embeddings: response.embeddings,
      model: "gemini-embedding-001",
      taskType: taskType || "RETRIEVAL_DOCUMENT",
      dimensions: outputDimensionality || 3072,
    });
  } catch (error: any) {
    console.error("Gemini embedding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate embeddings" },
      { status: 500 }
    );
  }
}
