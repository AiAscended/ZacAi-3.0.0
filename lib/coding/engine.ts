/**
 * ==========================================================
 * File: /lib/coding/engine.ts
 * Project: ZacAI 3.0
 * Role: World-Class Coding Domain Engine & Orchestrator
 * Description:
 *   - Serves as the central processing unit for all coding-related AI tasks.
 *   - Orchestrates specialized coding tools (executor, linter, security scanner, etc.).
 *   - Leverages the core AI engine (LLM) for intelligent task routing and generation.
 *   - Integrates memory, feedback, explainability, moderation, and collaboration.
 *   - Supports multimodal input/output and efficient batch processing.
 * Advanced Features:
 *   - LLM-driven tool selection and execution based on user intent.
 *   - Contextual memory management (short-term, long-term, user, project).
 *   - Built-in safety and moderation for generated code.
 *   - Comprehensive explainability and trace logging for every decision.
 *   - Scalable batch processing and real-time streaming capabilities.
 *   - Adaptive learning via user feedback.
 * Future Enhancements:
 *   - Integration with version control systems (Git).
 *   - Real-time performance monitoring and auto-tuning.
 *   - Advanced self-correction and iterative refinement cycles for code.
 * ==========================================================
 */

import fs from "fs/promises";
import path from "path";
import LRU from "lru-cache";

// --- CORE AI ENGINE (LLM) IMPORTS ---
import { infer } from "../ai-engine/engine"; // The main LLM inference function
import * as aiEngineDetectors from "../ai-engine/detectors"; // For general domain detection (if needed here)
import * as aiEngineMemory from "../ai-engine/memory"; // General AI memory (can be shared/extended)

// --- CODING DOMAIN TOOL IMPORTS ---
import * as codeExecutor from "./tools/code-executor";
import * => {
  const llmResponse = await infer(`Analyze the user's prompt and provided context to determine the primary coding task. Based on this, which of the following tools should be invoked, or should I directly generate code?
    Available Tools:
    ${Object.keys(toolRegistry).map(tool => `- ${tool}: ${toolDescriptions[tool] || 'No description available.'}`).join('\n')}
    
    User Prompt: "${prompt}"
    Context: ${JSON.stringify(context, null, 2)}
    
    Respond in JSON format with a single key "tool" (string, tool name or "code_generation") and an optional "args" (object for tool arguments). If "tool" is "code_generation", "args" is not needed.
    Example: {"tool": "executeCode", "args": {"code": "print('hello')", "lang": "python"}}
    Example: {"tool": "code_generation"}
    `);

  let toolDecision: { tool: string; args?: any };
  try {
    toolDecision = JSON.parse(llmResponse.text);
    if (!toolDecision || typeof toolDecision.tool !== 'string') {
      throw new Error("Invalid LLM tool decision format.");
    }
  } catch (parseError) {
    console.warn(`[CodingEngine] LLM returned malformed tool decision: ${llmResponse.text}. Defaulting to code generation.`, parseError);
    toolDecision = { tool: "code_generation" };
  }

  const selectedTool = toolRegistry[toolDecision.tool];
  let result: any;
  let toolExecuted = false;

  // --- Step 2: Execute Tool or Generate Code ---
  if (selectedTool && toolDecision.tool !== "code_generation") {
    logActivity("tool_selection", { tool: toolDecision.tool, args: toolDecision.args });
    // Safety check: ensure tool is allowed to be called with provided args
    const safeArgs = sanitizeToolArgs(toolDecision.args || {}, toolDecision.tool);
    try {
      result = await selectedTool(...Object.values(safeArgs)); // Pass arguments dynamically
      toolExecuted = true;
    } catch (toolError: any) {
      logActivity("tool_execution_error", { tool: toolDecision.tool, error: toolError.message, prompt });
      // Fallback: If tool fails, try direct code generation
      result = await infer(`Tool ${toolDecision.tool} failed with error: ${toolError.message}. Please generate code for: ${prompt}`);
    }
  } else {
    // Fallback or direct generation if LLM decided not to use a specific tool
    logActivity("code_generation", { prompt });
    // Incorporate prompt templates for generation
    const template = await loadPromptTemplate('generate.txt');
    const fullPrompt = template.replace('{task}', prompt);
    result = await infer(fullPrompt, { context: { ...context, memory: currentMemory } });
  }

  // --- Step 3: Post-processing, Memory Update, Feedback, Explainability ---
  // Apply moderation checks to the generated code or tool output
  const isOutputSafe = await moderation.isSafeCode(result?.code || result?.output || JSON.stringify(result));
  if (!isOutputSafe) {
    logActivity("moderation_alert", { prompt, output: result, reason: "Unsafe content detected" });
    // Handle unsafe content: censor, block, or return a warning
    return { error: "Output contained unsafe content and was blocked." };
  }

  // Update memory with current interaction
  const interactionId = `${context.userId || 'anon'}:${context.sessionId || 'default'}:${Date.now()}`;
  await memory.updateCodingMemory(context.userId, context.sessionId, {
    history: [
      ...(currentMemory.history || []),
      {
        id: interactionId,
        prompt: prompt,
        toolUsed: toolExecuted ? toolDecision.tool : "code_generation",
        toolArgs: toolExecuted ? toolDecision.args : undefined,
        code: result?.code || result?.output || JSON.stringify(result),
        result: JSON.stringify(result),
        timestamp: Date.now()
      }
    ]
  }, context.projectId);

  // Generate explainability trace
  const explanation = await explainability.explainCodeAction(
    toolExecuted ? `Executed tool: ${toolDecision.tool}` : "Generated code directly",
    { prompt, result, toolDecision }
  );
  result.explanation = explanation; // Attach explanation to the result

  // Plugin post-processing
  const pluginResultPost = await pluginManager.runCodingPlugins("postProcess", { prompt, context, result, domain, concept });
  if (pluginResultPost?.handled) {
    result = pluginResultPost.result;
  }

  // Caching (only for "found" concepts, not tool outputs)
  if (result && (result.source === "seed" || result.source === "learnt" || result.source === "api" || result.source === "semantic")) {
    cache.set(concept, result);
  }

  logActivity("process_complete", { prompt, toolUsed: toolExecuted ? toolDecision.tool : "code_generation", resultSummary: result.code?.substring(0, 50) || JSON.stringify(result).substring(0, 50) });

  return result;
}

