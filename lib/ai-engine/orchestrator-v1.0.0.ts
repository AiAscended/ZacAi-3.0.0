/**
 * ==========================================================
 * File: /lib/ai-engine/orchestrator.ts
 * Project: ZacAI 3.0
 * Role: Universal Multimodal AI Orchestrator
 * Description:
 *   - The central nervous system for ZacAI, orchestrating all user interactions.
 *   - Dynamically detects user intent and domain (e.g., coding, math, science, etc.).
 *   - Routes prompts and multimodal inputs to specialized domain engines for processing.
 *   - Manages global context, memory, safety, and rate-limiting across the entire system.
 *   - Aggregates and synthesizes responses from various engines into a cohesive output.
 *   - Designed for high extensibility, supporting new knowledge domains and capabilities with ease.
 * Advanced Features:
 *   - LLM-driven domain detection and smart task decomposition for complex requests.
 *   - Seamless integration of multimodal inputs (text, image, audio, etc.).
 *   - Comprehensive context chaining: passes relevant user, session, and project memory to sub-engines.
 *   - Robust error handling, real-time tracing, and explainability for every decision point.
 *   - Future-proof architecture: ready for multi-agent systems and external API orchestrations.
 * ==========================================================
 */

// --- Core AI Engine & Utility Imports ---
// `infer` is the primary function for interacting with the foundational LLM.
import { infer } from "./engine";
// `detectors` module handles sophisticated domain and intent recognition.
import * as detectors from "./detectors";
// `memory` manages global user, session, and conversation history.
import * as memory from "./memory";
// `safety` provides content moderation and harmful prompt detection.
import * as safety from "./safety";
// `rateLimiter` controls usage to prevent abuse and manage resources.
import * as rateLimiter from "./rate-limiter";
// `explainability` generates human-readable traces of the AI's decision-making process.
import * as explainability from "./explainability";
// `multimodal` processes and integrates non-textual inputs (images, audio, etc.).
import * as multimodal from "./multimodal";
// `runGlobalPlugins` enables system-wide pre- and post-processing hooks.
import { runGlobalPlugins } from "../shared/plugin-manager";

// --- Domain-Specific Engine Imports ---
// Each domain engine encapsulates the specialized logic and tools for its area.
// As new domains are added, import them here.
import * as coding from "../coding/engine";
import * as mathematics from "../mathematics/engine";
import * as vocabulary from "../vocabulary/engine";
import * as grammar from "../grammar/engine";

// --- Future Domain Engines (Uncomment and implement as needed) ---
// To add a new domain like Science or Geography:
// 1. Create the engine file: /lib/<domain_name>/engine.ts (e.g., /lib/science/engine.ts)
// 2. Import it here: import * as science from "../science/engine";
// 3. Add it to the `domainEngines` registry below.
// import * as science from "../science/engine";
// import * as geography from "../geography/engine";
// import * as medical from "../medical/engine";
// import * as legal from "../legal/engine";

// --- Type Definitions for Clarity and Robustness ---

/**
 * @interface AIContext
 * @description Represents the comprehensive context for a user's interaction.
 * Includes identifiers, session data, and processed multimodal inputs.
 */
interface AIContext {
  userId: string;
  sessionId: string;
  projectId?: string; // Optional: for project-specific context
  multimodalInput?: any; // Raw multimodal data (e.g., image URL, audio buffer)
  multimodalProcessed?: any; // Processed multimodal data (e.g., image description)
  [key: string]: any; // Allows for flexible additional context properties
}

/**
 * @interface PromptTask
 * @description Defines a single unit of work derived from a user's prompt.
 * Used when breaking down complex prompts into smaller, domain-specific tasks.
 */
interface PromptTask {
  id: string; // Unique identifier for the task
  originalPrompt: string; // The full original prompt
  content: string; // The specific part of the prompt relevant to this task
  domain: string; // The detected domain for this task
  subTasks?: PromptTask[]; // Optional: for nested task decomposition
  [key: string]: any; // Allows for task-specific metadata
}

/**
 * @interface OrchestrationResult
 * @description The comprehensive output structure from the orchestrator.
 * Includes the final response, an execution trace, and any warnings or errors.
 */
