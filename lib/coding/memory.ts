/**
 * ==========================================================
 * File: /lib/coding/memory.ts
 * Project: ZacAI 3.0
 * Role: Coding Session & User Memory
 * Description:
 *   - Stores and retrieves coding session, user, and project context.
 *   - Enables personalization, context chaining, and advanced reasoning.
 * Advanced Features:
 *   - Supports in-memory and persistent storage.
 *   - Can be extended for retrieval-augmented coding.
 * Future Enhancements:
 *   - Integrate with distributed or cloud memory stores.
 * ==========================================================
 */

export type CodingMemory = {
  userId: string;
  sessionId: string;
  projectId?: string;
  history: Array<{ prompt: string; code: string; result: string; timestamp: number }>;
  preferences?: Record<string, any>;
};

const memoryStore: Record<string, CodingMemory> = {};

/**
 * Retrieves memory for a given user/session/project.
 */
export function getCodingMemory(userId: string, sessionId: string, projectId?: string): CodingMemory | undefined {
  const key = [userId, sessionId, projectId].filter(Boolean).join(":");
  return memoryStore[key];
}

/**
 * Updates memory for a given user/session/project.
 */
export function updateCodingMemory(userId: string, sessionId: string, update: Partial<CodingMemory>, projectId?: string) {
  const key = [userId, sessionId, projectId].filter(Boolean).join(":");
  memoryStore[key] = { ...memoryStore[key], ...update };
}

/**
 * Clears memory for a session or project.
 */
export function clearCodingMemory(userId: string, sessionId: string, projectId?: string) {
  const key = [userId, sessionId, projectId].filter(Boolean).join(":");
  delete memoryStore[key];
}
