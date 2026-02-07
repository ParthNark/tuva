import { NextRequest, NextResponse } from "next/server";
import { addMessage, createThread, getThreadMessages } from "@/lib/backboard";

type ChatRequest = {
  message: string;
  threadId?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function toGeminiContents(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  latestUserMessage: string
) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  contents.push({
    role: "user",
    parts: [{ text: latestUserMessage }],
  });

  return contents;
}

async function callGemini(messages: Array<{ role: "user" | "assistant"; content: string }>, latestUserMessage: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: toGeminiContents(messages, latestUserMessage),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = body?.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    let threadId = body.threadId;
    if (!threadId) {
      const thread = await createThread();
      threadId = thread.id;
    }

    const history = await getThreadMessages(threadId);
    const reply = await callGemini(
      history.map((m) => ({ role: m.role, content: m.content })),
      message
    );

    void Promise.allSettled([
      addMessage(threadId, "user", message),
      addMessage(threadId, "assistant", reply),
    ]);

    return NextResponse.json({ reply, threadId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Chat API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
