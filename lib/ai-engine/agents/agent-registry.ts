/**
 * ==========================================================
 * File: /lib/ai-engine/agents/agent-registry.ts
 * Project: ZacAI 3.0
 * Role: Multi-Agent System - Agent Registry
 * Description:
 *   - Defines the common interface for all AI agents.
 *   - Maintains a central registry of available specialized agents.
 *   - Facilitates dynamic discovery and invocation of agents by the orchestrator or other agents.
 * Advanced Features:
 *   - Type-safe agent definitions.
 *   - Extensible for adding new agent types and capabilities.
 * ==========================================================
 */

import { GlobalMemory } from "../memory"; // Global memory context
import { ProcessedMultimodalOutput } from "../multimodal"; // Processed multimodal data
import { generateTraceStep } from "../explainability"; // For tracing agent activities

/**
 * @interface AgentContext
 * @description The context passed to an agent for its operation.
 * Extends the orchestrator's AIContext with agent-specific details.
 */
export interface AgentContext {
  userId: string;
  sessionId: string;
  projectId?: string;
  originalPrompt: string; // The user's initial prompt
  globalMemory: GlobalMemory;
  multimodalProcessed?: ProcessedMultimodalOutput;
  traceId?: string; // Optional: Link to the overall orchestration trace
  [key: string]: any; // Additional dynamic context for the agent
}

/**
 * @interface AgentResponse
 * @description The structured response returned by an agent after processing a task.
 */
export interface AgentResponse {
  success: boolean;
  output: any; // The result of the agent's work (e.g., code, data, summary)
  agentName: string;
  taskSummary: string; // A brief summary of what the agent did
  logs?: string[]; // Internal logs from the agent's execution
  trace?: string; // Specific trace for this agent's execution
  suggestions?: any[]; // Suggestions from this agent for the user/orchestrator
  error?: string; // If the agent encountered an error
}

/**
 * @interface Agent
 * @description The common interface that all specialized AI agents must implement.
 */
export interface Agent {
  name: string; // Unique name of the agent (e.g., 'CodeReviewAgent', 'PlannerAgent')
  description: string; // A brief description of the agent's capabilities (for LLM to use)
  canHandle: (task: string, context: AgentContext) => Promise<boolean>; // Determines if agent can handle a task
  process: (task: string, context: AgentContext) => Promise<AgentResponse>; // The agent's core processing logic
  // Optional: inputSchema, outputSchema for more formal communication
}

// --- Agent Registry ---
const registeredAgents: Map<string, Agent> = new Map();

/**
 * @function registerAgent
 * @description Registers a new agent with the system.
 * @param agent The agent object to register.
 * @throws Error if an agent with the same name is already registered.
 */
export function registerAgent(agent: Agent): void {
  if (registeredAgents.has(agent.name)) {
    throw new Error(`Agent with name '${agent.name}' is already registered.`);
  }
  registeredAgents.set(agent.name, agent);
  generateTraceStep("Agent Registered", { agentName: agent.name, description: agent.description });
  console.log(`[AgentRegistry] Agent '${agent.name}' registered.`);
}

/**
 * @function getAgent
 * @description Retrieves a registered agent by its name.
 * @param name The name of the agent to retrieve.
 * @returns The Agent object, or undefined if not found.
 */
export function getAgent(name: string): Agent | undefined {
  return registeredAgents.get(name);
}

/**
 * @function listAgents
 * @description Returns a list of all registered agents' names and descriptions.
 * Useful for LLM selection.
 * @returns An array of agent names and descriptions.
 */
export function listAgents(): { name: string; description: string }[] {
  return Array.from(registeredAgents.values()).map(agent => ({
    name: agent.name,
    description: agent.description,
  }));
}

/**
 * @function findCapableAgents
 * @description Identifies agents capable of handling a given task based on their `canHandle` method.
 * @param task The task description.
 * @param context The agent context.
 * @returns A Promise resolving to an array of capable Agent objects.
 */
export async function findCapableAgents(task: string, context: AgentContext): Promise<Agent[]> {
  const capableAgents: Agent[] = [];
  for (const agent of registeredAgents.values()) {
    try {
      const canHandle = await agent.canHandle(task, context);
      if (canHandle) {
        capableAgents.push(agent);
      }
    } catch (error) {
      console.error(`[AgentRegistry] Error checking canHandle for agent '${agent.name}':`, error);
      generateTraceStep("Agent CanHandle Error", { agentName: agent.name, error: (error as Error).message });
    }
  }
  generateTraceStep("Capable Agents Found", { count: capableAgents.length, agents: capableAgents.map(a => a.name) });
  return capableAgents;
}

// Example of how agents will be registered (done in their own files)
// import { plannerAgent } from './planner-agent';
// registerAgent(plannerAgent);
