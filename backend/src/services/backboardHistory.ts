// Backboard usage summary (per docs):
// - Assistants define a persona; threads persist messages across sessions.
// - We use threads for ChatGPT-style history persistence.
// - Auth is via X-API-Key header to https://app.backboard.io/api.
// - Messages are added via POST /threads/{thread_id}/messages (multipart/form-data).
// - Threads are retrieved via GET /threads/{thread_id} and listed via GET /threads.

import { randomUUID } from "crypto";
import { STUDENT_SYSTEM_PROMPT } from "@/backend/prompts";

const BASE_URL = "https://app.backboard.io/api";
const API_KEY = process.env.BACKBOARD_API_KEY ?? "";
const ASSISTANT_NAME = "Tuva History Assistant";
const ASSISTANT_ID = process.env.BACKBOARD_ASSISTANT_ID ?? "";

export type HistoryMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string;
};

export type ConversationSummary = {
  conversationId: string;
  userId: string;
  title?: string;
  updatedAt: string;
  messageCount: number;
};

export type ConversationDetail = {
  conversationId: string;
  userId: string;
  title?: string;
  updatedAt: string;
  messages: HistoryMessage[];
};

type ThreadRecord = {
  thread_id?: string;
  threadId?: string;
  created_at?: string;
  metadata?: Record<string, string>;
  metadata_?: Record<string, string>;
  messages?: Array<{
    content?: string;
    role?: string;
    metadata?: Record<string, unknown>;
    metadata_?: Record<string, unknown>;
    timestamp?: string;
    created_at?: string;
  }>;
};

type AssistantRecord = {
  assistant_id?: string;
  id?: string;
  name?: string;
};

const inMemoryStore = new Map<string, HistoryMessage[]>();
const inMemoryMeta = new Map<string, { userId: string; createdAt: string }>();
let cachedAssistantId: string | null = null;

function logCall(method: string, url: string) {
  console.log(`[backboard] ${method} ${url}`);
}

function logFailure(message: string) {
  console.error(`[backboard] ${message}`);
}

function ensureApiKey() {
  if (!API_KEY) {
    console.warn("[backboard] BACKBOARD_API_KEY missing; falling back to in-memory history");
  }
}

function authHeaders(): HeadersInit {
  return {
    "X-API-Key": API_KEY,
  };
}

async function fetchJson<T>(method: string, url: string, body?: BodyInit) {
  logCall(method, url);
  const res = await fetch(url, {
    method,
    headers: body ? { ...authHeaders(), "Content-Type": "application/json" } : authHeaders(),
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    logFailure(`${method} ${url} -> ${res.status} ${err}`);
    const error = new Error(`Backboard error: ${res.status} ${err}`);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }
  return (await res.json()) as T;
}

async function fetchForm(method: string, url: string, form: FormData) {
  logCall(method, url);
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    logFailure(`${method} ${url} -> ${res.status} ${err}`);
    const error = new Error(`Backboard error: ${res.status} ${err}`);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }
  return res.json();
}

function deriveTitle(messages: HistoryMessage[]): string | undefined {
  const firstUser = messages.find((msg) => msg.role === "user");
  return firstUser?.content?.slice(0, 48).trim();
}

function normalizeMessages(messages: ThreadRecord["messages"]): HistoryMessage[] {
  return (messages ?? []).map((msg) => {
    const metadataRole =
      (msg.metadata && typeof msg.metadata.role === "string" ? msg.metadata.role : undefined) ??
      (msg.metadata_ && typeof msg.metadata_.role === "string" ? msg.metadata_.role : undefined);
    const role = (msg.role ?? metadataRole ?? "user") as HistoryMessage["role"];
    return {
      role: role === "assistant" || role === "system" ? role : "user",
      content: msg.content ?? "",
      timestamp: msg.timestamp ?? msg.created_at,
    };
  });
}

