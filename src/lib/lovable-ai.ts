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

/* ---------------------------------------------------------------- providers
 * Text work (chat, Verde, agents, translations, rule reading) goes to Groq
 * when GROQ_API_KEY is set, else to the Lovable gateway. Image generation and
 * embeddings exist only on the Lovable gateway. Bill reading prefers the
 * Lovable gateway (reads scanned PDFs); with Groq only, photos go to Groq's
 * vision model and PDFs are turned into text by code first.
 */

const GROQ = "https://api.groq.com/openai/v1";
/** Groq text model: tool calling, strict JSON schema, 131k context. */
export const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
/** Groq model that can look at pictures (bill photos). */
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

type Provider = "groq" | "lovable";

function groqKey(): string | undefined {
  return process.env.GROQ_API_KEY || undefined;
}
function lovableKey(): string | undefined {
  return process.env.LOVABLE_API_KEY || undefined;
}

/** Chat, Verde, agents, translations and rule reading can run. */
export function hasTextAi(): boolean {
  return Boolean(groqKey() || lovableKey());
}
/** Bills and documents can be read (photos and PDFs). */
export function hasDocumentAi(): boolean {
  return Boolean(groqKey() || lovableKey());
}
/** Image generation and editing can run (Lovable gateway only). */
export function hasImageAi(): boolean {
  return Boolean(lovableKey());
}
/** Embeddings can run (Lovable gateway only). */
export function hasEmbeddingAi(): boolean {
  return Boolean(lovableKey());
}
/** @deprecated Use hasTextAi / hasDocumentAi / hasImageAi / hasEmbeddingAi. */
export function hasLovableAi(): boolean {
  return Boolean(lovableKey());
}

function textProvider(): Provider {
  if (groqKey()) return "groq";
  if (lovableKey()) return "lovable";
  throw new AiGatewayError(503, "AI is not configured on this deployment.");
}

function requireKey(): string {
  const key = lovableKey();
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

/** Lovable model names map to the Groq text model; Groq names pass through. */
function groqModel(model: string | undefined): string {
  if (model && (model.startsWith("meta-llama/") || model === GROQ_TEXT_MODEL || model.startsWith("qwen/") || model.startsWith("moonshotai/"))) {
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
  provider: Provider = textProvider(),
): Promise<Response> {
  const groq = provider === "groq";
  const payload = groq ? { ...body, model: groqModel(body.model as string | undefined) } : body;
  const res = await fetch(`${groq ? GROQ : GATEWAY}/chat/completions`, {
    method: "POST",
    headers: groq
      ? { "Content-Type": "application/json", Authorization: `Bearer ${groqKey()}` }
      : headers(requireKey()),
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new AiGatewayError(res.status, `${groq ? "Groq" : "AI gateway"} ${res.status}: ${detail}`);
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
  // Documents prefer the Lovable gateway, which reads scanned PDFs natively.
  if (lovableKey()) {
    const res = await post({ model, messages, ...(temperature !== undefined ? { temperature } : {}) }, undefined, "lovable");
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  }
  if (!groqKey()) throw new AiGatewayError(503, "AI is not configured on this deployment.");

  const prepared = await prepareForGroq(messages);
  const res = await post(
    {
      model: prepared.hasImage ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL,
      messages: prepared.messages,
      ...(temperature !== undefined ? { temperature } : {}),
    },
    undefined,
    "groq",
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

  const res = await post(
    {
      model,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: parts }],
    },
    undefined,
    "lovable",
  );

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
  if (textProvider() === "groq") {
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
      "groq",
    );
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null; refusal?: string | null } }>;
    };
    const message = data.choices?.[0]?.message;
    if (!message?.content || message.refusal) return null;
    return parseJsonAnswer<T>(message.content);
  }
  const res = await fetch(`${GATEWAY}/responses`, {
    method: "POST",
    headers: headers(requireKey()),
    signal: options.signal,
    body: JSON.stringify({
      model: RESPONSES_MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
      text: { format: { type: "json_schema", name: options.schemaName, schema: options.schema, strict: true } },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new AiGatewayError(res.status, `AI gateway ${res.status}: ${detail}`);
  }
  if (!res.body) return null;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let refused = false;
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
        const ev = JSON.parse(payload) as { type?: string; delta?: string; response?: { error?: { message?: string } } };
        if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
        else if (ev.type === "response.refusal.delta") refused = true;
        else if (ev.type === "response.failed" || ev.type === "error") {
          throw new AiGatewayError(502, ev.response?.error?.message ?? "The AI run failed.");
        }
      } catch (e) {
        if (e instanceof AiGatewayError) throw e;
      }
    }
  }
  if (refused || !text) return null;
  return parseJsonAnswer<T>(text);
}
