export interface SpeechInput {
  text: string;
}

export async function generateSpeech(input: SpeechInput): Promise<ArrayBuffer | { error: string }> {
  const { text } = input;

  if (!text || typeof text !== "string") {
    return { error: "Missing text" };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

  if (!apiKey) {
    return { error: "ELEVENLABS_API_KEY is not configured" };
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("ElevenLabs API error:", response.status, err);

    let errorMessage = "Failed to generate speech";
    try {
      const errJson = JSON.parse(err);
      if (errJson.detail?.message) errorMessage = errJson.detail.message;
      else if (errJson.detail) errorMessage = String(errJson.detail);
    } catch {
      if (response.status === 401) errorMessage = "Invalid ElevenLabs API key";
      else if (response.status === 402) errorMessage = "ElevenLabs quota exceeded";
      else if (response.status === 422) errorMessage = "Invalid request to ElevenLabs";
    }

    return { error: errorMessage };
  }

  return response.arrayBuffer();
}
