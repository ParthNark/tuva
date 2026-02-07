"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, AlertCircle, Radio, Volume2 } from "lucide-react";

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? ((window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition) as new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [0]: { transcript: string } } } }) => void) | null;
        onerror: ((e: { error?: string }) => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      }
    : null;

type PermissionState = "idle" | "requesting" | "granted" | "denied" | "error";

export interface CameraInterfaceProps {
  embedded?: boolean;
}

export function CameraInterface({ embedded }: CameraInterfaceProps = {}) {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraPermission, setCameraPermission] = useState<PermissionState>("idle");
  const [micPermission, setMicPermission] = useState<PermissionState>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ user: string; assistant: string }[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const transcriptRef = useRef("");
  const committedRef = useRef("");
  const interimRef = useRef("");
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMediaSupported =
    mounted && typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const handleUserMedia = useCallback(() => {
    setCameraError(null);
    setCameraPermission("granted");
  }, []);

  const handleUserMediaError = useCallback((err: string | DOMException) => {
    const message = typeof err === "string" ? err : (err as Error).message;
    if (
      message.includes("Permission denied") ||
      message.includes("NotAllowedError") ||
      message.includes("NotAllowed")
    ) {
      setCameraError("Camera access denied. Please allow camera in your browser settings.");
      setCameraPermission("denied");
    } else {
      setCameraError("Could not access camera. " + message);
      setCameraPermission("error");
    }
  }, []);

  const requestMic = useCallback(async (): Promise<boolean> => {
    if (!isMediaSupported) {
      setMicError("Microphone not supported in this browser.");
      setMicPermission("error");
      return false;
    }

    setMicError(null);
    setMicPermission("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (
        message.includes("Permission denied") ||
        message.includes("NotAllowedError") ||
        message.includes("NotAllowed")
      ) {
        setMicError("Microphone access denied. Please allow mic in your browser settings.");
        setMicPermission("denied");
      } else {
        setMicError("Could not access microphone. " + message);
        setMicPermission("error");
      }
      return false;
    }
  }, [isMediaSupported]);

  const startRecording = useCallback(async () => {
    if (!isMediaSupported) {
      setCameraError("Camera and microphone are not supported in this browser.");
      return;
    }

    if (micPermission !== "granted") {
      const ok = await requestMic();
      if (!ok) return;
    }

    setMicError(null);
    setFeedback(null);
    setLastTranscript(null);
    audioChunksRef.current = [];
    transcriptRef.current = "";
    committedRef.current = "";
    interimRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [0]: { transcript: string } } } }) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const result = e.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              committedRef.current += (committedRef.current ? " " : "") + text;
            } else {
              interim += (interim ? " " : "") + text;
            }
          }
          interimRef.current = interim;
          transcriptRef.current = committedRef.current + (interim ? " " + interim : "");
        };
        recognition.onerror = () => {};
        recognition.onend = () => { recognitionRef.current = null; };
        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMicError("Failed to start recording: " + message);
    }
  }, [isMediaSupported, micPermission, requestMic]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const stopPromise = new Promise<void>((resolve) => {
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        resolve();
      };
    });

    recorder.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setLoading(true);
    setFeedback(null);

    await stopPromise;
    await new Promise((r) => setTimeout(r, 200));

    let transcript = transcriptRef.current.trim();

    setTimeout(async () => {
      const imageSrc = webcamRef.current?.getScreenshot();
      const base64 = imageSrc ? imageSrc.split(",")[1] ?? "" : "";

      if (!base64) {
        setMicError("Could not capture image. Please try again.");
        setLoading(false);
        return;
      }

      try {
        if (!transcript && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          const transcribeRes = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          if (transcribeRes.ok) {
            const { text } = await transcribeRes.json();
            transcript = (text ?? "").trim();
          }
        }

        const transcriptToUse = transcript || "I'm explaining what I'm working on.";

        const feedbackRes = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            transcript: transcriptToUse,
            history: conversationHistory,
          }),
        });

        const feedbackData = await feedbackRes.json();
        if (!feedbackRes.ok) {
          throw new Error(feedbackData.error || "Failed to get feedback");
        }

        const text = feedbackData.text || "";
        setFeedback(text);

        setLastTranscript(transcript || null);
        setConversationHistory((prev) => [...prev, { user: transcriptToUse, assistant: text }]);

        if (text) {
          const speechRes = await fetch("/api/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });

          if (speechRes.ok) {
            const audioBlob = await speechRes.blob();
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audio.onended = () => URL.revokeObjectURL(url);
            await audio.play();
          }
        }
      } catch (err) {
        setMicError(err instanceof Error ? err.message : "Something went wrong");
        setFeedback(null);
      } finally {
        setLoading(false);
      }
    }, 150);
  }, [conversationHistory]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const hasCamera = cameraPermission === "granted";
  const hasMic = micPermission === "granted";

  return (
    <div
      className={`text-slate-100 ${embedded ? "min-h-0 p-0" : "min-h-screen p-4 md:p-6"}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <header className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Feynman Method
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explain concepts to the AI. Teach to learn.
          </p>
        </header>

        <motion.div
          className="relative rounded-2xl overflow-hidden"
          initial={false}
          animate={{
            boxShadow: isRecording
              ? "0 0 40px rgba(6, 182, 212, 0.4), 0 0 80px rgba(6, 182, 212, 0.2)"
              : "0 0 20px rgba(139, 92, 246, 0.2)",
          }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`absolute inset-0 rounded-2xl pointer-events-none z-10 border-2 transition-colors ${
              isRecording
                ? "border-cyan-400/80 animate-pulse"
                : "border-purple-500/30"
            }`}
            style={{
              boxShadow: isRecording
                ? "inset 0 0 30px rgba(6, 182, 212, 0.15)"
                : "none",
            }}
          />

          <div className="relative aspect-video bg-slate-900/80">
            {!mounted ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                <div className="text-center p-6">
                  <VideoOff className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                  <p className="text-slate-400 text-sm">Loading...</p>
                </div>
              </div>
            ) : isMediaSupported ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                className="w-full h-full object-cover"
                mirrored
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                <div className="text-center p-6">
                  <VideoOff className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                  <p className="text-slate-400 text-sm">Camera not supported</p>
                </div>
              </div>
            )}

            {(cameraPermission === "denied" || cameraPermission === "error") && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
                <div className="text-center p-6 max-w-sm">
                  <VideoOff className="w-16 h-16 mx-auto text-red-400/80 mb-4" />
                  <p className="text-slate-300 text-sm">{cameraError}</p>
                  <p className="text-slate-500 text-xs mt-2">
                    Refresh the page and allow camera when prompted.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-xs font-mono text-slate-400">SCANNER</span>
              </div>

              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 backdrop-blur-md border border-red-400/50"
                  >
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-2 h-2 rounded-full bg-red-400"
                    />
                    <span className="text-xs font-medium text-red-400">REC</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: isRecording ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {(cameraError || micError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">
                {cameraError && <p>{cameraError}</p>}
                {micError && <p className={cameraError ? "mt-2" : ""}>{micError}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 backdrop-blur-md border border-white/5">
            <div className="flex items-center gap-2">
              {hasCamera ? (
                <Video className="w-5 h-5 text-cyan-400" />
              ) : (
                <VideoOff className="w-5 h-5 text-slate-500" />
              )}
              <span className="text-sm text-slate-400">
                Camera {hasCamera ? "ready" : "pending"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasMic ? (
                <Mic className="w-5 h-5 text-cyan-400" />
              ) : (
                <MicOff className="w-5 h-5 text-slate-500" />
              )}
              <span className="text-sm text-slate-400">
                Mic {hasMic ? "ready" : "pending"}
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={toggleRecording}
            disabled={
              loading ||
              ((cameraPermission === "requesting" || micPermission === "requesting") &&
                !isRecording)
            }
            className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isRecording
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2))"
                : "linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))",
              border: isRecording
                ? "1px solid rgba(239, 68, 68, 0.5)"
                : "1px solid rgba(6, 182, 212, 0.4)",
              boxShadow: isRecording
                ? "0 0 20px rgba(239, 68, 68, 0.3)"
                : "0 0 20px rgba(6, 182, 212, 0.2)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="text-slate-300">Processing...</span>
            ) : cameraPermission === "requesting" || micPermission === "requesting" ? (
              <span className="text-slate-300">Requesting access...</span>
            ) : isRecording ? (
              <>
                <Radio className="w-5 h-5 text-red-300" />
                <span className="text-red-200">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 text-cyan-300" />
                <span className="text-cyan-200">Start Listening</span>
              </>
            )}
          </motion.button>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-slate-800/40 backdrop-blur-md border border-cyan-500/20"
            >
              {lastTranscript && (
                <p className="text-slate-400 text-xs mb-2 italic">
                  You said: &quot;{lastTranscript}&quot;
                </p>
              )}
              {!lastTranscript && (
                <p className="text-amber-400/80 text-xs mb-2">
                  No speech detected — using fallback
                </p>
              )}
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                {feedback}
              </p>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/speech", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: feedback }),
                  });
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    audio.onended = () => URL.revokeObjectURL(url);
                    await audio.play();
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm font-medium transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                Play again
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
