import { NextRequest, NextResponse } from "next/server";
import { listConversations } from "@/backend/src/services/backboardHistory";

type InsightsPayload = {
  strengths: string[];
  improvements: string[];
  generatedAt: string;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const insightsCache = new Map<string, InsightsPayload>();

function parseInsights(text: string): { strengths: string[]; improvements: string[] } {
  const lines = text.split("\n").map((line) => line.trim());
  const strengths: string[] = [];
  const improvements: string[] = [];
  let section: "strengths" | "improvements" | null = null;

  for (const line of lines) {
    if (!line) continue;
    if (line.toLowerCase().startsWith("strengths")) {
      section = "strengths";
      continue;
    }
    if (line.toLowerCase().startsWith("opportunities")) {
      section = "improvements";
      continue;
    }
    const bullet = line.replace(/^[-*]\s+/, "");
    if (!bullet) continue;
    if (section === "strengths") strengths.push(bullet);
    if (section === "improvements") improvements.push(bullet);
  }

  return { strengths: strengths.slice(0, 3), improvements: improvements.slice(0, 3) };
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const cached = insightsCache.get(userId);
    if (cached) {
      const age = Date.now() - new Date(cached.generatedAt).getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ status: "ok", ...cached });
      }
    }

    const conversations = await listConversations(userId);
    const summaries = conversations
      .filter((item) => item.title && item.title !== "New Conversation")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((item) => item.title as string);

    if (summaries.length < 3) {
      return NextResponse.json({
        status: "insufficient",
        message: "Teach a few more sessions to unlock insights.",
        strengths: [],
        improvements: [],
      });
    }

    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "FEATHERLESS_API_KEY is not configured" }, { status: 500 });
    }

    const systemPrompt =
      "You are a teaching coach analyzing how a user explains concepts.\n" +
      "Below are summaries of the user’s recent teaching sessions.\n\n" +
      "Your task:\n" +
      "- Identify patterns in their teaching style.\n\n" +
      "Output format:\n" +
      "Strengths:\n" +
      "- (2–3 concise bullet points)\n\n" +
      "Opportunities to Improve:\n" +
      "- (2–3 concise bullet points)\n\n" +
      "Rules:\n" +
      "- Be constructive and supportive\n" +
      "- Do not repeat the summaries\n" +
      "- Do not reference specific sessions\n" +
      "- Do not ask questions\n" +
      "- Do not give step-by-step advice\n" +
      "- Keep each bullet to one sentence maximum";

    const prompt = `${systemPrompt}\n\nSummaries:\n${summaries
      .map((summary, index) => `${index + 1}. ${summary}`)
      .join("\n")}`;

    const model = process.env.FEATHERLESS_MODEL ?? "google/gemma-3-27b-it";
    const response = await fetch("https://api.featherless.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Featherless error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseInsights(content);
    const payload: InsightsPayload = {
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      generatedAt: new Date().toISOString(),
    };

    insightsCache.set(userId, payload);
    return NextResponse.json({ status: "ok", ...payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}