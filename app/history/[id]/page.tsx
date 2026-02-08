"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useRouter } from "next/navigation";
import { PageTransition } from "@/app/components/PageTransition";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

type ConversationMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ConversationRecord = {
  conversationId: string;
  updatedAt: string;
  title?: string;
  messages: ConversationMessage[];
};

export default function ConversationDetailPage() {
  const { user } = useAuth0();
  const router = useRouter();
  const params = useParams();
  const conversationId = useMemo(() => String(params?.id ?? ""), [params]);
  const userId = user?.sub ?? user?.email ?? "";

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationRecord | null>(null);

  useEffect(() => {
    if (!conversationId || !userId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/conversations/${conversationId}?userId=${encodeURIComponent(userId)}`
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to load conversation");
        setConversation(null);
      } else {
        setConversation(data as ConversationRecord);
      }
      setLoading(false);
    };
    void load();
  }, [conversationId, userId]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !userId) return;
    setSending(true);
    setError(null);
    const message = input.trim();
    setInput("");

    setConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, { role: "user", content: message }],
          }
        : prev
    );

    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message }),
    });

    const data = await res.json();
    if (!data.error) {
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: data.messages ?? prev.messages,
              updatedAt: new Date().toISOString(),
            }
          : prev
      );
    } else {
      setError(data.error ?? "Failed to send message");
    }

    setSending(false);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PageTransition>
          <div className="p-6 text-sm text-slate-400">Loading conversation...</div>
        </PageTransition>
      </ProtectedRoute>
    );
  }

  if (!conversation) {
    return (
      <ProtectedRoute>
        <PageTransition>
          <div className="p-6">
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-300">
              {error ?? "Conversation not found."}
            </div>
            <button
              onClick={() => router.push("/history")}
              className="mt-4 text-sm text-cyan-300 hover:text-cyan-200"
            >
              Back to history
            </button>
          </div>
        </PageTransition>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="flex h-full min-h-screen flex-col gap-6 p-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {conversation.title ?? "Conversation"}
              </h1>
              <p className="text-sm text-slate-400">Continue teaching the AI student.</p>
            </div>
            <button
              onClick={() => router.push("/history")}
              className="text-sm text-cyan-300 hover:text-cyan-200"
            >
              Back to history
            </button>
          </header>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-slate-900/30 p-6">
            <div className="space-y-4">
              {conversation.messages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-500/10 text-cyan-100 border border-cyan-500/20"
                      : msg.role === "assistant"
                      ? "bg-slate-800/60 text-slate-100 border border-white/5"
                      : "bg-purple-500/10 text-purple-100 border border-purple-500/20"
                  }`}
                >
                  <div className="mb-1 text-xs uppercase tracking-wide opacity-70">{msg.role}</div>
                  {msg.content}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Explain a concept to your AI student..."
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
