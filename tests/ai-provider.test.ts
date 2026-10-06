import { afterEach, describe, expect, it, vi } from "vitest";
import { aiChat, aiResponsesJson, aiChatRaw, hasTextAi, hasImageAi, AiGatewayError, GROQ_VISION_MODEL } from "@/lib/vuneli-ai";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  vi.unstubAllEnvs();
});

function mockFetch(content: string) {
  const calls: Array<{ url: string; body: Record<string, unknown>; headers: Record<string, string> }> = [];
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)), headers: init?.headers as Record<string, string> });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  }) as typeof fetch;
  return calls;
}

describe("AI provider routing", () => {
  it("sends text to Groq when GROQ_API_KEY is set", async () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    const calls = mockFetch("hello");
    expect(await aiChat({ messages: [{ role: "user", content: "hi" }] })).toBe("hello");
    expect(calls[0].url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(calls[0].headers.Authorization).toBe("Bearer gsk_test");
    expect(calls[0].body.model).toBe("openai/gpt-oss-120b");
    expect(hasTextAi()).toBe(true);
    expect(hasImageAi()).toBe(false);
  });

  it("uses Groq strict JSON schema for structured answers", async () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    const calls = mockFetch('{"ok":true}');
    const out = await aiResponsesJson<{ ok: boolean }>({
      system: "s", user: "u", schemaName: "x",
      schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
    });
    expect(out).toEqual({ ok: true });
    expect((calls[0].body.response_format as { type: string }).type).toBe("json_schema");
  });

  it("sends bill photos to the Groq vision model", async () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    const calls = mockFetch("{}");
    await aiChatRaw([{ role: "user", content: [{ type: "text", text: "read" }, { type: "image_url", image_url: { url: "data:image/png;base64,AAAA" } }] }], 0);
    expect(calls[0].body.model).toBe(GROQ_VISION_MODEL);
  });

  it("refuses a PDF with no text layer instead of guessing", async () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    mockFetch("{}");
    await expect(
      aiChatRaw([{ role: "user", content: [{ type: "file", file: { file_data: "data:application/pdf;base64,AAAA" } }] }]),
    ).rejects.toBeInstanceOf(AiGatewayError);
  });

  it("reports AI as off with no keys", () => {
    vi.stubEnv("GROQ_API_KEY", "");

    expect(hasTextAi()).toBe(false);
  });
});