/**
 * Handles batch processing of multiple coding prompts.
 * Leverages the batch.ts utility for parallel execution.
 */
export async function batchProcess(
  prompts: string[],
  context: Record<string, any> = {}
): Promise<any[]> {
  logActivity("batch_process_start", { count: prompts.length });
  const results = await batch.batchProcess(prompts, (p) => process(p, context));
  logActivity("batch_process_end", { count: prompts.length });
  return results;
}

/**
 * Streams large responses, especially for code blocks or lengthy explanations.
 * Leverages the stream.ts utility.
 */
export async function* streamProcess(prompt: string, context: Record<string, any> = {}) {
  logActivity("stream_process_start", { prompt });
  const fullResult = await process(prompt, context); // Process to get full result first
  const contentToStream = fullResult?.code || fullResult?.output || JSON.stringify(fullResult);
  if (typeof contentToStream === "string") {
    yield* stream.streamCodeResponse(contentToStream); // Use dedicated streaming utility
  } else {
    yield JSON.stringify(fullResult); // Fallback for non-string results
  }
  logActivity("stream_process_end", { prompt });
}

/**
 * Extracts a primary concept from a prompt, for caching/retrieval.
 * This can be enhanced with LLM-based concept extraction.
 */
function extractConcept(prompt: string): string {
  // Use a more sophisticated method, possibly LLM, or regex
  const match = prompt.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/); // First alphanumeric word
  return match ? match[0].toLowerCase() : prompt.trim().toLowerCase();
}

/**
 * Logs activity for monitoring and debugging.
 */
function logActivity(event: string, details: any) {
  console.log(`[CodingEngine] ${event}`, JSON.stringify(details, null, 2));
}

/**
 * Loads a prompt template from the file system.
 */
async function loadPromptTemplate(templateFileName: string): Promise<string> {
  try {
    return await fs.readFile(path.join(PROMPT_TEMPLATES_DIR, templateFileName), "utf-8");
  } catch (error) {
    console.error(`[CodingEngine] Failed to load prompt template ${templateFileName}:`, error);
    return "{task}"; // Fallback to a basic template
  }
}

/**
 * Sanitizes tool arguments to prevent injection or abuse.
 * This is a critical security measure.
 */
function sanitizeToolArgs(args: any, toolName: string): any {
  // Implement robust sanitization based on tool expectations.
  // For example, for code execution, ensure code only uses allowed characters,
  // or restrict file paths, etc. This would likely involve a more complex validation schema.
  return args; // Placeholder: implement real sanitization
}
