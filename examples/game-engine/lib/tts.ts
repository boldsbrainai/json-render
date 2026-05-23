export async function synthesizeSpeechDataUrl(text: string, voiceId?: string) {
  const ttsUrl = process.env.TTS_API_URL;

  if (!ttsUrl) {
    throw new Error("TTS_API_URL not set");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.TTS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.TTS_API_KEY}`;
  }

  const response = await fetch(ttsUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text,
      voiceId,
      speaker: voiceId,
      provider: process.env.TTS_PROVIDER || "piper",
    }),
  });

  if (!response.ok) {
    throw new Error("TTS generation failed");
  }

  const contentType = response.headers.get("content-type") || "audio/mpeg";
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    audioUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
    contentType,
  };
}
