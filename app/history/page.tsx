"use client";

import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/app/components/PageTransition";
import { motion } from "framer-motion";
import { Calendar, BookOpen, MessageSquarePlus } from "lucide-react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

type ConversationSummary = {
  conversationId: string;
  updatedAt: string;
  title?: string;
  messageCount: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const { user } = useAuth0();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const userId = user?.sub ?? user?.email ?? "";

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/conversations?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to load conversations");
        setConversations([]);
      } else {
        setConversations(data.conversations ?? []);
      }
      setLoading(false);
    };
    void load();
  }, [userId]);

  const handleNewConversation = async () => {
    if (!userId) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email: user?.email ?? undefined }),
    });
    const data = await res.json();
    if (data.conversationId) {
      router.push(`/history/${data.conversationId}`);
    }
  };

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="p-6">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Conversation History</h1>
              <p className="mt-1 text-sm text-slate-400">
                Continue teaching from any previous session.
              </p>
            </div>
            <button
              onClick={handleNewConversation}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/30"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Conversation
            </button>
          </header>

          {loading ? (
            <div className="text-sm text-slate-400">Loading conversations...</div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-300">
              No conversations found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {conversations.map((session, i) => (
                <motion.article
                  key={session.conversationId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group cursor-pointer rounded-xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md transition-colors hover:border-cyan-500/30 hover:bg-slate-900/70"
                  onClick={() => router.push(`/history/${session.conversationId}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span className="text-xs">{formatDate(session.updatedAt)}</span>
                      </div>
                      <h3 className="mt-2 flex items-center gap-2 font-medium text-slate-200">
                        <BookOpen className="h-4 w-4 shrink-0 text-cyan-400/80" />
                        {session.title ?? "Untitled Conversation"}
                      </h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300">
                      {session.messageCount} msgs
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
