import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildUserPrompt, type Spec } from "@json-render/core";
import { emailCatalog } from "@/lib/catalog";
import { minuteRateLimit, dailyRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const maxDuration = 60;

const SYSTEM_PROMPT = emailCatalog.prompt();

const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";
const modelProvider = createOpenAI({
  baseURL: process.env.LLM_BASE_URL || "http://127.0.0.1:11434/v1",
  apiKey: process.env.LLM_API_KEY || "ollama",
});

export async function POST(req: Request) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";

  const [minuteResult, dailyResult] = await Promise.all([
    minuteRateLimit.limit(ip),
    dailyRateLimit.limit(ip),
  ]);

  if (!minuteResult.success || !dailyResult.success) {
    const isMinuteLimit = !minuteResult.success;
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: isMinuteLimit
          ? "Too many requests. Please wait a moment before trying again."
          : "Daily limit reached. Please try again tomorrow.",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { prompt, startingSpec } = (await req.json()) as {
    prompt: string;
    startingSpec?: Spec | null;
  };

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const userPrompt = buildUserPrompt({
    prompt,
    currentSpec: startingSpec,
  });

  const result = streamText({
    model: modelProvider(
      process.env.LLM_MODEL || process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL,
    ),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
