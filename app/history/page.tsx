"use client";

import { PageTransition } from "@/app/components/PageTransition";
import { motion } from "framer-motion";
import { Calendar, BookOpen, TrendingUp } from "lucide-react";

const MOCK_SESSIONS = [
  { id: 1, date: "Feb 7, 2026", topic: "Binary Search Trees", score: 85 },
  { id: 2, date: "Feb 6, 2026", topic: "Recursion & Base Cases", score: 92 },
  { id: 3, date: "Feb 5, 2026", topic: "Big O Notation", score: 78 },
  { id: 4, date: "Feb 4, 2026", topic: "Linked Lists", score: 88 },
  { id: 5, date: "Feb 3, 2026", topic: "Hash Tables", score: 81 },
  { id: 6, date: "Feb 2, 2026", topic: "Sorting Algorithms", score: 75 },
];

function getScoreColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 80) return "text-cyan-400";
  if (score >= 70) return "text-amber-400";
  return "text-slate-400";
}

export default function HistoryPage() {
  return (
    <PageTransition>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Past Learning Sessions</h1>
          <p className="mt-1 text-sm text-slate-400">
            Review your teaching sessions and Simplicity Scores
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MOCK_SESSIONS.map((session, i) => (
            <motion.article
              key={session.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md transition-colors hover:border-cyan-500/30 hover:bg-slate-900/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="text-xs">{session.date}</span>
                  </div>
                  <h3 className="mt-2 flex items-center gap-2 font-medium text-slate-200">
                    <BookOpen className="h-4 w-4 shrink-0 text-cyan-400/80" />
                    {session.topic}
                  </h3>
                </div>
                <div
                  className={`flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-1.5 ${getScoreColor(session.score)}`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-semibold">{session.score}/100</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
