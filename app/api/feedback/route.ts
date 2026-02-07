import { NextRequest, NextResponse } from "next/server";
import { getFeedback } from "@/backend/feedback";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await getFeedback({
      image: body.image,
      transcript: body.transcript,
    });

    if ("error" in result) {
      let status = 502;
      if (result.error.includes("Missing")) status = 400;
      else if (result.error.includes("not configured")) status = 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
