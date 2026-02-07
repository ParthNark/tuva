"use client";

import { useRef, useState } from "react";

interface FeedbackPlayerProps {
  text: string;
  onPlayAudio: (text: string) => Promise<Blob | null>;
}

export function FeedbackPlayer({ text, onPlayAudio }: FeedbackPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await onPlayAudio(text);
      if (!blob) {
        setError("Could not generate audio");
        return;
      }

      const url = URL.createObjectURL(blob);
      const audio = audioRef.current;
      if (audio) {
        audio.src = url;
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
      } else {
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError("Playback failed");
    } finally {
      setLoading(false);
    }
  };

  if (!text) return null;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
        {text}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={play}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          {loading ? "Generating..." : "Play feedback"}
        </button>
        {error && (
          <span className="text-sm text-red-400">{error}</span>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