function resolveUserId(thread: ThreadRecord, messages: ThreadRecord["messages"]): string | undefined {
  const metadataUserId =
    thread.metadata?.userId ??
    thread.metadata?.user_id ??
    thread.metadata_?.userId ??
    thread.metadata_?.user_id;
  if (metadataUserId) return metadataUserId;

  const messageUserId = messages
    ?.map((msg) => msg.metadata ?? msg.metadata_)
    .find(
      (meta) =>
        meta &&
        (typeof (meta as { userId?: unknown }).userId === "string" ||
          typeof (meta as { user_id?: unknown }).user_id === "string")
    ) as { userId?: string; user_id?: string } | undefined;
  return messageUserId?.userId ?? messageUserId?.user_id;
}

function hasUserMessage(messages: HistoryMessage[]): boolean {
  return messages.some((msg) => msg.role === "user" && msg.content.trim().length > 0);
}

function summarizeThreadMetadata(thread: ThreadRecord) {
  const firstMessage = thread.messages?.[0];
  return {
    threadId: thread.thread_id ?? thread.threadId,
    threadMetadata: thread.metadata ?? null,
    threadMetadataLegacy: thread.metadata_ ?? null,
    firstMessageMetadata: firstMessage?.metadata ?? null,
    firstMessageMetadataLegacy: firstMessage?.metadata_ ?? null,
  };
}

async function resolveAssistantId(): Promise<string> {
  if (ASSISTANT_ID) return ASSISTANT_ID;
  if (cachedAssistantId) return cachedAssistantId;

  const list = await fetchJson<AssistantRecord[]>("GET", `${BASE_URL}/assistants`);
  const match = list.find((item) => item.name === ASSISTANT_NAME);
  if (match?.assistant_id || match?.id) {
    cachedAssistantId = match.assistant_id ?? match.id ?? null;
    if (cachedAssistantId) return cachedAssistantId;
  }

  const created = await fetchJson<AssistantRecord>("POST", `${BASE_URL}/assistants`, JSON.stringify({
    name: ASSISTANT_NAME,
    system_prompt: STUDENT_SYSTEM_PROMPT,
  }));

  cachedAssistantId = created.assistant_id ?? created.id ?? null;
  if (!cachedAssistantId) {
    throw new Error("Backboard assistant creation failed: missing assistant_id");
  }
  return cachedAssistantId;
}

async function createThread(userId: string): Promise<string> {
  const assistantId = await resolveAssistantId();
  const payload = JSON.stringify({ metadata: { userId } });
  const thread = await fetchJson<ThreadRecord>("POST", `${BASE_URL}/assistants/${assistantId}/threads`, payload);
  const threadId = thread.thread_id ?? thread.threadId;
  if (!threadId) {
    throw new Error("Backboard thread creation failed: missing thread_id");
  }
  return threadId;
}

async function getThread(threadId: string): Promise<ThreadRecord> {
  return fetchJson<ThreadRecord>("GET", `${BASE_URL}/threads/${threadId}`);
}

async function listThreads(): Promise<ThreadRecord[]> {
  return fetchJson<ThreadRecord[]>("GET", `${BASE_URL}/threads`);
}

async function listAssistantThreads(assistantId: string): Promise<ThreadRecord[]> {
  return fetchJson<ThreadRecord[]>("GET", `${BASE_URL}/assistants/${assistantId}/threads`);
}

async function appendMessage(threadId: string, message: HistoryMessage, userId: string) {
  const form = new FormData();
  form.append("content", message.content);
  form.append("stream", "false");
  form.append("memory", "on");
  form.append("send_to_llm", "false");
  form.append("metadata", JSON.stringify({
    role: message.role,
    userId,
    user_id: userId,
    custom_timestamp: message.timestamp ?? new Date().toISOString(),
  }));

  await fetchForm("POST", `${BASE_URL}/threads/${threadId}/messages`, form);
}

