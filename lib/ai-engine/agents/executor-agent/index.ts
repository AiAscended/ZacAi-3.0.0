/**
 * ==========================================================
 * File: /lib/ai-engine/agents/executor-agent/index.ts
 * Project: ZacAI 3.0
 * Role: Multi-Agent System - Executor Agent
 * Description:
 *   - Specializes in executing a specific tool or function.
 *   - Acts as a bridge between the multi-agent planning system and core AI tools.
 * ==========================================================
 */

import { Agent, AgentContext, AgentResponse, registerAgent } from '../agent-registry';
import { generateTraceStep } from '../../explainability';
// Import your core AI tools that this agent might execute
import * as codeExecutor from '../../../coding/tools/code-executor';
import * as linter from '../../../coding/tools/linter';
// ... import other tools as needed by this agent

class ExecutorAgent implements Agent {
  name = 'ExecutorAgent';
  description = 'Executes specific tools or functions. Handles operations like code execution, linting, running tests, or calling external APIs.';

  /**
   * Determines if the ExecutorAgent can handle the given task.
   * This agent handles tasks explicitly asking for tool execution.
   * The task format should be specific, e.g., "execute: toolName with args".
   * @param task The task description.
   * @param context The agent context.
   * @returns A Promise resolving to true if the agent can handle the task, false otherwise.
   */
  async canHandle(task: string, context: AgentContext): Promise<boolean> {
    generateTraceStep("ExecutorAgent CanHandle Check", { task: task.slice(0, 50) + "..." });
    // This agent can handle tasks formatted as explicit tool execution requests
    // Example task: "executeTool: codeExecutor.executeCode { code: 'print("hello")' }"
    // A more sophisticated check might involve an LLM call to parse the intent.
    const can = task.startsWith("executeTool:");
    generateTraceStep("ExecutorAgent CanHandle Result", { task: task.slice(0, 50) + "...", canHandle: can });
    return Promise.resolve(can);
  }

  /**
   * Processes the tool execution task.
   * @param task The task string, expected to be in a format like "executeTool: toolName {jsonArgs}".
   * @param context The agent context.
   * @returns A Promise resolving to an AgentResponse with the tool's output.
   */
  async process(task: string, context: AgentContext): Promise<AgentResponse> {
    generateTraceStep("ExecutorAgent Process Started", { task: task.slice(0, 100) + "..." });

    try {
      if (!task.startsWith("executeTool:")) {
        throw new Error("Invalid task format for ExecutorAgent. Expected 'executeTool: toolName {jsonArgs}'.");
      }

      const parts = task.substring("executeTool:".length).trim().split(/ (.+)/s); // Split by first space
      const toolPath = parts[0]; // e.g., "codeExecutor.executeCode"
      const jsonArgsString = parts[1]; // e.g., "{ code: '...' }"

      let args: any;
      try {
        args = jsonArgsString ? JSON.parse(jsonArgsString) : {};
      } catch (jsonError) {
        throw new Error(`Invalid JSON arguments for tool execution: ${jsonError}. Args string: "${jsonArgsString}"`);
      }

      const [toolModule, toolFunction] = toolPath.split('.');

      let toolResult: any;
      switch (toolModule) {
        case 'codeExecutor':
          if (toolFunction === 'executeCode') {
            generateTraceStep("ExecutorAgent Executing Code", { codeLength: args.code?.length, language: args.language });
            toolResult = await codeExecutor.executeCode(args.code, args.language);
          } else {
            throw new Error(`Unsupported codeExecutor function: ${toolFunction}`);
          }
          break;
        case 'linter':
          if (toolFunction === 'lint') {
            generateTraceStep("ExecutorAgent Linting Code", { codeLength: args.code?.length });
            toolResult = await linter.lint(args.code, context);
          } else {
            throw new Error(`Unsupported linter function: ${toolFunction}`);
          }
          break;
        // Add more cases for other tool modules as needed
        default:
          throw new Error(`Unsupported tool module: ${toolModule}`);
      }

      generateTraceStep("ExecutorAgent Process Completed", { toolResultSummary: JSON.stringify(toolResult).slice(0, 100) + "..." });
      return {
        success: true,
        output: toolResult,
        agentName: this.name,
        taskSummary: `Successfully executed ${toolPath}.`,
      };

    } catch (error: any) {
      generateTraceStep("ExecutorAgent Process Error", { error: error.message });
      console.error(`[ExecutorAgent] Error processing task '${task}': ${error.message}`);
      return {
        success: false,
        output: null,
        agentName: this.name,
        taskSummary: `Failed to execute tool: ${error.message}`,
        error: error.message,
      };
    }
  }
}

export const executorAgent = new ExecutorAgent();
// Registration will happen in ai-engine/agents/init.ts
