import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getVideoPrompt } from "@/lib/catalog";
import { minuteRateLimit, dailyRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const maxDuration = 30;

// Generate prompt from catalog - uses Remotion schema's prompt template with custom rules
const SYSTEM_PROMPT = getVideoPrompt();

const MAX_PROMPT_LENGTH = 500;
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

  const { prompt } = await req.json();

  const sanitizedPrompt = String(prompt || "").slice(0, MAX_PROMPT_LENGTH);

  const result = streamText({
    model: modelProvider(
      process.env.LLM_MODEL || process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL,
    ),
    system: SYSTEM_PROMPT,
    prompt: sanitizedPrompt,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
