/**
 * ==========================================================
 * File: /lib/ai-engine/aggregator.ts
 * Project: ZacAI 3.0
 * Role: Result Aggregator & Composer
 * Description:
 *   - Aggregates sub-task results into a unified, user-friendly answer.
 *   - Uses the AI engine for advanced composition and summarization.
 * Advanced Features:
 *   - LLM-powered aggregation and explainability.
 *   - Pluggable for custom aggregation logic.
 * Future Enhancements:
 *   - Add support for multimodal and structured outputs.
 *   - Integrate with explainability plugins.
 * ==========================================================
 */

import { infer } from "./engine";

/**
 * Aggregates sub-task results into a single, clear, helpful response.
 * @param originalPrompt - The user's original prompt.
 * @param subTaskResults - Array of results from each domain engine.
 * @param context - Additional context.
 * @returns Aggregated answer as a string or object.
 */
export async function aggregateResults(originalPrompt: string, subTaskResults: any[], context: any) {
  const systemPrompt = "Given the original user prompt and these sub-task results, compose a single, clear, helpful response.";
  const { text } = await infer(`${systemPrompt}\nUser Prompt: ${originalPrompt}\nResults: ${JSON.stringify(subTaskResults)}`);
  return text;
}
