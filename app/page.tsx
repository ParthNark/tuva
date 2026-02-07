"use client";

import { useState, useCallback, useRef } from "react";
import { CameraPreview, type CameraPreviewHandle } from "@/components/CameraPreview";
import { SpeechInput } from "@/components/SpeechInput";
import { FeedbackPlayer } from "@/components/FeedbackPlayer";

export default function Home() {
  const cameraRef = useRef<CameraPreviewHandle>(null);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(
    async (dataUrl: string) => {
      setLoading(true);
      setError(null);

      try {
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, transcript }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to get feedback");
        }

        setFeedback(data.text || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setFeedback("");
      } finally {
        setLoading(false);
      }
    },
    [transcript]
  );

  const handlePlayAudio = useCallback(async (text: string): Promise<Blob | null> => {
    const res = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return null;
    return res.blob();
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-slate-100">Tuva</h1>
        <p className="text-slate-400 text-sm mt-1">
          Your AI tutor. Show what you&apos;re making and ask for feedback.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-2">Camera</h2>
        <CameraPreview ref={cameraRef} onCapture={handleCapture} disabled={loading} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-2">
          What are you working on?
        </h2>
        <SpeechInput
          transcript={transcript}
          onTranscriptChange={setTranscript}
          disabled={loading}
        />
      </section>

      <section>
        <button
          type="button"
          onClick={() => cameraRef.current?.capture()}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? "Getting feedback..." : "Get feedback"}
        </button>
      </section>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {feedback && (
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Feedback</h2>
          <FeedbackPlayer text={feedback} onPlayAudio={handlePlayAudio} />
        </section>
      )}
    </main>
  );
}
