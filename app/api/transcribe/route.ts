import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/backend/transcribe";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing audio file (form field: audio)" }, { status: 400 });
    }

    const audio = await file.arrayBuffer();
    const mimeType = file.type || "audio/webm";

    const result = await transcribeAudio({ audio, mimeType });

    if ("error" in result) {
      const status = result.error.includes("Missing") ? 400 : 502;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Transcribe API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
