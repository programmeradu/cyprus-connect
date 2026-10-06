/**
 * Vuneli AI Client.
 *
 * One place for every model call in this app. Text and multimodal vision
 * route directly to Groq (https://api.groq.com/openai/v1) using GROQ_API_KEY.
 *
 * Server side only. Never import this file from a browser component.
 */

/** Text and reasoning. */
export const CHAT_MODEL = "openai/gpt-oss-120b";
/** Longer analysis where quality is more important than speed. */
export const CHAT_MODEL_PRO = "openai/gpt-oss-120b";
/** Image generation model placeholder. */
export const IMAGE_MODEL = "image-model";
/** Text embeddings model placeholder. */
export const EMBEDDING_MODEL = "embedding-model";

export class AiGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AiGatewayError";
    this.status = status;
  }
}

/* ---------------------------------------------------------------- providers
 * Text work (chat, Verde, agents, translations, rule reading) and vision
 * (bill photos) go directly to Groq.
 */

const GROQ = "https://api.groq.com/openai/v1";
/** Groq text model: tool calling, strict JSON schema, 131k context. */
export const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
/** Groq model that can look at pictures (bill photos). Per console.groq.com/docs/vision;
 *  llama-3.2-11b-vision-preview is decommissioned and returns 400. */
export const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b";

type Provider = "groq";

function groqKey(): string | undefined {
  return process.env.GROQ_API_KEY || undefined;
}

/** Chat, Verde, agents, translations and rule reading can run. */
export function hasTextAi(): boolean {
  return Boolean(groqKey());
}
/** Bills and documents can be read (photos and PDFs). */
export function hasDocumentAi(): boolean {
  return Boolean(groqKey());
}
/** Image generation is disabled without active image service. */
export function hasImageAi(): boolean {
  return false;
}
/** Embeddings are disabled without active embedding service. */
export function hasEmbeddingAi(): boolean {
  return false;
}
/** @deprecated Kept for backward compatibility. */
export function hasLovableAi(): boolean {
  return false;
}

function textProvider(): Provider {
  if (groqKey()) return "groq";
  throw new AiGatewayError(503, "AI is not configured on this deployment.");
}

