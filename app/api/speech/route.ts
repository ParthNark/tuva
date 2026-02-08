import { NextRequest, NextResponse } from "next/server";
import { generateSpeech } from "@/backend/speech";

export async function POST(request: NextRequest) {
  try {
    const { text, mode } = await request.json();
    const isTestMode = mode === "test" || mode === "testing";
    const voiceId = isTestMode
      ? process.env.ELEVENLABS_TEST_VOICE_ID
      : undefined;

    const result = await generateSpeech({ text, voiceId });

    if (result instanceof ArrayBuffer) {
      return new NextResponse(result, {
        headers: { "Content-Type": "audio/mpeg" },
      });
    }

    const status = result.error.includes("Missing") ? 400 : 502;
    return NextResponse.json({ error: result.error }, { status });
  } catch (error) {
    console.error("Speech API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