interface OrchestrationResult {
  response: any; // The aggregated and synthesized final response
  trace: string; // A detailed, human-readable log of the orchestration process
  warnings?: string[]; // Non-critical issues encountered during processing
  errors?: string[]; // Critical errors that impacted the processing
}

// --- Domain Engine Registry ---
/**
 * @const domainEngines
 * @description A central mapping of domain names to their respective engine modules.
 * This registry allows the orchestrator to dynamically route prompts to the correct handler.
 * Each engine must expose a `process` method that takes `task: string` and `context: any`.
 */
const domainEngines: { [key: string]: { process: (task: string, context: any) => Promise<any> } } = {
  coding,
  mathematics,
  vocabulary,
  grammar,
  // --- Future Domains ---
  // science,   // Uncomment when the /lib/science/engine.ts is implemented
  // geography, // Uncomment when the /lib/geography/engine.ts is implemented
  // medical,   // Uncomment when the /lib/medical/engine.ts is implemented
  // legal,     // Uncomment when the /lib/legal/engine.ts is implemented

  // Fallback for general queries not handled by specific domains.
  // This can be a direct call to the core LLM (`infer`) or a dedicated "general" engine.
  general: { process: (task: string, context: any) => infer(task, { context }) },
};

// --- Main Orchestrator Function ---
/**
 * @function processPrompt
 * @description The core orchestration logic. It takes a user prompt and context,
 * and intelligently processes it through the appropriate AI modules and domain engines.
 * @param prompt The user's input string.
 * @param context Comprehensive context including userId, sessionId, and other relevant data.
 * @returns A Promise resolving to an OrchestrationResult containing the response, trace, warnings, and errors.
 */
