/**
 * ==========================================================
 * File: /lib/ai-engine/detectors.ts
 * Project: ZacAI 3.0
 * Role: Domain Detection & Task Decomposition
 * Description:
 *   - Uses the core AI engine to classify prompts and break down complex tasks.
 *   - Enables advanced orchestration and multi-domain reasoning.
 * Advanced Features:
 *   - LLM-powered classification and decomposition.
 *   - Easily extensible for new domains.
 * Future Enhancements:
 *   - Add confidence scoring.
 *   - Support for hierarchical decomposition.
 * ==========================================================
 */

import { infer } from "./engine";

/**
 * Detects the most relevant domain for a given prompt.
 * @param prompt - The user input.
 * @param context - Additional context.
 * @returns The detected domain as a string.
 */
export async function detectDomain(prompt: string, context: any) {
  const systemPrompt = "Classify the following prompt into one of these domains: coding, mathematics, vocabulary, grammar, user, system.";
  const { text } = await infer(`${systemPrompt}\nPrompt: ${prompt}`);
  return text.trim().toLowerCase();
}

/**
 * Breaks a complex prompt into minimal sub-tasks, each with a domain and content.
 * @param prompt - The user input.
 * @param context - Additional context.
 * @returns Array of { domain, content } objects.
 */
export async function decomposeTasks(prompt: string, context: any) {
  const systemPrompt = "Break down the following prompt into minimal tasks, each with a domain and content. Respond as JSON array: [{domain, content}].";
  const { text } = await infer(`${systemPrompt}\nPrompt: ${prompt}`);
  try {
    return JSON.parse(text);
  } catch {
    return [{ domain: await detectDomain(prompt, context), content: prompt }];
  }
}
