export interface TranscribeInput {
  audio: ArrayBuffer;
  mimeType?: string;
}

export type TranscribeResult = { text: string } | { error: string };

export async function transcribeAudio(input: TranscribeInput): Promise<TranscribeResult> {
  const { audio, mimeType = "audio/webm" } = input;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { error: "ELEVENLABS_API_KEY is not configured" };
  }

  const blob = new Blob([audio], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, "recording.webm");
  formData.append("model_id", "scribe_v2");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("ElevenLabs transcription error:", response.status, err);

    let errorMessage = "Failed to transcribe audio";
    try {
      const errJson = JSON.parse(err);
      if (errJson.detail?.message) errorMessage = errJson.detail.message;
      else if (errJson.detail) errorMessage = String(errJson.detail);
    } catch {
      if (response.status === 401) errorMessage = "Invalid ElevenLabs API key";
      if (response.status === 402) errorMessage = "ElevenLabs quota exceeded";
    }

    return { error: errorMessage };
  }

  const data = (await response.json()) as { text?: string };
  const text = (data.text ?? "").trim();

  return { text };
}
