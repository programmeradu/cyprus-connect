import { NextResponse } from "next/server";
import { z } from "zod";
import { generateImage } from "@/lib/generators";
import { checkAndDeductAiCredits } from '@/lib/ai-credits';
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('generate-image');

const bodySchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional().default("1:1"),
});

export async function POST(request: Request) {
  try {
    const result = await readJson(request, bodySchema);
    if (!result.ok) return result.response;
    const { prompt, aspectRatio } = result.data;

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Check + deduct AI credits (single source of truth: user.aiCreditsBalance)
    const creditGate = await checkAndDeductAiCredits(request, 1, 'image');
    if (!creditGate.ok) {
      return NextResponse.json({ error: creditGate.error }, { status: creditGate.status });
    }

    const generated = await generateImage(prompt, aspectRatio);

    return NextResponse.json(generated);
  } catch (error) {
    const ref = log.error("Image generation error", error);
    return NextResponse.json(
      { error: "Failed to generate image.", ref },
      { status: 500 }
    );
  }
}
