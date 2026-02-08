import { NextRequest, NextResponse } from "next/server";
import { getFeedback } from "@/backend/feedback";
import { appendUserAndAssistantMessages, initConversation } from "@/backend/src/services/backboardHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await getFeedback({
      image: body.image,
      transcript: body.transcript,
      history: body.history ?? [],
    });

    if ("error" in result) {
      let status = 502;
      if (result.error.includes("Missing")) status = 400;
      else if (result.error.includes("not configured")) status = 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    const response = NextResponse.json({ text: result.text });

    const userId =
      (typeof body.userId === "string" ? body.userId.trim() : "") ||
      (typeof body.email === "string" ? body.email.trim() : "");
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (userId) {
      const existingThread = request.cookies.get("tuva_history_thread")?.value ?? "";
      const existingUser = request.cookies.get("tuva_history_user")?.value ?? "";
      const existingSession = request.cookies.get("tuva_history_session")?.value ?? "";

      let threadId = existingThread;
      if (!threadId || existingUser !== userId || (sessionId && existingSession !== sessionId)) {
        threadId = await initConversation(userId);
        response.cookies.set("tuva_history_thread", threadId, { path: "/", httpOnly: true, sameSite: "lax" });
        response.cookies.set("tuva_history_user", userId, { path: "/", httpOnly: true, sameSite: "lax" });
        if (sessionId) {
          response.cookies.set("tuva_history_session", sessionId, { path: "/", httpOnly: true, sameSite: "lax" });
        }
        console.log(`[history] initConversation from feedback: userId=${userId} threadId=${threadId}`);
      } else {
        console.log(`[history] reuse thread from feedback: userId=${userId} threadId=${threadId}`);
      }

      try {
        const transcript = typeof body.transcript === "string" ? body.transcript : "";
        await appendUserAndAssistantMessages(threadId, userId, transcript, result.text);
        console.log(`[history] saved feedback messages: userId=${userId} threadId=${threadId}`);
      } catch (err) {
        console.error("History persistence error:", err);
      }
    } else {
      console.warn("History persistence skipped: missing userId");
    }

    return response;
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
