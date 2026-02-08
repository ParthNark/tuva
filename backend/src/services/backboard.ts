// Backboard usage note:
// - Backboard provides Assistants and Threads. Threads persist messages across requests.
// - Messages are stored on threads via POST /threads/{thread_id}/messages.
// - We use Threads for chat history persistence; the API is authenticated via X-API-Key.
// - If Backboard is unavailable (missing API key), we fall back to in-memory storage with a warning.

import { randomUUID } from "crypto";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type BackboardThreadResponse = {
  thread_id?: string;
  threadId?: string;
  messages?: Array<{ role?: string; content?: string }>;
};

type BackboardAssistantResponse = {
  assistant_id?: string;
  id?: string;
};

const BACKBOARD_BASE_URL = "https://app.backboard.io/api";
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY ?? "";
const BACKBOARD_ASSISTANT_ID = process.env.BACKBOARD_ASSISTANT_ID ?? "";

const inMemoryStore = new Map<string, ChatMessage[]>();
let cachedAssistantId: string | null = null;

class BackboardServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function logMode() {
  if (BACKBOARD_API_KEY) {
    console.log("[backboard] using Backboard API");
  } else {
    console.warn("[backboard] stubbed: BACKBOARD_API_KEY missing, using in-memory store");
  }
}

function authHeaders(): HeadersInit {
  return {
    "X-API-Key": BACKBOARD_API_KEY,
  };
}

async function logAndFetch(url: string, init: RequestInit) {
  console.log(`[backboard] ${init.method ?? "GET"} ${url}`);
  return fetch(url, init);
}

async function ensureAssistantId(): Promise<string> {
  if (BACKBOARD_ASSISTANT_ID) return BACKBOARD_ASSISTANT_ID;
  if (cachedAssistantId) return cachedAssistantId;

  const response = await logAndFetch(`${BACKBOARD_BASE_URL}/assistants`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Tuva Storage Assistant",
      system_prompt: "Storage-only assistant for Tuva chat history.",
      llm_provider: "openai",
      model_name: "gpt-4o",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new BackboardServiceError(
      `Backboard assistant create failed: ${response.status} ${err}`,
      response.status
    );
  }

  const data = (await response.json()) as BackboardAssistantResponse;
  const assistantId = data.assistant_id ?? data.id;
  if (!assistantId) {
    throw new Error("Backboard assistant create failed: missing assistant_id");
  }
  cachedAssistantId = assistantId;
  return assistantId;
}

async function createThread(): Promise<string> {
  const assistantId = await ensureAssistantId();
  const response = await logAndFetch(`${BACKBOARD_BASE_URL}/assistants/${assistantId}/threads`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new BackboardServiceError(
      `Backboard thread create failed: ${response.status} ${err}`,
      response.status
    );
  }

  const data = (await response.json()) as BackboardThreadResponse;
  const threadId = data.thread_id ?? data.threadId;
  if (!threadId) {
    throw new Error("Backboard thread create failed: missing thread_id");
  }
  return threadId;
}

async function fetchThreadMessages(threadId: string): Promise<ChatMessage[]> {
  const response = await logAndFetch(`${BACKBOARD_BASE_URL}/threads/${threadId}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (response.status === 404 || response.status === 401) {
    const err = await response.text();
    throw new BackboardServiceError(
      `Backboard fetch failed: ${response.status} ${err}`,
      response.status
    );
  }

  if (!response.ok) {
    const err = await response.text();
    throw new BackboardServiceError(
      `Backboard fetch failed: ${response.status} ${err}`,
      response.status
    );
  }

  const data = (await response.json()) as BackboardThreadResponse;
  const messages = (data.messages ?? []).map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content ?? "",
  }));

  return messages;
}

async function appendMessage(threadId: string, message: ChatMessage): Promise<void> {
  const form = new FormData();
  form.append("content", message.content);
  form.append("stream", "false");
  form.append("memory", "off");
  form.append("send_to_llm", "false");

  const response = await logAndFetch(`${BACKBOARD_BASE_URL}/threads/${threadId}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  if (response.status === 404 || response.status === 401) {
    const err = await response.text();
    throw new BackboardServiceError(
      `Backboard message failed: ${response.status} ${err}`,
      response.status
    );
  }

  if (!response.ok) {
    const err = await response.text();
    throw new BackboardServiceError(
      `Backboard message failed: ${response.status} ${err}`,
      response.status
    );
  }
}

export async function initConversation(userId: string): Promise<string> {
  logMode();
  if (!BACKBOARD_API_KEY) {
    const conversationId = randomUUID();
    inMemoryStore.set(conversationId, []);
    console.warn(`[backboard] using in-memory conversation ${conversationId} for ${userId}`);
    return conversationId;
  }

  const threadId = await createThread();
  console.log(`[backboard] initConversation: ${threadId}`);
  return threadId;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  logMode();
  if (!BACKBOARD_API_KEY) {
    return inMemoryStore.get(conversationId) ?? [];
  }

  const messages = await fetchThreadMessages(conversationId);
  console.log(`[backboard] loaded ${messages.length} messages for ${conversationId}`);
  return messages;
}

export async function saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
  logMode();
  if (!BACKBOARD_API_KEY) {
    inMemoryStore.set(conversationId, messages);
    console.warn(`[backboard] saved ${messages.length} messages in-memory for ${conversationId}`);
    return;
  }

  const existing = await fetchThreadMessages(conversationId);
  const toAppend = messages.slice(existing.length);
  for (const message of toAppend) {
    await appendMessage(conversationId, message);
  }
  console.log(`[backboard] saved ${messages.length} messages for ${conversationId}`);
}

export function isBackboardServiceError(error: unknown): error is BackboardServiceError {
  return error instanceof BackboardServiceError;
}
