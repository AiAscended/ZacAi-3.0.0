// /lib/ai-engine/agents/init.ts
import { registerAgent } from './agent-registry';
import { plannerAgent } from './planner-agent';
import { executorAgent } from './executor-agent'; // NEW: Import ExecutorAgent

/**
 * @function initializeAgents
 * @description Registers all specialized AI agents with the global agent registry.
 */
export function initializeAgents(): void {
  registerAgent(plannerAgent);
  registerAgent(executorAgent); // NEW: Register ExecutorAgent

  // Register other agents as they are implemented
  // import { codeReviewAgent } from './code-review-agent';
  // registerAgent(codeReviewAgent);

  console.log("[AgentInit] All specialized agents initialized and registered.");
}
