import { NextRequest, NextResponse } from "next/server";
import { MemoryService } from "@/lib/memory";

function toUserAssistantPairs(
  messages: { role: string; content: string }[]
): { user: string; assistant: string }[] {
  const pairs: { user: string; assistant: string }[] = [];
  for (let i = 0; i < messages.length - 1; i += 2) {
    const user = messages[i];
    const assistant = messages[i + 1];
    if (user?.role === "user" && assistant?.role === "assistant") {
      pairs.push({ user: user.content, assistant: assistant.content });
    }
  }
  return pairs;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const session = await MemoryService.getSessionHistory(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...session,
      history: toUserAssistantPairs(session.messages),
    });
  } catch (error) {
    console.error("Memory API GET session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
