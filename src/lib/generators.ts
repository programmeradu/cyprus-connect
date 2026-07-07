import { GoogleGenAI } from "@google/genai";
import { uploadBase64Image, uploadVideo } from "./supabase";

export interface GenerationResult {
  url: string;
  model: string;
  modelReason?: string;
  aspectRatio?: string;
  durationSeconds?: number;
  message?: string;
}

// Intelligent model selection: Gemini for text/infographics, Imagen for realistic/creative
export function selectImageModel(prompt: string): "imagen-4.0-generate-001" | "gemini-2.5-flash-image" {
  const geminiIndicators = [
    "text", "typography", "infographic", "diagram", "chart", "graph",
    "illustration", "vector", "flat design", "icon", "logo", "badge",
    "data visualization", "statistics", "numbers", "label", "caption",
    "quote", "headline", "poster", "flyer", "banner", "card design"
  ];
  
  const imagenIndicators = [
    "photorealistic", "realistic", "photo", "detailed", "high quality", 
    "professional photo", "4k", "hd", "cinematic", "creative", "artistic",
    "landscape", "portrait", "scene", "environment", "nature", "people",
    "product photography", "studio", "lighting", "texture", "real"
  ];
  
  const promptLower = prompt.toLowerCase();
  
  // Count indicators
  const geminiScore = geminiIndicators.filter(ind => promptLower.includes(ind)).length;
  const imagenScore = imagenIndicators.filter(ind => promptLower.includes(ind)).length;
  
  // If clear text/infographic indicators, use Gemini
  if (geminiScore > imagenScore) {
    return "gemini-2.5-flash-image";
  }
  
  // If realistic/creative indicators, use Imagen
  if (imagenScore > 0) {
    return "imagen-4.0-generate-001";
  }
  
  // For long, detailed prompts, use Imagen 4 for quality
  if (prompt.length > 300) {
    return "imagen-4.0-generate-001";
  }
  
  // Default to Imagen 4 for creative content
  return "imagen-4.0-generate-001";
}

async function generateImageWithModel(
  client: GoogleGenAI,
  model: string,
  prompt: string,
  aspectRatio: string
): Promise<string | null> {
  const response = await client.models.generateImages({
    model: model,
    prompt: prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: aspectRatio,
    },
  });

  // Extract image from response
  if (response.generatedImages && response.generatedImages.length > 0) {
    const generatedImage = response.generatedImages[0];
    
    // Handle inline data (base64)
    if (generatedImage.image?.imageBytes) {
      const imageData = generatedImage.image.imageBytes;
      const base64Data = `data:image/png;base64,${imageData}`;
      
      // Upload to Supabase and get HTTPS URL
      const fileName = `generated-${model.split('-')[0]}-${Date.now()}`;
      const httpsUrl = await uploadBase64Image(base64Data, fileName);
      
      // Return HTTPS URL if upload succeeded, otherwise return base64 as fallback
      return httpsUrl || base64Data;
    }
    
    // Handle URL (if returned)
    const imageUrl = (generatedImage as any).image?.url as string | undefined;
    if (imageUrl) {
      return imageUrl;
    }
  }

  return null;
}

export async function generateImage(
  prompt: string, 
  aspectRatio: string = "1:1"
): Promise<GenerationResult> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  });

  // Intelligently select model
  let selectedModel = selectImageModel(prompt);
  let imageUrl: string | null = null;
  let fallbackUsed = false;

  try {
    // Try with the selected model
    imageUrl = await generateImageWithModel(client, selectedModel, prompt, aspectRatio);
  } catch (error: any) {
    // If Gemini Flash Image fails (404 or not available), fallback to Imagen 4
    if (selectedModel === "gemini-2.5-flash-image" && (error.status === 404 || error.message?.includes("not found"))) {
      console.log("Gemini 2.5 Flash Image not available, falling back to Imagen 4");
      selectedModel = "imagen-4.0-generate-001";
      fallbackUsed = true;
      imageUrl = await generateImageWithModel(client, selectedModel, prompt, aspectRatio);
    } else {
      throw error;
    }
  }

  if (!imageUrl) {
    throw new Error("No image generated in response");
  }

  return {
    url: imageUrl,
    model: selectedModel,
    modelReason: selectedModel === "imagen-4.0-generate-001" 
      ? (fallbackUsed ? "Imagen 4 (fallback - Gemini not available)" : "Realistic & creative image generation")
      : "Text, infographics & illustrations",
    aspectRatio
  };
}

export async function generateVideo(
  prompt: string,
  aspectRatio: "16:9" | "9:16" | "1:1" = "16:9",
  durationSeconds: number = 8
): Promise<GenerationResult> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
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