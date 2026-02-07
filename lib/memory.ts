/**
 * MemoryService - Persistent conversation history via Backboard.io (or generic Memory API)
 * Scaffolded with placeholder endpoints. Replace with actual Backboard API when available.
 * Uses in-memory fallback when BACKBOARD_API_KEY is not set (for development).
 */

const MEMORY_BASE = process.env.BACKBOARD_MEMORY_URL ?? "https://api.backboard.io/v1/memory";
const API_KEY = process.env.BACKBOARD_API_KEY ?? "";

const useLocalFallback = !API_KEY;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const localStore = new Map<
  string,
  { messages: ConversationMessage[]; topic?: string; updatedAt: string }
>();

export interface SessionSummary {
  id: string;
  topic?: string;
  updatedAt: string;
  messageCount?: number;
}

export interface SessionDetail {
  id: string;
  topic?: string;
  messages: ConversationMessage[];
  updatedAt: string;
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
    headers["X-API-Key"] = API_KEY;
  }
  return headers;
}

export class MemoryService {
  /**
   * Save or update a session with its messages.
   */
  static async saveSession(
    sessionId: string,
    messages: ConversationMessage[],
    topic?: string
  ): Promise<{ ok: boolean; error?: string }> {
    if (useLocalFallback) {
      localStore.set(sessionId, {
        messages,
        topic,
        updatedAt: new Date().toISOString(),
      });
      return { ok: true };
    }

    try {
      const res = await fetch(`${MEMORY_BASE}/sessions/${sessionId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          id: sessionId,
          messages,
          topic,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[MemoryService] saveSession error:", res.status, err);
        return { ok: false, error: err };
      }
      return { ok: true };
    } catch (e) {
      console.error("[MemoryService] saveSession exception:", e);
      return { ok: false, error: String(e) };
    }
  }

  /**
   * List past sessions (conversations).
   */
  static async getSessions(): Promise<SessionSummary[]> {
    if (useLocalFallback) {
      const entries = Array.from(localStore.entries());
      return entries
        .map(([id, data]) => ({
          id,
          topic: data.topic,
          updatedAt: data.updatedAt,
          messageCount: data.messages.length,
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    try {
      const res = await fetch(`${MEMORY_BASE}/sessions`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (!res.ok) {
        console.error("[MemoryService] getSessions error:", res.status);
        return [];
      }

      const data = (await res.json()) as { sessions?: SessionSummary[]; data?: SessionSummary[] };
      const list = data.sessions ?? data.data ?? [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error("[MemoryService] getSessions exception:", e);
      return [];
    }
  }

  /**
   * Get full history for a session.
   */
  static async getSessionHistory(sessionId: string): Promise<SessionDetail | null> {
    if (useLocalFallback) {
      const data = localStore.get(sessionId);
      if (!data) return null;
      return {
        id: sessionId,
        topic: data.topic,
        messages: data.messages,
        updatedAt: data.updatedAt,
      };
    }

    try {
      const res = await fetch(`${MEMORY_BASE}/sessions/${sessionId}`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        console.error("[MemoryService] getSessionHistory error:", res.status);
        return null;
      }

      const data = (await res.json()) as SessionDetail & { messages?: ConversationMessage[] };
      const messages = data.messages ?? [];
      return {
        id: data.id ?? sessionId,
        topic: data.topic,
        messages,
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      };
    } catch (e) {
      console.error("[MemoryService] getSessionHistory exception:", e);
      return null;
    }
  }
}
