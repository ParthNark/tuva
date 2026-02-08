import { NextRequest, NextResponse } from "next/server";
import {
  getConversation,
  appendUserAndAssistantMessages,
  HistoryMessage,
} from "@/backend/src/services/backboardHistory";
import { STUDENT_SYSTEM_PROMPT } from "@/backend/prompts";

type ChatRequest = {
  userId?: string;
  message?: string;
};

type FeatherlessResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function buildPrompt(messages: HistoryMessage[]): string {
  return messages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");
}

async function callGemma(messages: HistoryMessage[]): Promise<string> {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId =
      request.nextUrl.searchParams.get("userId")?.trim() ||
      request.nextUrl.searchParams.get("email")?.trim();

    if (!id) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
    }

    const conversation = await getConversation(id, userId);
    return NextResponse.json(conversation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch conversation";
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as ChatRequest;
    const userId = body.userId?.trim() || body.email?.trim();
    const message = body.message?.trim();

    if (!id) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const conversation = await getConversation(id, userId);
    const history: HistoryMessage[] = [
      { role: "system", content: STUDENT_SYSTEM_PROMPT },
      ...conversation.messages,
      { role: "user", content: message },
    ];
    const assistantReply = await callGemma(history);
    await appendUserAndAssistantMessages(id, userId, message, assistantReply);

    const updated = await getConversation(id, userId);
    return NextResponse.json({ reply: assistantReply, messages: updated.messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message";
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}
