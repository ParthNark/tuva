"use client";

import { PageTransition } from "@/app/components/PageTransition";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { motion } from "framer-motion";
import { Mic, Video, Bell, Palette } from "lucide-react";
import { useTheme } from "@/app/hooks/useTheme";

export default function SettingsPage() {
  const { theme, setTheme, themes } = useTheme();
  const currentTheme = themes.find((option) => option.id === theme);

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
              <p className="mt-1 text-sm text-muted">
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
              <p className="mt-1 text-sm text-muted">
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
                {currentTheme ? `${currentTheme.label} is active.` : "Select a theme."}
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
