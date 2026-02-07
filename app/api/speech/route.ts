import { NextRequest, NextResponse } from "next/server";
import { generateSpeech } from "@/backend/speech";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    const result = await generateSpeech({ text });

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
