import { NextRequest, NextResponse } from "next/server";
import { initConversation, getMessages, saveMessages, isBackboardServiceError } from "@/backend/src/services/backboard";
import { TUTOR_SYSTEM_PROMPT } from "@/backend/prompts";

type ChatRequest = {
  message: string;
  threadId?: string;
  userId?: string;
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type FeatherlessResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function buildPrompt(messages: ChatMessage[]): string {
  return messages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");
}

async function callGemma(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  if (!apiKey) {
    throw new Error("FEATHERLESS_API_KEY is not configured");
  }

  const model = process.env.FEATHERLESS_MODEL ?? "google/gemma-3-27b-it";
  const url = "https://api.featherless.ai/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn(`[featherless] messages[] failed: ${response.status} ${err}`);
    const prompt = buildPrompt(messages);

    const fallback = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!fallback.ok) {
      const fallbackErr = await fallback.text();
      throw new Error(`Featherless error: ${fallback.status} ${fallbackErr}`);
    }

    const fallbackData = (await fallback.json()) as FeatherlessResponse;
    return fallbackData.choices?.[0]?.message?.content ?? "";
  }

  const data = (await response.json()) as FeatherlessResponse;
  return data.choices?.[0]?.message?.content ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = body?.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }
    const userId = body.userId?.trim() ?? "local-user";
    let threadId = body.threadId?.trim();

    if (!threadId) {
      threadId = await initConversation(userId);
      console.log(`[chat] new threadId ${threadId}`);
    }

    const history = await getMessages(threadId);
    console.log(`[chat] loaded ${history.length} messages for ${threadId}`);

    const llmMessages: ChatMessage[] = [
      { role: "system", content: TUTOR_SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    const reply = await callGemma(llmMessages);
    const nextMessages: ChatMessage[] = [...history, { role: "user", content: message }, { role: "assistant", content: reply }];
    await saveMessages(threadId, nextMessages);
    console.log(`[chat] saved ${nextMessages.length} messages for ${threadId}`);

    return NextResponse.json({ reply, threadId });
  } catch (error) {
    if (isBackboardServiceError(error)) {
      console.error("Chat API Backboard error:", error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Chat API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
