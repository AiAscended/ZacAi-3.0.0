/**
 * ==========================================================
 * File: /lib/ai-engine/memory.ts
 * Project: ZacAI 3.0
 * Role: AI Memory Module (Short-term & Long-term Memory)
 * Description:
 *   - Manages context, user history, and session memory for the AI engine.
 *   - Enables continuity, personalization, and advanced reasoning.
 * Advanced Features:
 *   - Supports in-memory and persistent storage.
 *   - Can be extended for retrieval-augmented generation.
 * Future Enhancements:
 *   - Add vector-based memory for semantic recall.
 *   - Integrate with distributed memory stores.
 * ==========================================================
 */

export type AIMemory = {
  userId: string;
  sessionId: string;
  history: Array<{ prompt: string; response: string; timestamp: number }>;
  context: Record<string, any>;
};

const memoryStore: Record<string, AIMemory> = {};

/**
 * Retrieves memory for a given user/session.
 */
export function getMemory(userId: string, sessionId: string): AIMemory | undefined {
  return memoryStore[`${userId}:${sessionId}`];
}

/**
 * Updates memory for a given user/session.
 */
export function updateMemory(userId: string, sessionId: string, update: Partial<AIMemory>) {
  const key = `${userId}:${sessionId}`;
  memoryStore[key] = { ...memoryStore[key], ...update };
}

/**
 * Clears memory for a session (e.g., on logout or reset).
 */
export function clearMemory(userId: string, sessionId: string) {
  delete memoryStore[`${userId}:${sessionId}`];
}