export async function initConversation(userId: string): Promise<string> {
  ensureApiKey();
  if (!API_KEY) {
    const conversationId = randomUUID();
    inMemoryStore.set(conversationId, [{ role: "system", content: STUDENT_SYSTEM_PROMPT }]);
    inMemoryMeta.set(conversationId, { userId, createdAt: new Date().toISOString() });
    console.warn(`[backboard] in-memory conversation ${conversationId} created for ${userId}`);
    return conversationId;
  }

  const threadId = await createThread(userId);
  await appendMessage(threadId, { role: "system", content: STUDENT_SYSTEM_PROMPT }, userId);
  console.log(`[backboard] initConversation: ${threadId}`);
  return threadId;
}

export async function getConversation(threadId: string, userId: string): Promise<ConversationDetail> {
  ensureApiKey();
  if (!API_KEY) {
    const messages = inMemoryStore.get(threadId) ?? [];
    return {
      conversationId: threadId,
      userId,
      title: deriveTitle(messages),
      updatedAt: messages[messages.length - 1]?.timestamp ?? new Date().toISOString(),
      messages,
    };
  }

  const thread = await getThread(threadId);
  const messages = normalizeMessages(thread.messages);
  const owner = resolveUserId(thread, thread.messages);
  if (!owner || owner !== userId) {
    throw new Error("Conversation not found");
  }

  const updatedAt = messages[messages.length - 1]?.timestamp ?? thread.created_at ?? new Date().toISOString();
  return {
    conversationId: threadId,
    userId,
    title: deriveTitle(messages),
    updatedAt,
    messages,
  };
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  ensureApiKey();
  if (!API_KEY) {
    return Array.from(inMemoryMeta.entries())
      .filter(([, meta]) => meta.userId === userId)
      .map(([conversationId, meta]) => {
        const messages = inMemoryStore.get(conversationId) ?? [];
        return {
          conversationId,
          userId: meta.userId,
          title: deriveTitle(messages),
          updatedAt: messages[messages.length - 1]?.timestamp ?? meta.createdAt,
          messageCount: messages.length,
        };
      });
  }

  const assistantId = await resolveAssistantId();
  const threads = await listAssistantThreads(assistantId);
  console.log(`[backboard] listConversations assistantId=${assistantId} threads=${threads.length}`);
  const summaries: ConversationSummary[] = [];

  for (const thread of threads) {
    const threadId = thread.thread_id ?? thread.threadId;
    if (!threadId) continue;

    const fullThread = await getThread(threadId);
    const messages = normalizeMessages(fullThread.messages);
    const owner = resolveUserId(fullThread, fullThread.messages);
    if (!owner) {
      console.log("[backboard] thread owner unresolved", summarizeThreadMetadata(fullThread));
    }
    if (!owner || owner !== userId) continue;
    if (!hasUserMessage(messages)) continue;

    summaries.push({
      conversationId: threadId,
      userId: owner,
      title: deriveTitle(messages),
      updatedAt: messages[messages.length - 1]?.timestamp ?? fullThread.created_at ?? new Date().toISOString(),
      messageCount: messages.length,
    });
  }

  console.log(`[backboard] listConversations result count=${summaries.length} userId=${userId}`);

  return summaries;
}

export async function appendUserAndAssistantMessages(
  threadId: string,
  userId: string,
  userMessage: string,
  assistantMessage: string
) {
  ensureApiKey();
  const now = new Date().toISOString();
  const userEntry: HistoryMessage = { role: "user", content: userMessage, timestamp: now };
  const assistantEntry: HistoryMessage = { role: "assistant", content: assistantMessage, timestamp: now };

  if (!API_KEY) {
    const existing = inMemoryStore.get(threadId) ?? [];
    inMemoryStore.set(threadId, [...existing, userEntry, assistantEntry]);
    console.warn(`[backboard] in-memory save for ${threadId}`);
    return;
  }

  await appendMessage(threadId, userEntry, userId);
  await appendMessage(threadId, assistantEntry, userId);
  console.log(`[backboard] saved messages for ${threadId}`);
}
