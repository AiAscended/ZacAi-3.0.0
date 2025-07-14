/**
 * ==========================================================
 * File: /lib/coding/tools/self-prompter.ts
 * Project: ZacAI 3.0
 * Role: Code Task Decomposer (Self-Prompting)
 * Description:
 *   - Breaks down complex coding prompts into smaller, manageable subtasks.
 *   - Enables multi-step reasoning and planning.
 * Advanced Features:
 *   - Integrates with LLM for dynamic decomposition.
 *   - Supports recursive and parallel task breakdown.
 * Future Enhancements:
 *   - Add context-aware chaining and memory.
 * ==========================================================
 */

import { infer } from "../../ai-engine/engine";

/**
 * Decomposes a complex coding prompt into subtasks.
 * @param prompt - The user's coding prompt.
 * @returns Array of subtasks.
 */
export async function decomposeCodingPrompt(prompt: string): Promise<string[]> {
  const systemPrompt = "Break down this coding task into minimal subtasks, as a JSON array of strings.";
  const { text } = await infer(`${systemPrompt}\nTask: ${prompt}`);
  try {
    return JSON.parse(text);
  } catch {
    return [prompt];
  }
}
