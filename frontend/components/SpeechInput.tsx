"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechInputProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  }
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition) as new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((event: unknown) => void) | null;
        onerror: ((event: unknown) => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      }
    : null;

export function SpeechInput({
  transcript,
  onTranscriptChange,
  disabled,
}: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const committedRef = useRef("");

  useEffect(() => {
    setSpeechSupported(!!SpeechRecognitionAPI);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI || disabled) return;

    committedRef.current = transcript;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: unknown) => {
      const e = event as { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [0]: { transcript: string } } } };
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          committedRef.current += (committedRef.current ? " " : "") + text;
        } else {
          interim += text;
        }
      }
      onTranscriptChange(committedRef.current + (interim ? " " + interim : ""));
    };

    recognition.onerror = (event: unknown) => {
      const err = event as { error?: string };
      if (err.error !== "aborted") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [disabled, onTranscriptChange, transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {speechSupported ? (
          <>
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isListening
                  ? "bg-red-500/80 hover:bg-red-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
              }`}
            >
              {isListening ? "Stop" : "Listen"}
            </button>
          </>
        ) : null}
      </div>

      <div className="relative">
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder={
            speechSupported
              ? "What are you working on? Tap Listen and speak, or type here..."
              : "Type what you're working on or any questions..."
          }
          disabled={disabled}
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
        />
      </div>
    </div>
  );
}
