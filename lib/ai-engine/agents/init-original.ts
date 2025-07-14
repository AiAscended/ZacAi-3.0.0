/**
 * ==========================================================
 * File: /lib/ai-engine/agents/init.ts
 * Project: ZacAI 3.0
 * Role: Multi-Agent System - Initialization
 * Description:
 *   - Centralizes the registration of all specialized AI agents.
 *   - Ensures that all agents are known to the agent registry before the system starts.
 * ==========================================================
 */

import { registerAgent } from './agent-registry';
import { plannerAgent } from './planner-agent'; // Your first specialized agent
// Import other agents here as you create them
// import { codeReviewAgent } from './code-review-agent';
// import { dataAnalysisAgent } from './data-analysis-agent';

/**
 * @function initializeAgents
 * @description Registers all specialized AI agents with the global agent registry.
 */
export function initializeAgents(): void {
  // Register the Planner Agent
  registerAgent(plannerAgent);

  // Register other agents as they are implemented
  // registerAgent(codeReviewAgent);
  // registerAgent(dataAnalysisAgent);

  console.log("[AgentInit] All specialized agents initialized and registered.");
}
