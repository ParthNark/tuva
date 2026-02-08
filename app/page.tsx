"use client";

import { CameraInterface } from "@/frontend/components/CameraInterface";
import { PageTransition } from "./components/PageTransition";
import { MessageSquare } from "lucide-react";
import { ProtectedRoute } from "./components/ProtectedRoute";

const MOCK_RECENT_FEEDBACK = [
  { id: 1, text: "Great start! Try explaining recursion as 'a function that calls itself' — that's the core idea.", time: "2 min ago" },
  { id: 2, text: "You're on the right track. What happens when n reaches 0? That's your base case.", time: "5 min ago" },
  { id: 3, text: "Simplify further — imagine explaining to a 10-year-old. Remove the jargon.", time: "8 min ago" },
];

function formatSessionTime() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="flex h-full min-h-screen gap-6 p-6">
        <div className="flex flex-1 flex-col">
          <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-md">
            <h2 className="text-sm font-medium text-slate-400">Current Session</h2>
            <p className="mt-1 text-lg font-semibold text-slate-100">{formatSessionTime()}</p>
          </div>

          <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-md">
            <div className="p-6">
              <CameraInterface embedded />
            </div>
          </div>
        </div>

        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-md">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              Recent Feedback
            </h3>
            <ul className="space-y-3">
              {MOCK_RECENT_FEEDBACK.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-white/5 bg-slate-800/40 p-3 text-sm"
                >
                  <p className="text-slate-300">{item.text}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.time}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
