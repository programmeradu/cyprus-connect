import { uploadBase64Image } from "./supabase";
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
