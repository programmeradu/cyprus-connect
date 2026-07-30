import { GoogleGenAI } from "@google/genai";
import { uploadBase64Image, uploadVideo } from "./supabase";
import { aiImage, hasLovableAi } from "./lovable-ai";

export interface GenerationResult {
  url: string;
  model: string;
  modelReason?: string;
  aspectRatio?: string;
  durationSeconds?: number;
  message?: string;
}

/** The fast image model, best for text, icons and flat illustration. */
const FLASH_IMAGE = "google/gemini-2.5-flash-image";
/** The slower image model, best for photographic and detailed work. */
const PRO_IMAGE = "google/gemini-3-pro-image";

/**
 * Choose the image model from the words in the prompt. Flat, typographic or
 * diagram work goes to the fast model. Photographic work goes to the pro
 * model, which holds detail better.
 */
export function selectImageModel(prompt: string): string {
  const flatIndicators = [
    "text", "typography", "infographic", "diagram", "chart", "graph",
    "illustration", "vector", "flat design", "icon", "logo", "badge",
    "data visualization", "statistics", "numbers", "label", "caption",
    "quote", "headline", "poster", "flyer", "banner", "card design",
  ];

  const photoIndicators = [
    "photorealistic", "realistic", "photo", "detailed", "high quality",
    "professional photo", "4k", "hd", "cinematic", "creative", "artistic",
    "landscape", "portrait", "scene", "environment", "nature", "people",
    "product photography", "studio", "lighting", "texture", "real",
  ];

  const promptLower = prompt.toLowerCase();
  const flatScore = flatIndicators.filter((ind) => promptLower.includes(ind)).length;
  const photoScore = photoIndicators.filter((ind) => promptLower.includes(ind)).length;

  if (flatScore > photoScore) return FLASH_IMAGE;
  if (photoScore > 0) return PRO_IMAGE;
  if (prompt.length > 300) return PRO_IMAGE;
  return PRO_IMAGE;
}

/**
 * The gateway image models read the frame from the instruction, not from a
 * separate field, so the ratio is written into the prompt.
 */
function withAspect(prompt: string, aspectRatio: string): string {
  return `${prompt}\n\nFrame the image with a ${aspectRatio} aspect ratio.`;
}

export async function generateImage(
  prompt: string,
  aspectRatio: string = "1:1"
): Promise<GenerationResult> {
  if (!hasLovableAi()) {
    throw new Error("AI is not configured on this deployment.");
  }

  let selectedModel = selectImageModel(prompt);
  let fallbackUsed = false;
  let dataUrl: string;

  try {
    dataUrl = await aiImage(withAspect(prompt, aspectRatio), [], selectedModel);
  } catch (error) {
    // The pro model can be busy. The fast model still returns a usable image.
    if (selectedModel === PRO_IMAGE) {
      selectedModel = FLASH_IMAGE;
      fallbackUsed = true;
      dataUrl = await aiImage(withAspect(prompt, aspectRatio), [], selectedModel);
    } else {
      throw error;
    }
  }

  // Store the bytes so the caller gets a stable HTTPS address.
  const fileName = `generated-${Date.now()}`;
  const hostedUrl = await uploadBase64Image(dataUrl, fileName);

  return {
    url: hostedUrl || dataUrl,
    model: selectedModel,
    modelReason:
      selectedModel === PRO_IMAGE
        ? "Realistic and detailed image generation"
        : fallbackUsed
          ? "Fast image model (the pro model was not available)"
          : "Text, infographics and illustrations",
    aspectRatio,
  };
}

export async function generateVideo(
  prompt: string,
  aspectRatio: "16:9" | "9:16" | "1:1" = "16:9",
  durationSeconds: number = 8
): Promise<GenerationResult> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error(
      "Video generation needs a Google Veo key. Set GOOGLE_GEMINI_API_KEY to switch it on.",
    );
  }

  const client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  });

  console.log("Starting video generation with Veo 3.1...");
  console.log("Prompt:", prompt);

  // Clamp duration to valid range (4-8 seconds for Veo 3.1)
  const validDuration = Math.max(4, Math.min(durationSeconds, 8));

  // Generate video with Veo 3.1 (high-fidelity 720p with native audio)
  let operation = await client.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: prompt,
    config: {
      aspectRatio: aspectRatio,
      durationSeconds: validDuration,
      resolution: "720p"
    }
  });

  console.log("Video generation started, operation ID:", operation.name);
  
  // Poll the operation status until the video is ready
  let pollCount = 0;
  const maxPolls = 120; // Max 20 minutes (120 * 10 seconds)
  
  while (!operation.done && pollCount < maxPolls) {
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
    operation = await client.operations.getVideosOperation({
      operation: operation,
    });
    pollCount++;
    console.log(`Poll ${pollCount}/${maxPolls} - Done: ${operation.done}`);
  }

  if (!operation.done) {
    throw new Error("Video generation timed out");
  }

  // Extract video URL from response
  const generatedVideos = operation.response?.generatedVideos;
  
  if (!generatedVideos || generatedVideos.length === 0) {
    throw new Error("Failed to generate video. No video data in response.");
  }

  const generatedVideo = generatedVideos[0];
  
  if (!generatedVideo?.video) {
    throw new Error("Failed to generate video. Invalid video data structure.");
  }

  // The video object contains the URL
  const videoUrl = (generatedVideo as any).video?.url || (generatedVideo as any).video?.uri;

  if (!videoUrl) {
    throw new Error("Failed to extract video URL from response.");
  }

  // Upload video to Supabase and get permanent URL
  console.log("Uploading video to Supabase storage...");
  const fileName = `generated-veo-${Date.now()}`;
  const supabaseUrl = await uploadVideo(videoUrl, fileName);
  
  console.log("Video uploaded to Supabase:", supabaseUrl);

  return {
    url: supabaseUrl,
    model: "veo-3.1-generate-preview",
    aspectRatio,
    durationSeconds,
    message: "Video generated successfully with Veo 3.1 and uploaded to Supabase"
  };
}