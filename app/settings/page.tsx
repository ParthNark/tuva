"use client";

import { PageTransition } from "@/app/components/PageTransition";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { motion } from "framer-motion";
import { Mic, Video, Bell, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
            <p className="mt-1 text-sm text-slate-400">
              Configure your Cargo experience
            </p>
          </header>

          <div className="max-w-xl space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Mic className="h-4 w-4 text-cyan-400" />
                Microphone
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Camera and microphone permissions are managed by your browser.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Video className="h-4 w-4 text-cyan-400" />
                Camera
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Grant camera access when prompted to use the Main Stage.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Bell className="h-4 w-4 text-cyan-400" />
                Notifications
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Coming soon.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Palette className="h-4 w-4 text-cyan-400" />
                Theme
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Tokyo Night (dark mode) is the default theme.
              </p>
            </motion.section>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
