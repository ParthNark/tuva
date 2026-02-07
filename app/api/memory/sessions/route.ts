import { NextRequest, NextResponse } from "next/server";
import { MemoryService } from "@/lib/memory";

export async function GET() {
  try {
    const sessions = await MemoryService.getSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Memory API GET sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

function toConversationMessages(
  pairs: { user: string; assistant: string }[]
): { role: "user" | "assistant"; content: string }[] {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const p of pairs) {
    out.push({ role: "user", content: p.user });
    out.push({ role: "assistant", content: p.assistant });
  }
  return out;
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messages, topic } = body;

    if (!sessionId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "sessionId and messages (array) required" },
        { status: 400 }
      );
    }

    const conv = toConversationMessages(messages);
    const result = await MemoryService.saveSession(sessionId, conv, topic);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Failed to save session" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Memory API PUT sessions error:", error);
    return NextResponse.json(
      { error: "Failed to save session" },
      { status: 500 }
    );
  }
}
