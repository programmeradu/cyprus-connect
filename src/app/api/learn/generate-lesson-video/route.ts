import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/generators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonTitle, lessonContent, duration = 8 } = body;

    if (!lessonTitle) {
      return NextResponse.json(
        { error: "Lesson title is required" },
        { status: 400 }
      );
    }

    // Generate a sustainability-focused video prompt
    const videoPrompt = generateVideoPrompt(lessonTitle, lessonContent);

    // Use centralized video generator (automatically uploads to Supabase)
    const result = await generateVideo(videoPrompt, "16:9", duration);

    return NextResponse.json({
      videoUrl: result.url,
      prompt: videoPrompt,
      duration: result.durationSeconds || duration,
      model: result.model,
      message: result.message
    });

  } catch (error: any) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate video" },
      { status: 500 }
    );
  }
}

function generateVideoPrompt(title: string, content?: string): string {
  // Create a cinematic, educational video prompt for sustainability topics
  const basePrompt = `A professional educational video for sustainability training.

Topic: ${title}

Style: Clean, modern, professional business setting with natural lighting. 
Camera: Medium shots and close-ups with smooth transitions.
Tone: Educational, positive, and inspiring about sustainable business practices.

Content: 
${content ? `Focus on: ${content}` : "Show relevant sustainability concepts visually"}

Include:
- Professional business environment
- Green/eco-friendly visual elements
- Data visualizations and charts if relevant
- Natural outdoor elements (plants, greenery)
- Diverse team of professionals
- Positive, action-oriented atmosphere

Cinematic quality with ambient sound design.`;

  return basePrompt;
}