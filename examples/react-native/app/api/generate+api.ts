import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildUserPrompt } from "@json-render/core";
import { catalog, customRules } from "../../lib/render/catalog";

const SYSTEM_PROMPT = catalog.prompt({ customRules });

const MAX_PROMPT_LENGTH = 500;
const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

// Expo requires explicit env access in application code, so the provider is
// configured directly instead of relying on hidden process.env reads.
const modelProvider = createOpenAI({
  baseURL: process.env.LLM_BASE_URL || "http://127.0.0.1:11434/v1",
  apiKey: process.env.LLM_API_KEY || "ollama",
});

export async function POST(req: Request) {
  console.log("[API] POST /api/generate called");
  console.log("[API] API key present:", !!process.env.LLM_API_KEY);
  console.log(
    "[API] Model:",
    process.env.LLM_MODEL || process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL,
  );

  try {
    const { prompt, context } = await req.json();
    console.log("[API] prompt:", prompt);

    const userPrompt = buildUserPrompt({
      prompt,
      currentSpec: context?.previousSpec,
      state: context?.state,
      maxPromptLength: MAX_PROMPT_LENGTH,
    });

    const modelId =
      process.env.LLM_MODEL || process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL;
    const model = modelProvider(modelId);

    console.log("[API] calling streamText with model:", modelId);
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });

    console.log("[API] returning text stream response");
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("API generate error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
