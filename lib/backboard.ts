const BACKBOARD_BASE_URL = process.env.BACKBOARD_API_URL ?? "https://api.backboard.io/v1";
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY ?? "";

export interface BackboardMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export interface BackboardThread {
  id: string;
}

function authHeaders(): HeadersInit {
  if (!BACKBOARD_API_KEY) {
    throw new Error("BACKBOARD_API_KEY is not configured");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${BACKBOARD_API_KEY}`,
  };
}

async function handleResponse<T>(res: Response, errorPrefix: string): Promise<T> {
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${errorPrefix}: ${res.status} ${err}`);
  }
  return (await res.json()) as T;
}

export async function createThread(): Promise<BackboardThread> {
  const res = await fetch(`${BACKBOARD_BASE_URL}/threads`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<BackboardThread>(res, "Failed to create thread");
}

export async function addMessage(
  threadId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const res = await fetch(`${BACKBOARD_BASE_URL}/threads/${threadId}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ role, content }),
  });
  await handleResponse<Record<string, unknown>>(res, "Failed to add message");
}

export async function getThreadMessages(threadId: string): Promise<BackboardMessage[]> {
  const res = await fetch(`${BACKBOARD_BASE_URL}/threads/${threadId}/messages`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await handleResponse<{ data?: BackboardMessage[] }>(
    res,
    "Failed to fetch thread messages"
  );
  return data.data ?? [];
}
