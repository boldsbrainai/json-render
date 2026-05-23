import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { headers } from "next/headers";
import { minuteRateLimit, dailyRateLimit } from "@/lib/rate-limit";
import { synthesizeSpeechDataUrl } from "@/lib/tts";

interface DialogMessage {
  text: string;
  audioUrl?: string;
}

const modelProvider = createOpenAI({
  baseURL: process.env.LLM_BASE_URL || "http://127.0.0.1:11434/v1",
  apiKey: process.env.LLM_API_KEY || "ollama",
});

const VOICE_MAP: Record<string, string> = {
  elder: "pNInz6obpgDQGcFmaJgB",
  old: "pNInz6obpgDQGcFmaJgB",
  wise: "pNInz6obpgDQGcFmaJgB",
  warrior: "AZnzlk1XvdvUeBnXmlld",
  soldier: "AZnzlk1XvdvUeBnXmlld",
  guard: "AZnzlk1XvdvUeBnXmlld",
  child: "MF3mGyEYCl7XYWbV9V6O",
  young: "MF3mGyEYCl7XYWbV9V6O",
  merchant: "jBpfuIE2acCO8z3wKNLl",
  trader: "jBpfuIE2acCO8z3wKNLl",
  wizard: "IKne3meq5aSn9XLyUdCD",
  mage: "IKne3meq5aSn9XLyUdCD",
  magic: "IKne3meq5aSn9XLyUdCD",
};

function getVoiceIdForRole(role: string): string {
  const lower = role.toLowerCase();
  for (const [keyword, voiceId] of Object.entries(VOICE_MAP)) {
    if (lower.includes(keyword)) return voiceId;
  }
  return "ThT5KcBeYPX3keUQqHPh";
}

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

  const { role } = await req.json();

  const prompt = `You are a character with the following role: "${role || "villager"}".
Generate 2-3 short messages that this character would say when interacted with.
Keep each message under 100 characters.
Return ONLY a JSON array of objects with a "text" field for each message.
Example: [{"text":"Hello traveler! Welcome to our village."}, {"text":"Can I help you with something?"}]`;

  try {
    const result = await streamText({
      model: modelProvider(
        process.env.LLM_MODEL ||
          process.env.AI_GATEWAY_MODEL ||
          "qwen2.5:7b-instruct",
      ),
      prompt,
    });

    let text = "";
    for await (const chunk of result.textStream) {
      text += chunk;
    }

    let messages: DialogMessage[] = [];
    try {
      const jsonMatch = text.match(/\[.*\]/s);
      const jsonString = jsonMatch ? jsonMatch[0] : "[]";
      messages = JSON.parse(jsonString);
    } catch {
      messages = [
        { text: "Hello there! How can I help you?" },
        { text: "It's a beautiful day, isn't it?" },
      ];
    }

    if (messages.length === 0) {
      messages = [
        { text: "Hello there! How can I help you?" },
        { text: "It's a beautiful day, isn't it?" },
      ];
    }

    const hasTTS = !!process.env.TTS_API_URL;
    if (hasTTS) {
      const voiceId = getVoiceIdForRole(role || "");
      const withAudio: DialogMessage[] = [];
      for (const msg of messages) {
        try {
          const { audioUrl } = await synthesizeSpeechDataUrl(msg.text, voiceId);
          withAudio.push({ ...msg, audioUrl });
        } catch {
          withAudio.push(msg);
        }
      }
      return Response.json({ messages: withAudio });
    }

    return Response.json({ messages });
  } catch {
    return Response.json({
      messages: [
        { text: "Hello there! How can I help you?" },
        { text: "It's a beautiful day, isn't it?" },
      ],
    });
  }
}
