import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 60;

const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";
const modelProvider = createOpenAI({
  baseURL: process.env.LLM_BASE_URL || "http://127.0.0.1:11434/v1",
  apiKey: process.env.LLM_API_KEY || "ollama",
});

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: Request) {
  const { prompt, systemPrompt } = await req.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  try {
    const result = streamText({
      model: modelProvider(
        process.env.LLM_MODEL || process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL,
      ),
      system: systemPrompt ?? "You are a helpful UI builder.",
      prompt,
      temperature: 0.7,
    });

    const response = result.toTextStreamResponse();

    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}