/** Lovable model names map to the Groq text model; Groq names pass through. */
function groqModel(model: string | undefined): string {
  if (
    model &&
    (model.startsWith("llama-3.2-") ||
      model.startsWith("meta-llama/") ||
      model === GROQ_TEXT_MODEL ||
      model === GROQ_VISION_MODEL ||
      model.startsWith("qwen/") ||
      model.startsWith("moonshotai/"))
  ) {
    return model;
  }
  return process.env.GROQ_MODEL || GROQ_TEXT_MODEL;
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
    if (error.status === 401) {
      return "The AI key on this deployment was rejected. Check the key in the hosting settings.";
    }
    if (error.status === 503) {
      return "AI is not configured on this deployment.";
    }
    if (error.status === 422) {
      return error.message;
    }
    return "The AI request did not finish. Please try again.";
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

async function post(
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Response> {
  const key = groqKey();
  if (!key) throw new AiGatewayError(503, "AI is not configured on this deployment.");
  const payload = { ...body, model: groqModel(body.model as string | undefined) };
  const res = await fetch(`${GROQ}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new AiGatewayError(res.status, `Groq ${res.status}: ${detail}`);
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

/**
 * A call with content blocks, for a question that carries a picture or a
 * document with it.
 */
export async function aiChatRaw(
  messages: Array<{ role: string; content: unknown }>,
  temperature?: number,
  model: string = CHAT_MODEL,
): Promise<string> {
  if (!groqKey()) throw new AiGatewayError(503, "AI is not configured on this deployment.");

  const prepared = await prepareForGroq(messages);
  const res = await post(
    {
      model: prepared.hasImage ? GROQ_VISION_MODEL : groqModel(model),
      messages: prepared.messages,
      ...(temperature !== undefined ? { temperature } : {}),
    },
    undefined,
  );
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Groq accepts at most this many pictures per request. */
const GROQ_MAX_IMAGES = 5;
/** Characters of PDF text sent along; bills are short, this is generous. */
const PDF_TEXT_BUDGET = 60_000;

/**
 * Groq reads text and pictures but not PDF files. Turn each PDF into its
 * text layer with code. A scanned PDF has no text layer, so it is refused
 * with a sentence the person can act on, never guessed at.
 */
async function prepareForGroq(
  messages: Array<{ role: string; content: unknown }>,
): Promise<{ messages: Array<{ role: string; content: unknown }>; hasImage: boolean }> {
  let images = 0;
  const out: Array<{ role: string; content: unknown }> = [];
  for (const message of messages) {
    if (!Array.isArray(message.content)) {
      out.push(message);
      continue;
    }
    const parts: unknown[] = [];
    for (const part of message.content as Array<Record<string, unknown>>) {
      if (part?.type === "file") {
        const file = part.file as { file_data?: string } | undefined;
        const text = await pdfDataUrlToText(file?.file_data ?? "");
        if (!text) {
          throw new AiGatewayError(
            422,
            "This PDF is a scan with no readable text. Please upload a photo of the bill, or the original PDF from the supplier.",
          );
        }
        parts.push({ type: "text", text: `Document text:\n${text.slice(0, PDF_TEXT_BUDGET)}` });
      } else if (part?.type === "image_url") {
        images += 1;
        if (images > GROQ_MAX_IMAGES) {
          throw new AiGatewayError(422, `Please send at most ${GROQ_MAX_IMAGES} pictures at a time.`);
        }
        parts.push(part);
      } else {
        parts.push(part);
      }
    }
    // A text-only message is sent as a plain string; some models refuse arrays.
    const textOnly = parts.every((p) => (p as { type?: string }).type === "text");
    out.push({
      role: message.role,
      content: textOnly ? parts.map((p) => (p as { text: string }).text).join("\n\n") : parts,
    });
  }
  return { messages: out, hasImage: images > 0 };
}

async function pdfDataUrlToText(dataUrl: string): Promise<string> {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return "";
  try {
    const bytes = new Uint8Array(Buffer.from(dataUrl.slice(comma + 1), "base64"));
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const cleaned = (Array.isArray(text) ? text.join("\n") : text).replace(/[ \t]+/g, " ").trim();
    return cleaned.length >= 40 ? cleaned : "";
  } catch {
    return "";
  }
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
  _prompt: string,
  _images: ImageInput[] = [],
  _model: string = IMAGE_MODEL,
): Promise<string> {
  throw new AiGatewayError(503, "Image generation is not configured on this deployment.");
}

/** Embeddings for one or more texts. */
export async function aiEmbed(
  _input: string[],
  _dimensions?: number,
): Promise<number[][]> {
  throw new AiGatewayError(503, "Embeddings are not configured on this deployment.");
}

/* ------------------------------------------------------------- tool calling */

export interface ToolSpec {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type ToolTurnMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

/**
 * One turn of a tool-using conversation: the model either answers in text or
 * asks for tool calls. The caller runs the tools and sends the results back.
 */
export async function aiToolTurn(options: {
  messages: ToolTurnMessage[];
  tools: ToolSpec[];
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<{ content: string | null; toolCalls: ToolCall[]; finishReason: string | null }> {
  const res = await post(
    {
      model: options.model ?? CHAT_MODEL,
      messages: options.messages,
      tools: options.tools,
      tool_choice: "auto",
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    },
    options.signal,
  );
  const data = (await res.json()) as {
    choices?: Array<{ finish_reason?: string; message?: { content?: string | null; tool_calls?: ToolCall[] } }>;
  };
  const choice = data.choices?.[0];
  return {
    content: choice?.message?.content ?? null,
    toolCalls: (choice?.message?.tool_calls ?? []).filter((c) => c?.function?.name),
    finishReason: choice?.finish_reason ?? null,
  };
}

/** Default model for new text work on the Responses endpoint. */
export const RESPONSES_MODEL = "openai/gpt-6-astra";

/**
 * Structured answer through /v1/responses, streamed so long reasoning never
 * hits a buffered timeout. Returns the parsed object, or null when the text is
 * not valid JSON. Gateway failures throw AiGatewayError with the status.
 */
export async function aiResponsesJson<T>(options: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<T | null> {
  const res = await post(
    {
      model: GROQ_TEXT_MODEL,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: options.schemaName, schema: options.schema, strict: true },
      },
    },
    options.signal,
  );
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null; refusal?: string | null } }>;
  };
  const message = data.choices?.[0]?.message;
  if (!message?.content || message.refusal) return null;
  return parseJsonAnswer<T>(message.content);
}

/* ------------------------------------------------------- AI SDK model factory */

/**
 * The text model as an AI SDK language model, for streamed tool-using chat
 * (Verde). Configured directly on Groq.
 */
export async function textLanguageModel() {
  const groq = groqKey();
  if (!groq) throw new AiGatewayError(503, "AI is not configured on this deployment.");
  const { createGroq } = await import("@ai-sdk/groq");
  return { provider: "groq" as const, model: createGroq({ apiKey: groq })(process.env.GROQ_MODEL || GROQ_TEXT_MODEL) };
}
