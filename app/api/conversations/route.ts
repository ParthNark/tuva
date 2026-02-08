import { NextRequest, NextResponse } from "next/server";
import { initConversation, listConversations } from "@/backend/src/services/backboardHistory";

export async function GET(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get("userId")?.trim() ||
      request.nextUrl.searchParams.get("email")?.trim();
    if (!userId) {
      return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
    }

    const conversations = await listConversations(userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list conversations";
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; email?: string; topic?: string };
    const userId = body.userId?.trim() || body.email?.trim();
    if (!userId) {
      return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
    }

    const conversationId = await initConversation(userId);
    return NextResponse.json({ conversationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create conversation";
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}
