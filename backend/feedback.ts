import { TUTOR_SYSTEM_PROMPT } from "./prompts";

export interface ConversationTurn {
  user: string;
  assistant: string;
}

export interface FeedbackInput {
  image: string;
  transcript: string;
  history?: ConversationTurn[];
}

export interface FeedbackResult {
  text: string;
}

export interface FeedbackError {
  error: string;
}

export async function getFeedback(input: FeedbackInput): Promise<FeedbackResult | FeedbackError> {
  const { image, transcript, history = [] } = input;

  if (!image) {
    return { error: "Missing image" };
  }

  const transcriptText = typeof transcript === "string" ? transcript : "";
  const apiKey = process.env.FEATHERLESS_API_KEY;

  if (!apiKey) {
    return { error: "FEATHERLESS_API_KEY is not configured" };
  }

  const model = process.env.FEATHERLESS_MODEL || "google/gemma-3-27b-it";
  const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

  const messages: Array<{ role: string; content: unknown }> = [
    { role: "system", content: TUTOR_SYSTEM_PROMPT },
  ];

  for (const turn of history) {
    messages.push({
      role: "user",
      content: `The student said: "${turn.user}". (No image in this earlier turn.)`,
    });
    messages.push({ role: "assistant", content: turn.assistant });
  }

  const currentUserText = transcriptText
    ? `The student says: "${transcriptText}". What feedback do you have?`
    : "Look at what the student is working on. What feedback or observations do you have?";

  messages.push({
    role: "user",
    content: [
      { type: "text", text: currentUserText },
      { type: "image_url", image_url: { url: dataUrl } },
    ],
  });

  const response = await fetch("https://api.featherless.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Featherless API error:", response.status, err);

    let errorMessage = "Failed to get feedback from model";
    try {
      const errJson = JSON.parse(err);
      errorMessage = errJson.error?.message ?? errJson.message ?? errJson.detail ?? errorMessage;
    } catch {
      if (response.status === 401) errorMessage = "Invalid Featherless API key. Check your .env.";
      else if (response.status === 403) errorMessage = "Model is gated. Connect your HuggingFace account at https://featherless.ai/models/google/gemma-3-27b-it to verify access.";
      else if (response.status === 400) errorMessage = "Model is cold or starting. Wait a few minutes and try again.";
      else if (response.status === 503) errorMessage = "Featherless is busy. Try again in a few seconds.";
    }

    return { error: errorMessage };
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  return { text };
}
