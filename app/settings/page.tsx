"use client";

import { PageTransition } from "@/app/components/PageTransition";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { motion } from "framer-motion";
import { Mic, Video, Bell, Palette } from "lucide-react";
import { useTheme } from "@/app/hooks/useTheme";
import { DEFAULT_THEME } from "@/app/theme/themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme, themes } = useTheme();
  const currentTheme = themes.find((option) => option.id === theme);
  const [cameraStatus, setCameraStatus] = useState<
    "checking" | "granted" | "denied" | "prompt" | "unavailable"
  >("checking");
  const [microphoneStatus, setMicrophoneStatus] = useState<
    "checking" | "granted" | "denied" | "prompt" | "unavailable"
  >("checking");

  useEffect(() => {
    let isMounted = true;

    const checkPermission = async (
      name: PermissionName,
      setStatus: (status: typeof cameraStatus) => void,
    ) => {
      if (typeof window === "undefined") return;
      if (!navigator?.mediaDevices) {
        if (isMounted) setStatus("unavailable");
        return;
      }

      try {
        if (navigator.permissions?.query) {
          const result = await navigator.permissions.query({ name });
          if (!isMounted) return;
          setStatus(result.state);
          result.onchange = () => {
            if (isMounted) {
              setStatus(result.state);
            }
          };
          return;
        }
      } catch {
        // Ignore and fall back to prompt state.
      }

      if (isMounted) setStatus("prompt");
    };

    checkPermission("camera" as PermissionName, setCameraStatus);
    checkPermission("microphone" as PermissionName, setMicrophoneStatus);

    return () => {
      isMounted = false;
    };
  }, []);

  const cameraStatusLabel = (() => {
    switch (cameraStatus) {
      case "granted":
        return "Camera access granted";
      case "denied":
        return "Camera access denied";
      case "prompt":
        return "Camera access not requested yet";
      case "unavailable":
        return "Camera access unavailable";
      default:
        return "Checking camera access...";
    }
  })();

  const microphoneStatusLabel = (() => {
    switch (microphoneStatus) {
      case "granted":
        return "Microphone access granted";
      case "denied":
        return "Microphone access denied";
      case "prompt":
        return "Microphone access not requested yet";
      case "unavailable":
        return "Microphone access unavailable";
      default:
        return "Checking microphone access...";
    }
  })();

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-theme">Settings</h1>
            <p className="mt-1 text-sm text-muted">
              Configure your Cargo experience
            </p>
          </header>

          <div className="max-w-xl space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-card bg-card p-5 backdrop-blur-md"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-soft">
                <Mic className="h-4 w-4 text-accent" />
                Microphone
              </h2>
              <p className="mt-1 text-sm text-muted">{microphoneStatusLabel}</p>
              <p className="mt-2 text-xs text-subtle">
                Camera and microphone permissions are managed by your browser.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-card bg-card p-5 backdrop-blur-md"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-soft">
                <Video className="h-4 w-4 text-accent" />
                Camera
              </h2>
              <p className="mt-1 text-sm text-muted">{cameraStatusLabel}</p>
              <p className="mt-2 text-xs text-subtle">
                Grant camera access when prompted to use the Main Stage.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-card bg-card p-5 backdrop-blur-md"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-soft">
                <Bell className="h-4 w-4 text-accent" />
                Notifications
              </h2>
              <p className="mt-1 text-sm text-muted">
                Coming soon.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-card bg-card p-5 backdrop-blur-md"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-soft">
                <Palette className="h-4 w-4 text-accent" />
                Theme
              </h2>
              <p className="mt-1 text-sm text-muted">
                {currentTheme
                  ? `${currentTheme.label}${
                      currentTheme.id === DEFAULT_THEME ? " (Default)" : ""
                    } is active.`
                  : "Select a theme."}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {themes.map((option) => {
                  const isSelected = option.id === theme;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme(option.id)}
                      aria-pressed={isSelected}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-accent bg-accent-soft"
                          : "border-card bg-card-soft hover-bg-card-strong"
                      }`}
                    >
                      <p className="text-sm font-semibold text-theme">
                        {option.label}
                        {option.id === DEFAULT_THEME ? " (Default)" : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
