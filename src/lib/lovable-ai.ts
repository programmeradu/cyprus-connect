/**
 * Lovable AI Gateway client.
 *
 * One place for every model call in this app. The gateway is OpenAI
 * compatible and authenticates with LOVABLE_API_KEY, which Lovable
 * provisions for this project. No Google key is necessary.
 *
 * Server side only. Never import this file from a browser component.
 */

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

/** Text and reasoning. */
export const CHAT_MODEL = "google/gemini-2.5-flash";
/** Longer analysis where quality is more important than speed. */
export const CHAT_MODEL_PRO = "google/gemini-2.5-pro";
/** Image generation and image editing. */
export const IMAGE_MODEL = "google/gemini-2.5-flash-image";
/** Text embeddings. */
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export class AiGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AiGatewayError";
    this.status = status;
  }
}

export function hasLovableAi(): boolean {
  return Boolean(process.env.LOVABLE_API_KEY);
}

function requireKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    throw new AiGatewayError(503, "AI is not configured on this deployment.");
  }
  return key;
}

function headers(key: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Lovable-API-Key": key,
    "X-Lovable-AIG-SDK": "fetch",
  };
}

/**
 * Turn a gateway failure into a sentence an operator can act on. A generic
 * "try again" hides an exhausted balance, and the person then retries
 * forever against a wall.
 */
export function aiErrorMessage(error: unknown): string {
  if (error instanceof AiGatewayError) {
    if (error.status === 429) {
      return "The AI service is busy right now. Please try again in a minute.";
    }
    if (error.status === 402) {
      return "The AI credits for this workspace are used up. Add credits in workspace settings.";
    }
    if (error.status === 503) {
      return "AI is not configured on this deployment.";
    }
    return error.message;
  }
  const text = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  if (text.includes("timeout") || text.includes("aborted")) {
    return "The answer took too long and stopped. Please ask again, or make the question smaller.";
  }
  return "The AI request did not finish. Please try again.";
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  /** Ask the model for a JSON object body. */
  json?: boolean;
  signal?: AbortSignal;
}

async function post(body: unknown, signal?: AbortSignal): Promise<Response> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: headers(requireKey()),
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new AiGatewayError(res.status, `AI gateway ${res.status}: ${detail}`);
  }
  return res;
}

/** One answer, returned complete. */
export async function aiChat(options: ChatOptions): Promise<string> {
  const res = await post(
    {
      model: options.model ?? CHAT_MODEL,
      messages: options.messages,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    },
    options.signal,
  );
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Same call, but the text arrives in pieces. */
export async function* aiChatStream(options: ChatOptions): AsyncGenerator<string> {
  const res = await post(
    {
      model: options.model ?? CHAT_MODEL,
      messages: options.messages,
      stream: true,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    },
    options.signal,
  );
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        /* a partial frame; the next read completes it */
      }
    }
  }
}

/** Parse a JSON answer, with fenced code blocks removed. */
export function parseJsonAnswer<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}

export interface ImageInput {
  /** A full data URL, or raw base64 with mimeType given. */
  data: string;
  mimeType?: string;
}

/**
 * Generate or edit an image. Pass reference images to edit or to hold a
 * style. The answer is a PNG data URL.
 */
export async function aiImage(
  prompt: string,
  images: ImageInput[] = [],
  model: string = IMAGE_MODEL,
): Promise<string> {
  const parts: Array<Record<string, unknown>> = images.map((image) => ({
    type: "image_url",
    image_url: {
      url: image.data.startsWith("data:")
        ? image.data
        : `data:${image.mimeType ?? "image/png"};base64,${image.data}`,
    },
  }));
  parts.push({ type: "text", text: prompt });

  const res = await post({
    model,
    modalities: ["image", "text"],
    messages: [{ role: "user", content: parts }],
  });

  const data = (await res.json()) as {
    choices?: Array<{
      message?: { images?: Array<{ image_url?: { url?: string } }>; content?: string };
    }>;
  };
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) {
    throw new AiGatewayError(502, "The AI service returned no image.");
  }
  return url;
}

/** Embeddings for one or more texts. */
export async function aiEmbed(
  input: string[],
  dimensions?: number,
): Promise<number[][]> {
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: headers(requireKey()),
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input,
      ...(dimensions ? { dimensions } : {}),
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new AiGatewayError(res.status, `AI gateway ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  return (data.data ?? []).map((row) => row.embedding);
}
