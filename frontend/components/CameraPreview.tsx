"use client";

import { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";

export interface CameraPreviewHandle {
  capture: () => void;
}

interface CameraPreviewProps {
  onCapture: (dataUrl: string) => void;
  disabled?: boolean;
}

export const CameraPreview = forwardRef<CameraPreviewHandle, CameraPreviewProps>(
  function CameraPreview({ onCapture, disabled }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setReady(true);
      }
    } catch (err) {
      setError("Could not access camera. Please allow camera access.");
      setReady(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready || disabled) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
  }, [onCapture, ready, disabled]);

  useImperativeHandle(ref, () => ({ capture }), [capture]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 p-4 text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      {!error && ready && (
        <button
          type="button"
          onClick={capture}
          disabled={disabled}
          className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          Capture frame
        </button>
      )}
    </div>
  );
});