export async function processPrompt(prompt: string, context: AIContext): Promise<OrchestrationResult> {
  // Initialize trace, warnings, and errors for this specific request.
  const traceSteps: { step: string; info: any }[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    traceSteps.push({ step: "Orchestration Start", info: { prompt, contextSummary: { userId: context.userId, sessionId: context.sessionId, projectId: context.projectId, multimodal: !!context.multimodalInput } } });

    // --- 1. Global Pre-processing, Plugin Hooks, Safety, and Rate Limiting ---
    // Execute global pre-processing plugins. These can modify the prompt or context.
    await runGlobalPlugins("preProcessPrompt", { prompt, context });
    traceSteps.push({ step: "Global Pre-processing Plugins Executed", info: {} });

    // Perform system-wide safety checks on the input prompt.
    if (!await safety.isSafePrompt(prompt)) {
      errors.push("Prompt contained unsafe content. Request blocked.");
      return { response: { error: "Unsafe content detected in prompt. Request cannot be processed." }, trace: explainability.generateTrace(traceSteps), errors };
    }
    traceSteps.push({ step: "Prompt Safety Check Passed", info: {} });

    // Enforce rate limits to prevent abuse and manage system load.
    if (rateLimiter.isRateLimited(context.userId)) {
      errors.push("Rate limit exceeded for user.");
      return { response: { error: "Rate limit exceeded. Please try again later." }, trace: explainability.generateTrace(traceSteps), errors };
    }
    traceSteps.push({ step: "Rate Limit Check Passed", info: {} });

    // --- 2. Multimodal Input Processing ---
    // If multimodal input is present, process it using the dedicated multimodal engine.
    if (context.multimodalInput) {
      if (multimodal.processMultimodalInput) { // Check if the function exists
        context.multimodalProcessed = await multimodal.processMultimodalInput(context.multimodalInput);
        traceSteps.push({ step: "Multimodal Input Processed", info: { resultSummary: JSON.stringify(context.multimodalProcessed).slice(0, 100) } });
      } else {
        warnings.push("Multimodal input provided but no processor found.");
        traceSteps.push({ step: "Multimodal Processing Skipped", info: { reason: "No processor" } });
      }
    }

    // --- 3. Retrieve and Attach Global Memory/Context ---
    // Fetch and attach global conversational memory and user preferences to the context.
    const globalMemory = await memory.getMemory(context.userId, context.sessionId);
    context.globalMemory = globalMemory; // Make available to all downstream engines.
    traceSteps.push({ step: "Global Memory Retrieved", info: { memorySizeKB: JSON.stringify(globalMemory).length / 1024 } });

    // --- 4. Intent and Domain Detection (LLM-powered) ---
    // Use an LLM-powered detector to determine the primary domain of the prompt.
    let detectedDomain = await detectors.detectDomain(prompt, globalMemory, context.multimodalProcessed);
    // Fallback to 'general' if detection fails or domain engine is not registered.
    if (!detectedDomain || !domainEngines[detectedDomain]) {
      detectedDomain = "general";
      warnings.push(`Detected domain "${detectedDomain}" is not registered or detection failed. Falling back to "general" engine.`);
    }
    traceSteps.push({ step: "Domain Detected", info: { domain: detectedDomain } });

    // --- 5. Task Decomposition (LLM-powered, for complex prompts) ---
    // Leverage the core LLM to break down complex prompts into atomic, executable tasks.
    // This allows multi-step reasoning and multi-domain interactions.
    let tasksToProcess: PromptTask[] = [];
    try {
      // Prompt the LLM to return a JSON array of sub-task strings.
      const decompositionPrompt = `You are a task decomposer. Decompose the following user prompt into a JSON array of minimal, atomic sub-tasks. Each sub-task should be a concise string. If the prompt is already atomic, return it as a single-element array. Consider the detected domain "${detectedDomain}".
        Prompt: "${prompt}"
        Multimodal Context: ${context.multimodalProcessed ? JSON.stringify(context.multimodalProcessed) : "N/A"}
        Previous Conversation History: ${globalMemory?.sessionHistory?.slice(-3).map((h: any) => h.prompt + " -> " + h.response).join("; ") || "N/A"}
        Respond with only the JSON array, e.g., ["subtask 1", "subtask 2"].`;

      const { text: decompositionJson } = await infer(decompositionPrompt, { context: { ...context, globalMemory } });
      const decomposedContent = JSON.parse(decompositionJson);

      if (Array.isArray(decomposedContent) && decomposedContent.length > 0) {
        tasksToProcess = decomposedContent.map((subTaskContent: string, idx: number) => ({
          id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          originalPrompt: prompt,
          content: subTaskContent,
          domain: detectedDomain, // Assume same domain for now, or refine with LLM
        }));
      } else {
        // Fallback if decomposition fails or returns empty array.
        tasksToProcess = [{ id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, originalPrompt: prompt, content: prompt, domain: detectedDomain }];
      }
    } catch (decompError: any) {
      warnings.push(`Task decomposition failed: ${decompError.message}. Processing as a single task.`);
      tasksToProcess = [{ id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, originalPrompt: prompt, content: prompt, domain: detectedDomain }];
    }
    traceSteps.push({ step: "Task Decomposition Complete", info: { tasksCount: tasksToProcess.length, tasks: tasksToProcess.map(t => t.content).join(" | ") } });


    // --- 6. Route to Domain Engines and Process Tasks ---
    const engineResponses: any[] = [];
    for (const task of tasksToProcess) {
      const engine = domainEngines[task.domain];
      if (engine) {
        traceSteps.push({ step: `Routing to ${task.domain} Engine`, info: { taskContent: task.content.slice(0, 50) + "..." } });
        try {
          // Each domain engine's `process` method will internally handle tool selection, memory, etc.
          const engineResponse = await engine.process(task.content, { ...context, taskData: task });
          engineResponses.push(engineResponse);
          traceSteps.push({ step: `${task.domain} Engine Response Received`, info: { responseSummary: JSON.stringify(engineResponse).slice(0, 100) + "..." } });
        } catch (engineError: any) {
          errors.push(`Error in ${task.domain} engine for task "${task.id}": ${engineError.message}`);
          traceSteps.push({ step: `${task.domain} Engine Error`, info: { error: engineError.message, taskContent: task.content.slice(0, 50) + "..." } });
          engineResponses.push({ error: `Failed to process task in ${task.domain} engine: ${engineError.message}` });
        }
      } else {
        // Fallback: If no specific engine, route to the 'general' LLM directly.
        warnings.push(`No specific engine registered for domain: "${task.domain}". Falling back to general LLM for task "${task.id}".`);
        try {
          const generalResponse = await infer(task.content, { context: { ...context, globalMemory, multimodalProcessed: context.multimodalProcessed } });
          engineResponses.push(generalResponse);
          traceSteps.push({ step: "General LLM Fallback Response", info: { responseSummary: JSON.stringify(generalResponse).slice(0, 100) + "..." } });
        } catch (llmError: any) {
          errors.push(`Error in general LLM fallback for task "${task.id}": ${llmError.message}`);
          engineResponses.push({ error: `Failed to get general response for task: ${llmError.message}` });
        }
      }
    }

    // --- 7. Aggregation and Synthesis (LLM-powered) ---
    // Use the core LLM to synthesize a single, cohesive, and contextually rich response
    // from the outputs of potentially multiple domain engines or sub-tasks.
    const aggregationPrompt = `You are an AI orchestrator. Synthesize a single, comprehensive, and helpful response based on the original prompt, the processed sub-tasks, and the responses from various AI engines.
      Original Prompt: "${prompt}"
      Multimodal Context: ${context.multimodalProcessed ? JSON.stringify(context.multimodalProcessed) : "N/A"}
      Processed Sub-tasks: ${tasksToProcess.map(t => `${t.domain}: "${t.content}"`).join("; ")}
      Engine Outputs: ${JSON.stringify(engineResponses)}
      Previous Conversation History: ${globalMemory?.sessionHistory?.slice(-3).map((h: any) => h.prompt + " -> " + h.response).join("; ") || "N/A"}
      Ensure the response directly addresses the user's original intent.`;

    const finalResponse = await infer(aggregationPrompt, {
      context: { ...context, globalMemory, engineOutputs: engineResponses, originalTasks: tasksToProcess },
    });
    traceSteps.push({ step: "Responses Aggregated & Synthesized", info: { finalResponseSummary: JSON.stringify(finalResponse).slice(0, 100) + "..." } });

    // --- 8. Global Post-processing, Memory Update, and Plugin Hooks ---
    // Update global memory with the latest interaction for future context.
    await memory.updateMemory(context.userId, context.sessionId, {
      lastInteraction: { prompt, response: finalResponse, timestamp: Date.now() },
      sessionHistory: [...(globalMemory?.sessionHistory || []), { prompt, response: finalResponse, timestamp: Date.now() }]
    });
    traceSteps.push({ step: "Global Memory Updated", info: {} });

    // Execute global post-processing plugins. These can perform analytics, logging, etc.
    await runGlobalPlugins("postProcessPrompt", { prompt, context, response: finalResponse });
    traceSteps.push({ step: "Global Post-processing Plugins Executed", info: {} });

    traceSteps.push({ step: "Orchestration End", info: { status: "Success" } });

    // Return the final aggregated response along with the detailed trace.
    return { response: finalResponse, trace: explainability.generateTrace(traceSteps), warnings, errors };

  } catch (orchestrationError: any) {
    // Catch any unexpected errors during orchestration itself.
    errors.push(`Critical Orchestration Failure: ${orchestrationError.message}`);
    traceSteps.push({ step: "Critical Orchestration Error", info: { error: orchestrationError.message, stack: orchestrationError.stack } });
    console.error("[Orchestrator] Critical error during prompt processing:", orchestrationError); // Log to system console
    return {
      response: { error: "An unrecoverable internal error occurred. Please try again or contact support." },
      trace: explainability.generateTrace(traceSteps),
      warnings,
      errors,
    };
  }
}

// --- Helper Function for External API Integration ---
/**
 * @function handleUserRequest
 * @description A convenient wrapper for external systems (e.g., REST API, WebSocket)
 * to interact with the orchestrator.
 * @param userId Unique identifier for the user.
 * @param sessionId Unique identifier for the current session.
 * @param prompt The user's input string.
 * @param additionalContext Any extra context from the external system (e.g., multimodal data).
 * @returns A Promise resolving to an OrchestrationResult.
 */
export async function handleUserRequest(userId: string, sessionId: string, prompt: string, additionalContext: any = {}): Promise<OrchestrationResult> {
  const fullContext: AIContext = {
    userId,
    sessionId,
    ...additionalContext,
  };
  return processPrompt(prompt, fullContext);
}
