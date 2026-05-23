import { synthesizeSpeechDataUrl } from "@/lib/tts";

export async function POST(req: Request) {
  const { text, voiceId } = await req.json();

  if (!process.env.TTS_API_URL) {
    return new Response(JSON.stringify({ error: "TTS_API_URL not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { audioUrl } = await synthesizeSpeechDataUrl(text, voiceId);
    return Response.json({ audioUrl });
  } catch {
    return new Response(JSON.stringify({ error: "TTS generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
