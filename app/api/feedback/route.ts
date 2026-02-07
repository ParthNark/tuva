import { NextRequest, NextResponse } from "next/server";
import { TUTOR_SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { image, transcript } = await request.json();

    if (!image || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Missing image or transcript" },
        { status: 400 }
      );
    }

    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FEATHERLESS_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

    const response = await fetch("https://api.featherless.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it",
        messages: [
          { role: "system", content: TUTOR_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: transcript
                  ? `The student says: "${transcript}". What feedback do you have?`
                  : "Look at what the student is working on. What feedback or observations do you have?",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Featherless API error:", err);
      return NextResponse.json(
        { error: "Failed to get feedback from model" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
