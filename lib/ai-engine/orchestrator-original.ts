/**
 * ==========================================================
 * File: /lib/ai-engine/orchestrator.ts
 * Project: ZacAI 3.0
 * Role: Main AI Orchestrator (Executive "Brain")
 * Description:
 *   - Receives user prompts and context.
 *   - Detects domains and decomposes tasks using the core AI engine.
 *   - Routes tasks to domain engines (coding, math, vocabulary, grammar, etc.).
 *   - Aggregates, post-processes, and returns unified responses.
 *   - Integrates plugins, semantic retrieval, and advanced observability.
 *   - Designed for Next.js, Web3, and future multimodal AI.
 * Advanced Features:
 *   - LLM-based domain detection and task decomposition.
 *   - Parallel/async multi-engine execution.
 *   - Plugin/hook system at every stage.
 *   - Semantic context augmentation.
 *   - Full traceability and streaming support.
 * Future Enhancements:
 *   - Add multimodal (image/audio) task routing.
 *   - Integrate advanced explainability and observability.
 *   - Support for distributed orchestration and edge AI.
 * ==========================================================
 */

import * as coding from "../coding/engine";
import * as mathematics from "../mathematics/engine";
import * as vocabulary from "../vocabulary/engine";
import * as grammar from "../grammar/engine";
import * as user from "../user/engine";
import * as system from "../system/engine";
import * as ai from "./engine"; // Core AI engine (your LLM)
import { detectDomain, decomposeTasks } from "./detectors";
import { aggregateResults } from "./aggregator";
import { runGlobalPlugins } from "../shared/plugin-manager";
import { semanticRetrieve } from "../shared/semantic-search";

// Registry of all available domain engines
const engines = { coding, mathematics, vocabulary, grammar, user, system };

// Main context interface for orchestration
export interface AIContext {
  userId?: string;
  sessionId?: string;
  preferences?: Record<string, any>;
  [key: string]: any;
}

/**
 * Main entrypoint for processing user prompts.
 * - Runs pre-processing plugins.
 * - Uses AI engine for domain detection and task decomposition.
 * - Runs semantic retrieval for context.
 * - Executes all sub-tasks in parallel.
 * - Aggregates and post-processes results.
 * - Returns structured, traceable response.
 */
export async function processPrompt(
  prompt: string,
  context: AIContext = {}
): Promise<any> {
  // Run global pre-processing hooks (logging, tracing, moderation, etc.)
  await runGlobalPlugins("preProcess", { prompt, context });

  // Step 1: Use AI engine to detect domains and decompose tasks
  const tasks = await decomposeTasks(prompt, context);

  // Step 2: Semantic context augmentation for each sub-task
  const enrichedTasks = await Promise.all(tasks.map(async (task) => {
    const semanticContext = await semanticRetrieve(task.domain, task.content);
    return { ...task, semanticContext };
  }));

  // Step 3: Parallel/async execution of all sub-tasks
  const subTaskResults = await Promise.all(enrichedTasks.map(async (task) => {
    const engine = engines[task.domain];
    if (engine?.process) {
      return await engine.process(task.content, { ...context, semanticContext: task.semanticContext });
    }
    return { error: `No engine for domain ${task.domain}` };
  }));

  // Step 4: Aggregate results into a unified answer using AI engine
  const finalResult = await aggregateResults(prompt, subTaskResults, context);

  // Step 5: Post-processing plugins/hooks (explainability, Web3 signing, etc.)
  await runGlobalPlugins("postProcess", { prompt, context, finalResult });

  // Step 6: Return structured, traceable, and extensible response
  return {
    prompt,
    tasks,
    subTaskResults,
    finalResult,
    timestamp: Date.now(),
    traceId: generateTraceId(),
  };
}

/**
 * Generates a unique trace ID for observability and debugging.
 */
function generateTraceId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
